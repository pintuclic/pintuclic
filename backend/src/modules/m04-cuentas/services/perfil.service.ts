import { randomInt } from 'crypto';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CuentasRepository } from '../repositories/cuentas.repository';
import { VerificacionRepository } from '../repositories/verificacion.repository';
import { EmpresaRepository } from '../repositories/empresa.repository';
import { serviciosSeguridad } from '../../m20-seguridad/seguridad.routes';
import { servicioNotificaciones } from '../../m18-notificaciones/notificaciones.routes';
import {
  ActualizarPerfilDTO,
  SolicitarCambioCorreoDTO,
  ConfirmarCambioCorreoDTO,
  SolicitarAscensoEmpresaDTO,
} from '../dtos';
import { PerfilUsuario } from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - SERVICIO DE GESTIÓN DE PERFIL (HU-CUE-06)
// Consulta, actualización de contacto, cambio de correo verificado y ascenso
// ==============================================================================

export class PerfilService {
  constructor(
    private readonly cuentasRepo: CuentasRepository,
    private readonly verificacionRepo: VerificacionRepository,
    private readonly empresaRepo: EmpresaRepository,
    private readonly credenciales = serviciosSeguridad.credenciales
  ) {}

  /**
   * HU-CUE-06: Consulta de datos de perfil propios (RF-CUE-06-01 / CA-CUE-06-01).
   * Jamás expone la contraseña (HU-SEG-06).
   */
  async obtenerPerfil(idUsuario: number): Promise<PerfilUsuario> {
    const datos = await this.cuentasRepo.obtenerUsuarioConRol(idUsuario);
    if (!datos) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    const { usuario, rolNombre } = datos;
    const solicitud = await this.empresaRepo.buscarPorUsuario(idUsuario);

    return {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      correo: usuario.correo,
      estado: usuario.estado,
      tipo: usuario.tipo,
      id_rol: usuario.id_rol,
      rol_nombre: rolNombre ?? null,
      nombre_empresa: solicitud?.nombre_empresa ?? null,
      nombre_representante: solicitud?.nombre_representante ?? null,
      nit: solicitud?.nit ?? null,
    };
  }

  /**
   * HU-CUE-06: Actualización de datos personales (RF-CUE-06-02).
   * Un cliente tipo empresa tiene prohibido modificar su NIT desde aquí (RF-CUE-06-06 / CA-CUE-06-05).
   */
  async actualizarPerfil(
    idUsuario: number,
    datos: ActualizarPerfilDTO
  ): Promise<PerfilUsuario> {
    const usuario = await this.cuentasRepo.buscarPorId(idUsuario);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    const cambios: Record<string, unknown> = {};
    if (datos.nombre !== undefined) cambios.nombre = datos.nombre.trim();
    if (datos.telefono !== undefined) cambios.telefono = datos.telefono.trim();

    if (Object.keys(cambios).length > 0) {
      await this.cuentasRepo.actualizarUsuario(idUsuario, cambios);
    }

    return this.obtenerPerfil(idUsuario);
  }

  /**
   * HU-CUE-06: Solicitar cambio de correo electrónico (RF-CUE-06-03).
   * Exige la contraseña actual para verificar la identidad antes de emitir el código al correo vigente.
   */
  async solicitarCambioCorreo(
    idUsuario: number,
    datos: SolicitarCambioCorreoDTO
  ): Promise<{ mensaje: string }> {
    const usuario = await this.cuentasRepo.buscarPorId(idUsuario);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    // 1. Validar contraseña actual (RF-CUE-06-04)
    const coincide = await this.credenciales.verificarContrasena(
      datos.contrasenaActual,
      usuario.contrasena
    );
    if (!coincide) {
      throw new AppError('La contraseña actual es incorrecta', 403, 'FORBIDDEN');
    }

    // 2. Comprobar que el nuevo correo no esté ocupado (HU-CUE-08)
    const nuevoCorreoNormalizado = datos.nuevoCorreo.trim().toLowerCase();
    const ocupado = await this.cuentasRepo.buscarPorCorreo(nuevoCorreoNormalizado);
    if (ocupado) {
      throw new AppError('El nuevo correo indicado ya está en uso', 409, 'CONFLICT');
    }

    // 3. Generar código OTP y enviarlo al correo ACTUAL vigente (RF-CUE-06-03)
    const codigoOTP = randomInt(100000, 999999).toString();
    await this.verificacionRepo.guardarCodigo(
      usuario.correo,
      codigoOTP,
      'cambio_correo',
      { id_usuario: idUsuario, nuevo_correo: nuevoCorreoNormalizado },
      15
    );

    void servicioNotificaciones
      .procesarEvento(
        'REGISTRO_CLIENTE', // Reutiliza plantilla con código transaccional
        usuario.correo,
        {
          nombre: usuario.nombre,
          codigo: codigoOTP,
          motivo: 'Confirmación de cambio de correo electrónico',
        },
        idUsuario
      )
      .catch((err) => console.error('[M04-Cuentas] Error enviando código cambio correo:', err));

    return {
      mensaje:
        'Hemos enviado un código de confirmación a su correo electrónico actual para autorizar el cambio.',
    };
  }

  /**
   * HU-CUE-06: Confirmar cambio de correo electrónico (CA-CUE-06-02).
   */
  async confirmarCambioCorreo(
    idUsuario: number,
    datos: ConfirmarCambioCorreoDTO
  ): Promise<{ mensaje: string; nuevoCorreo: string }> {
    const usuario = await this.cuentasRepo.buscarPorId(idUsuario);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    const nuevoCorreoNormalizado = datos.nuevoCorreo.trim().toLowerCase();

    // 1. Validar OTP asociado al correo actual
    const registroOTP = await this.verificacionRepo.obtenerCodigo(
      usuario.correo,
      'cambio_correo'
    );

    if (!registroOTP) {
      throw new AppError(
        'El código de cambio de correo ha expirado o no es válido',
        400,
        'EXPIRED_CODE'
      );
    }

    if (registroOTP.codigo !== datos.codigo.trim()) {
      const intentos = await this.verificacionRepo.incrementarIntentos(
        usuario.correo,
        'cambio_correo'
      );
      if (intentos >= registroOTP.max_intentos) {
        throw new AppError(
          'Código incorrecto. Ha superado los intentos permitidos.',
          400,
          'MAX_ATTEMPTS_EXCEEDED'
        );
      }
      throw new AppError('El código de verificación es incorrecto', 400, 'INVALID_CODE');
    }

    const correoAnterior = usuario.correo;

    // 2. Aplicar cambio en PostgreSQL
    await this.cuentasRepo.actualizarCorreo(idUsuario, nuevoCorreoNormalizado);
    await this.verificacionRepo.consumirCodigo(correoAnterior, 'cambio_correo');

    // 3. Notificar el cambio tanto a la dirección anterior como a la nueva (CA-CUE-06-02)
    void servicioNotificaciones
      .procesarEvento(
        'REGISTRO_CLIENTE',
        correoAnterior,
        {
          nombre: usuario.nombre,
          aviso: `Se ha modificado la dirección de correo de su cuenta a ${nuevoCorreoNormalizado}. Si no fue usted, comuníquese de inmediato con soporte.`,
        },
        idUsuario
      )
      .catch((err) => console.error('[M04-Cuentas] Error alertando correo antiguo:', err));

    void servicioNotificaciones
      .procesarEvento(
        'REGISTRO_CLIENTE',
        nuevoCorreoNormalizado,
        {
          nombre: usuario.nombre,
          aviso: 'Su nuevo correo ha sido verificado y vinculado exitosamente a su cuenta en Pintuclic.',
        },
        idUsuario
      )
      .catch((err) => console.error('[M04-Cuentas] Error alertando correo nuevo:', err));

    return {
      mensaje: 'Correo electrónico actualizado correctamente.',
      nuevoCorreo: nuevoCorreoNormalizado,
    };
  }

  /**
   * HU-CUE-06: Solicitar ascenso a cliente empresa desde cuenta particular (RF-CUE-06-07 / CA-CUE-06-06).
   */
  async solicitarAscensoEmpresa(
    idUsuario: number,
    datos: SolicitarAscensoEmpresaDTO
  ): Promise<{ mensaje: string; id_solicitud: string }> {
    const usuario = await this.cuentasRepo.buscarPorId(idUsuario);
    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    if (usuario.tipo === 'empresa') {
      throw new AppError('Esta cuenta ya está categorizada como cliente empresa', 400, 'ALREADY_COMPANY');
    }

    const nitNormalizado = datos.nit.trim();
    const solicitudExistente = await this.empresaRepo.buscarPorNit(nitNormalizado);
    if (solicitudExistente && solicitudExistente.estado !== 'rechazada') {
      throw new AppError('El NIT indicado ya cuenta con una solicitud activa', 409, 'CONFLICT');
    }

    const solicitud = await this.empresaRepo.crearSolicitud({
      id_usuario: idUsuario,
      nombre_empresa: datos.nombre_empresa.trim(),
      nombre_representante: datos.nombre_representante.trim(),
      correo_empresarial: usuario.correo,
      telefono: datos.telefono.trim(),
      nit: nitNormalizado,
      tipo_solicitud: 'ascenso_particular',
    });

    return {
      mensaje:
        'Su solicitud de cambio a cuenta empresa ha sido radicada exitosamente y quedó a disposición del administrador.',
      id_solicitud: solicitud.id_solicitud,
    };
  }
}
