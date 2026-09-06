import { randomInt } from 'crypto';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CuentasRepository } from '../repositories/cuentas.repository';
import { VerificacionRepository } from '../repositories/verificacion.repository';
import { EmpresaRepository } from '../repositories/empresa.repository';
import { serviciosSeguridad } from '../../m20-seguridad/seguridad.routes';
import { servicioNotificaciones } from '../../m18-notificaciones/notificaciones.routes';
import {
  RegistroParticularDTO,
  VerificarCodigoDTO,
  ReenviarCodigoDTO,
  RegistroEmpresaDTO,
} from '../dtos';
import { ResultadoRegistro, UsuarioSeguro } from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - SERVICIO PRINCIPAL DE CUENTAS (HU-CUE-01, HU-CUE-03, HU-CUE-08)
// Orquesta el registro particular y corporativo con verificación por correo
// ==============================================================================

export class CuentasService {
  constructor(
    private readonly cuentasRepo: CuentasRepository,
    private readonly verificacionRepo: VerificacionRepository,
    private readonly empresaRepo: EmpresaRepository,
    private readonly credenciales = serviciosSeguridad.credenciales
  ) {}

  /**
   * Genera un código OTP numérico criptográficamente seguro de 6 dígitos.
   */
  private generarCodigoOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  /**
   * Convierte una entidad de base de datos en una estructura pública segura.
   * Jamás expone la columna `contrasena` (HU-SEG-06 / RF-SEG-01-04).
   */
  private sanitizarUsuario(usuario: {
    id_usuario: number;
    nombre: string;
    telefono: string | null;
    correo: string;
    estado: any;
    tipo: any;
    id_rol: number | null;
    rol_nombre?: string | null;
  }): UsuarioSeguro {
    return {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      correo: usuario.correo,
      estado: usuario.estado,
      tipo: usuario.tipo,
      id_rol: usuario.id_rol,
      rol_nombre: usuario.rol_nombre ?? null,
    };
  }

  /**
   * HU-CUE-01: Registro de cliente particular con código de verificación.
   * Crea la cuenta en condición no verificada ('pendiente') y despacha el OTP.
   */
  async registrarParticular(datos: RegistroParticularDTO): Promise<ResultadoRegistro> {
    const correoNormalizado = datos.correo.trim().toLowerCase();

    // 1. Validar unicidad de cuenta en todo el sistema (HU-CUE-08 / RF-CUE-08-01)
    const existente = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);
    if (existente) {
      // Rechaza el registro sin revelar más información que la existencia de un conflicto (CA-CUE-01-04)
      throw new AppError(
        'El correo indicado no está disponible para una nueva cuenta',
        409,
        'CONFLICT'
      );
    }

    // 2. Derivar hash BCrypt costo 12 mediante M20 (HU-SEG-01 / CA-SEG-01-02)
    const hashContrasena = await this.credenciales.derivarContrasena(datos.contrasena);

    // 3. Crear usuario en estado 'pendiente' y rol cliente (id_rol: 2)
    const usuarioCreado = await this.cuentasRepo.crearUsuario({
      nombre: datos.nombre.trim(),
      correo: correoNormalizado,
      telefono: datos.telefono.trim(),
      contrasena: hashContrasena,
      tipo: 'normal',
      estado: 'pendiente',
      id_rol: 2,
    });

    await this.cuentasRepo.asignarRolUsuario(usuarioCreado.id_usuario, 2);

    // 4. Generar y almacenar código OTP de 6 dígitos (Vigencia 15 minutos)
    const codigoOTP = this.generarCodigoOTP();
    await this.verificacionRepo.guardarCodigo(correoNormalizado, codigoOTP, 'registro', {
      id_usuario: usuarioCreado.id_usuario,
    });

    // 5. Emitir evento SMTP mediante M18 (HU-NOT-01)
    void servicioNotificaciones
      .procesarEvento(
        'REGISTRO_CLIENTE',
        correoNormalizado,
        {
          nombre: usuarioCreado.nombre,
          codigo: codigoOTP,
          vigencia_minutos: 15,
        },
        usuarioCreado.id_usuario
      )
      .catch((error) => {
        // Fallo en SMTP no detiene la transacción, queda registrado en trazabilidad
        console.error('[M04-Cuentas] Error despachando correo de activación:', error);
      });

    return {
      requiere_verificacion: true,
      mensaje: 'Cuenta registrada exitosamente. Hemos enviado un código de activación a su correo.',
      correo: correoNormalizado,
      tipo: 'normal',
      estado: 'pendiente',
    };
  }

  /**
   * HU-CUE-01: Confirmación de código de activación (CA-CUE-01-02).
   */
  async verificarCodigoActivacion(datos: VerificarCodigoDTO): Promise<{
    verificado: boolean;
    mensaje: string;
    usuario: UsuarioSeguro;
  }> {
    const correoNormalizado = datos.correo.trim().toLowerCase();

    // 1. Obtener registro de verificación activo
    const registroOTP = await this.verificacionRepo.obtenerCodigo(correoNormalizado, 'registro');
    if (!registroOTP) {
      throw new AppError(
        'El código de verificación ha expirado o no es válido. Solicite un reenvío.',
        400,
        'CODE_EXPIRED'
      );
    }

    // 2. Comprobar coincidencia exacta
    if (registroOTP.codigo !== datos.codigo.trim()) {
      const intentos = await this.verificacionRepo.incrementarIntentos(correoNormalizado, 'registro');
      if (intentos >= registroOTP.max_intentos) {
        throw new AppError(
          'Código incorrecto. Ha superado los intentos permitidos. Solicite un nuevo código.',
          400,
          'MAX_ATTEMPTS_EXCEEDED'
        );
      }
      throw new AppError('El código de verificación introducido no es correcto', 400, 'INVALID_CODE');
    }

    // 3. Obtener el usuario y pasarlo a estado 'activo'
    const usuario = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    await this.cuentasRepo.actualizarEstado(usuario.id_usuario, 'activo');
    await this.verificacionRepo.consumirCodigo(correoNormalizado, 'registro');
    usuario.estado = 'activo';

    return {
      verificado: true,
      mensaje: 'Cuenta verificada exitosamente. Ahora puede iniciar sesión con sus credenciales.',
      usuario: this.sanitizarUsuario(usuario),
    };
  }

  /**
   * HU-CUE-01: Reenvío de código de activación (RF-CUE-01-04).
   */
  async reenviarCodigoActivacion(datos: ReenviarCodigoDTO): Promise<{ mensaje: string }> {
    const correoNormalizado = datos.correo.trim().toLowerCase();
    const usuario = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);

    // Si el usuario no existe o ya está activo, respondemos uniformemente por seguridad (HU-SEG-06)
    if (!usuario || usuario.estado === 'activo') {
      return {
        mensaje: 'Si su cuenta se encuentra pendiente de verificación, se ha enviado un nuevo código a su correo.',
      };
    }

    const nuevoCodigo = this.generarCodigoOTP();
    await this.verificacionRepo.guardarCodigo(correoNormalizado, nuevoCodigo, 'registro', {
      id_usuario: usuario.id_usuario,
    });

    void servicioNotificaciones
      .procesarEvento(
        'REGISTRO_CLIENTE',
        correoNormalizado,
        {
          nombre: usuario.nombre,
          codigo: nuevoCodigo,
          vigencia_minutos: 15,
        },
        usuario.id_usuario
      )
      .catch((err) => console.error('[M04-Cuentas] Error reenviando OTP:', err));

    return {
      mensaje: 'Si su cuenta se encuentra pendiente de verificación, se ha enviado un nuevo código a su correo.',
    };
  }

  /**
   * HU-CUE-03: Registro de cliente empresa sujeto a aprobación (RF-CUE-03-01 / RF-CUE-03-02).
   */
  async registrarEmpresa(datos: RegistroEmpresaDTO): Promise<ResultadoRegistro> {
    const correoNormalizado = datos.correo_empresarial.trim().toLowerCase();
    const nitNormalizado = datos.nit.trim();

    // 1. Unicidad de cuenta (HU-CUE-08)
    const existente = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);
    if (existente) {
      throw new AppError(
        'El correo corporativo indicado no está disponible para registro',
        409,
        'CONFLICT'
      );
    }

    // 2. Comprobar que no exista solicitud previa con el mismo NIT (CA-CUE-03-03)
    const solicitudPrevia = await this.empresaRepo.buscarPorNit(nitNormalizado);
    if (solicitudPrevia) {
      throw new AppError(
        'El NIT aportado ya se encuentra asociado a una solicitud en trámite o aprobada',
        409,
        'NIT_DUPLICATED'
      );
    }

    // 3. Derivar hash BCrypt costo 12
    const hashContrasena = await this.credenciales.derivarContrasena(datos.contrasena);

    // 4. Crear usuario en estado 'pendiente' y tipo 'empresa'
    const usuarioCreado = await this.cuentasRepo.crearUsuario({
      nombre: datos.nombre_empresa.trim(),
      correo: correoNormalizado,
      telefono: datos.telefono.trim(),
      contrasena: hashContrasena,
      tipo: 'empresa',
      estado: 'pendiente',
      id_rol: null, // Rol empresa VIP se asignará tras la aprobación en HU-CUE-09
    });

    // 5. Crear solicitud en el repositorio de empresas
    await this.empresaRepo.crearSolicitud({
      id_usuario: usuarioCreado.id_usuario,
      nombre_empresa: datos.nombre_empresa.trim(),
      nombre_representante: datos.nombre_representante.trim(),
      correo_empresarial: correoNormalizado,
      telefono: datos.telefono.trim(),
      nit: nitNormalizado,
      tipo_solicitud: 'registro',
    });

    // 6. Notificar a la empresa que su solicitud quedó en revisión (RF-CUE-03-03 / M18)
    void servicioNotificaciones
      .procesarEvento(
        'SOLICITUD_EMPRESA_RECIBIDA',
        correoNormalizado,
        {
          nombre_empresa: datos.nombre_empresa,
          nit: nitNormalizado,
        },
        usuarioCreado.id_usuario
      )
      .catch((err) => console.error('[M04-Cuentas] Error notificando recepción empresa:', err));

    return {
      requiere_verificacion: false,
      mensaje:
        'Registro completado con éxito. Su solicitud ha quedado en revisión por nuestro equipo administrativo.',
      correo: correoNormalizado,
      tipo: 'empresa',
      estado: 'pendiente',
    };
  }

  /**
   * HU-CUE-03: Consulta del estado de solicitud por parte de la empresa (RF-CUE-03-04).
   */
  async consultarEstadoSolicitudEmpresa(correoONit: string): Promise<{
    encontrado: boolean;
    estado?: string;
    nombre_empresa?: string;
    nit?: string;
    motivo_rechazo?: string | null | undefined;
    fecha_solicitud?: string;
  }> {
    const valor = correoONit.trim();
    let solicitud = await this.empresaRepo.buscarPorNit(valor);

    if (!solicitud) {
      const usuario = await this.cuentasRepo.buscarPorCorreo(valor);
      if (usuario) {
        solicitud = await this.empresaRepo.buscarPorUsuario(usuario.id_usuario);
      }
    }

    if (!solicitud) {
      return { encontrado: false };
    }

    return {
      encontrado: true,
      estado: solicitud.estado,
      nombre_empresa: solicitud.nombre_empresa,
      nit: solicitud.nit,
      motivo_rechazo: solicitud.motivo_rechazo ?? null,
      fecha_solicitud: solicitud.fecha_solicitud,
    };
  }
}
