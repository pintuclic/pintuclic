import { randomInt } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Usuario } from '../../../core/db/types';
import { CuentasRepository } from '../repositories/cuentas.repository';
import { VerificacionRepository } from '../repositories/verificacion.repository';
import { serviciosSeguridad } from '../../m20-seguridad/seguridad.routes';
import { servicioNotificaciones } from '../../m18-notificaciones/notificaciones.routes';
import {
  LoginDTO,
  GoogleAuthDTO,
  GoogleVincularDTO,
  CompletarPasswordGoogleDTO,
  SolicitarRecuperacionDTO,
  ConfirmarRecuperacionDTO,
} from '../dtos';
import {
  ResultadoLogin,
  ResultadoGoogleAuth,
  UsuarioSeguro,
} from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - SERVICIO DE AUTENTICACIÓN, GOOGLE Y RECUPERACIÓN (HU-CUE-02, 04, 05)
// Integrado con M20 (Sesiones y Credenciales) y M18 (Notificaciones)
// ==============================================================================

const MAX_INTENTOS_LOGIN = 5;
const VENTANA_BLOQUEO_MS = 15 * 60 * 1000; // 15 minutos

export class AuthService {
  /** Registro en memoria de intentos fallidos por clave (correo o IP) */
  private readonly intentosFallidos: Map<string, { contador: number; bloqueoHasta?: number }> =
    new Map();

  constructor(
    private readonly cuentasRepo: CuentasRepository,
    private readonly verificacionRepo: VerificacionRepository,
    private readonly credenciales = serviciosSeguridad.credenciales,
    private readonly sesion = serviciosSeguridad.sesion
  ) {}

  private sanitizarUsuario(usuario: Usuario, rolNombre?: string | null): UsuarioSeguro {
    return {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      correo: usuario.correo,
      estado: usuario.estado,
      tipo: usuario.tipo,
      id_rol: usuario.id_rol,
      rol_nombre: rolNombre ?? null,
    };
  }

  /**
   * Valida un ID Token emitido por Google Identity Services (OAuth 2.0).
   * Si GOOGLE_CLIENT_ID está configurado en el entorno, verifica criptográficamente la firma y audiencia.
   */
  private async validarGoogleIdToken(idToken: string): Promise<{
    correo: string;
    nombre: string;
    googleId: string;
  }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (clientId && clientId.trim() !== '') {
      try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({
          idToken,
          audience: clientId,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email || !payload.sub) {
          throw new AppError(
            'El token de Google no contiene la información de identidad obligatoria',
            401,
            'INVALID_GOOGLE_TOKEN'
          );
        }
        return {
          correo: payload.email.trim().toLowerCase(),
          nombre: payload.name ?? 'Usuario Google',
          googleId: payload.sub,
        };
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        const mensaje = err instanceof Error ? err.message : 'Error desconocido al validar token';
        throw new AppError(
          `Fallo en validación de identidad con Google: ${mensaje}`,
          401,
          'INVALID_GOOGLE_TOKEN'
        );
      }
    }

    // Modo desarrollo / fallback para entornos de pruebas automáticas
    return {
      correo: `usuario_${idToken.slice(0, 8)}@gmail.com`.toLowerCase(),
      nombre: 'Usuario Google',
      googleId: `google-sub-${idToken.slice(0, 10)}`,
    };
  }

  /**
   * Control de fuerza bruta en inicio de sesión (RF-CUE-04-05 / CA-CUE-04-05).
   */
  private verificarRestriccionFuerzaBruta(clave: string): void {
    const registro = this.intentosFallidos.get(clave);
    if (!registro) return;

    if (registro.bloqueoHasta && registro.bloqueoHasta > Date.now()) {
      const minutosRestantes = Math.ceil((registro.bloqueoHasta - Date.now()) / 60000);
      throw new AppError(
        `Demasiados intentos fallidos. Su acceso está restringido temporalmente. Intente en ${minutosRestantes} minutos.`,
        429,
        'TOO_MANY_REQUESTS'
      );
    }
  }

  private registrarIntentoFallido(clave: string): void {
    const ahora = Date.now();
    const registro = this.intentosFallidos.get(clave);

    if (!registro) {
      this.intentosFallidos.set(clave, { contador: 1 });
      return;
    }

    const nuevoContador = registro.contador + 1;
    if (nuevoContador >= MAX_INTENTOS_LOGIN) {
      this.intentosFallidos.set(clave, {
        contador: nuevoContador,
        bloqueoHasta: ahora + VENTANA_BLOQUEO_MS,
      });
    } else {
      this.intentosFallidos.set(clave, { contador: nuevoContador });
    }
  }

  private limpiarIntentosFallidos(clave: string): void {
    this.intentosFallidos.delete(clave);
  }

  /**
   * HU-CUE-04: Inicio de sesión tradicional por correo y contraseña.
   */
  async login(datos: LoginDTO): Promise<ResultadoLogin> {
    const correoNormalizado = datos.correo.trim().toLowerCase();
    this.verificarRestriccionFuerzaBruta(correoNormalizado);

    const usuario = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);

    if (!usuario) {
      this.registrarIntentoFallido(correoNormalizado);
      throw new AppError(
        'Credenciales de acceso incorrectas',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    if (usuario.estado === 'bloqueado') {
      throw new AppError(
        'Su cuenta se encuentra suspendida o bloqueada temporalmente',
        403,
        'ACCOUNT_BLOCKED'
      );
    }

    if (usuario.estado === 'pendiente') {
      throw new AppError(
        'Su cuenta no ha sido activada o aprobada aún',
        403,
        'ACCOUNT_PENDING'
      );
    }

    if (usuario.estado === 'inactivo') {
      throw new AppError(
        'Su cuenta se encuentra desactivada',
        403,
        'ACCOUNT_DISABLED'
      );
    }

    const contrasenaValida = await this.credenciales.verificarContrasena(
      datos.contrasena,
      usuario.contrasena
    );

    if (!contrasenaValida) {
      this.registrarIntentoFallido(correoNormalizado);
      throw new AppError(
        'Credenciales de acceso incorrectas',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    this.limpiarIntentosFallidos(correoNormalizado);

    const tipoSesion = this.sesion.clasificarSesion(usuario.id_rol);
    const sesion = await this.sesion.abrirSesion(
      {
        id: usuario.id_usuario,
        correo: usuario.correo,
        id_rol: usuario.id_rol ?? null,
      },
      tipoSesion
    );

    const rolNombre = await this.cuentasRepo.obtenerRolPrincipal(usuario.id_usuario);

    return {
      usuario: this.sanitizarUsuario(usuario, rolNombre),
      sesion: {
        idSesion: sesion.idSesion,
        accessToken: sesion.accessToken,
        refreshToken: sesion.refreshToken,
        expiraEnSegundos: sesion.expiraEnSegundos,
        expiraEn: sesion.expiraEn,
      },
    };
  }

  /**
   * HU-CUE-04: Cierre explícito de sesión (RF-CUE-04-02 / CA-CUE-04-04).
   */
  async logout(idSesion: string): Promise<{ mensaje: string }> {
    await this.sesion.cerrarSesion(idSesion);
    return { mensaje: 'Sesión finalizada exitosamente.' };
  }

  /**
   * HU-CUE-02: Registro y acceso mediante Google Identity (RF-CUE-02-01 a 05).
   * Conecta con la tabla usuario_identidad_externa y valida con Google Cloud OAuth.
   */
  async autenticarConGoogle(datos: GoogleAuthDTO): Promise<ResultadoGoogleAuth> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    let correoNormalizado: string;
    let nombreGoogle: string;
    let googleId: string;

    if (clientId && clientId.trim() !== '') {
      const verificado = await this.validarGoogleIdToken(datos.idToken);
      correoNormalizado = verificado.correo;
      nombreGoogle = datos.nombre ?? verificado.nombre;
      googleId = verificado.googleId;
    } else {
      // Fallback para testing o desarrollo cuando no hay GOOGLE_CLIENT_ID
      correoNormalizado = (datos.correo ?? `usuario_${datos.idToken.slice(0, 8)}@gmail.com`)
        .trim()
        .toLowerCase();
      nombreGoogle = datos.nombre ?? 'Usuario Google';
      googleId = datos.googleId ?? `google-sub-${datos.idToken.slice(0, 10)}`;
    }

    // 1. Buscar si ya existe una cuenta con este correo
    const usuarioExistente = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);

    if (usuarioExistente) {
      // ¿Está vinculada a Google en la base de datos PostgreSQL?
      const identidad = await this.cuentasRepo.buscarIdentidadPorUsuario(
        usuarioExistente.id_usuario,
        'google'
      );
      const vinculada = identidad !== undefined && identidad.id_proveedor === googleId;

      if (vinculada) {
        // Inicio de sesión directo (CA-CUE-02-05)
        const tipoSesion = this.sesion.clasificarSesion(usuarioExistente.id_rol);
        const sesion = await this.sesion.abrirSesion(
          {
            id: usuarioExistente.id_usuario,
            correo: usuarioExistente.correo,
            id_rol: usuarioExistente.id_rol ?? null,
          },
          tipoSesion
        );

        const rolNombre = await this.cuentasRepo.obtenerRolPrincipal(
          usuarioExistente.id_usuario
        );

        return {
          tipo: 'login_exitoso',
          mensaje: 'Inicio de sesión con Google exitoso.',
          correo: correoNormalizado,
          login: {
            usuario: this.sanitizarUsuario(usuarioExistente, rolNombre),
            sesion: {
              idSesion: sesion.idSesion,
              accessToken: sesion.accessToken,
              refreshToken: sesion.refreshToken,
              expiraEnSegundos: sesion.expiraEnSegundos,
              expiraEn: sesion.expiraEn,
            },
          },
        };
      } else {
        // La cuenta existe por correo/contraseña y NO está vinculada aún
        return {
          tipo: 'sugerencia_vinculacion',
          mensaje:
            'Ya existe una cuenta con este correo. ¿Desea vincular el acceso de Google a su cuenta existente?',
          correo: correoNormalizado,
          datos_google: {
            nombre: nombreGoogle,
            correo: correoNormalizado,
            googleId,
          },
        };
      }
    }

    // 2. Visitante nuevo: crear cuenta particular y requerir contraseña propia (RF-CUE-02-04 / CA-CUE-02-04)
    const hashProvisorio = await this.credenciales.derivarContrasena(
      'TempPass_' + randomInt(1000000, 9999999) + 'Aa1!'
    );

    const nuevoUsuario = await this.cuentasRepo.crearUsuario({
      nombre: nombreGoogle,
      correo: correoNormalizado,
      telefono: null,
      contrasena: hashProvisorio,
      tipo: 'normal',
      estado: 'activo', // Verificado por Google Identity
      id_rol: 2,
    });

    await this.cuentasRepo.asignarRolUsuario(nuevoUsuario.id_usuario, 2);

    // Persistir vinculación nativa en PostgreSQL (usuario_identidad_externa)
    await this.cuentasRepo.vincularIdentidadExterna({
      id_usuario: nuevoUsuario.id_usuario,
      proveedor: 'google',
      id_proveedor: googleId,
      correo_proveedor: correoNormalizado,
    });

    return {
      tipo: 'requiere_password_inicial',
      mensaje:
        'Cuenta creada mediante Google. Por favor, digite una contraseña propia para contar con ambas vías de acceso.',
      correo: correoNormalizado,
      datos_google: {
        nombre: nombreGoogle,
        correo: correoNormalizado,
        googleId,
      },
    };
  }

  /**
   * HU-CUE-02: Confirmar vinculación de cuenta existente con Google (CA-CUE-02-02).
   */
  async confirmarVinculacionGoogle(datos: GoogleVincularDTO): Promise<ResultadoLogin> {
    const correoNormalizado = datos.correo.trim().toLowerCase();
    const usuario = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    if (!datos.confirmar) {
      throw new AppError('Vinculación cancelada por el usuario', 400, 'LINK_CANCELLED');
    }

    // Persistir vinculación en la tabla usuario_identidad_externa
    await this.cuentasRepo.vincularIdentidadExterna({
      id_usuario: usuario.id_usuario,
      proveedor: 'google',
      id_proveedor: datos.googleId,
      correo_proveedor: correoNormalizado,
    });

    const tipoSesion = this.sesion.clasificarSesion(usuario.id_rol);
    const sesion = await this.sesion.abrirSesion(
      {
        id: usuario.id_usuario,
        correo: usuario.correo,
        id_rol: usuario.id_rol ?? null,
      },
      tipoSesion
    );

    const rolNombre = await this.cuentasRepo.obtenerRolPrincipal(usuario.id_usuario);

    return {
      usuario: this.sanitizarUsuario(usuario, rolNombre),
      sesion: {
        idSesion: sesion.idSesion,
        accessToken: sesion.accessToken,
        refreshToken: sesion.refreshToken,
        expiraEnSegundos: sesion.expiraEnSegundos,
        expiraEn: sesion.expiraEn,
      },
    };
  }

  /**
   * HU-CUE-02: Completar contraseña propia tras registro con Google (RF-CUE-02-04).
   */
  async completarPasswordGoogle(datos: CompletarPasswordGoogleDTO): Promise<ResultadoLogin> {
    const correoNormalizado = datos.correo.trim().toLowerCase();
    const usuario = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');
    }

    const nuevoHash = await this.credenciales.derivarContrasena(datos.contrasena);
    await this.cuentasRepo.actualizarContrasena(usuario.id_usuario, nuevoHash);

    const tipoSesion = this.sesion.clasificarSesion(usuario.id_rol);
    const sesion = await this.sesion.abrirSesion(
      {
        id: usuario.id_usuario,
        correo: usuario.correo,
        id_rol: usuario.id_rol ?? null,
      },
      tipoSesion
    );

    const rolNombre = await this.cuentasRepo.obtenerRolPrincipal(usuario.id_usuario);

    return {
      usuario: this.sanitizarUsuario(usuario, rolNombre),
      sesion: {
        idSesion: sesion.idSesion,
        accessToken: sesion.accessToken,
        refreshToken: sesion.refreshToken,
        expiraEnSegundos: sesion.expiraEnSegundos,
        expiraEn: sesion.expiraEn,
      },
    };
  }

  /**
   * HU-CUE-05: Solicitar recuperación de contraseña (RF-CUE-05-01 a 04).
   */
  async solicitarRecuperacion(datos: SolicitarRecuperacionDTO): Promise<{ mensaje: string }> {
    const correoNormalizado = datos.correo.trim().toLowerCase();
    const usuario = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);

    // Si el usuario no existe: respuesta uniforme para evitar enumeración (CA-CUE-05-02 / RF-CUE-05-04)
    if (!usuario) {
      return {
        mensaje:
          'Si el correo electrónico coincide con una cuenta registrada, se ha enviado un enlace o código de recuperación.',
      };
    }

    // Si la cuenta está inactiva o bloqueada
    if (usuario.estado === 'inactivo' || usuario.estado === 'bloqueado') {
      return {
        mensaje:
          'Si el correo electrónico coincide con una cuenta registrada, se ha enviado un enlace o código de recuperación.',
      };
    }

    // Generar código OTP efímero de un solo uso (15 minutos)
    const codigoOTP = randomInt(100000, 999999).toString();
    await this.verificacionRepo.guardarCodigo(
      correoNormalizado,
      codigoOTP,
      'recuperacion_password',
      { id_usuario: usuario.id_usuario }
    );

    // Despacho por SMTP vía M18
    void servicioNotificaciones
      .procesarEvento(
        'RECUPERACION_PASSWORD',
        correoNormalizado,
        {
          nombre: usuario.nombre,
          codigo: codigoOTP,
          vigencia_minutos: 15,
        },
        usuario.id_usuario
      )
      .catch((err) => console.error('[M04-Cuentas] Error enviando correo de recuperación:', err));

    return {
      mensaje:
        'Si el correo electrónico coincide con una cuenta registrada, se ha enviado un enlace o código de recuperación.',
    };
  }

  /**
   * HU-CUE-05: Confirmar recuperación y cambiar contraseña (CA-CUE-05-01, 04).
   */
  async confirmarRecuperacion(
    datos: ConfirmarRecuperacionDTO
  ): Promise<{ mensaje: string; sesionesCerradas: number }> {
    const correoNormalizado = datos.correo.trim().toLowerCase();

    // 1. Validar OTP en repositorio
    const registroOTP = await this.verificacionRepo.obtenerCodigo(
      correoNormalizado,
      'recuperacion_password'
    );

    if (!registroOTP) {
      throw new AppError(
        'El enlace o código de recuperación ha expirado o no es válido',
        400,
        'EXPIRED_CODE'
      );
    }

    if (registroOTP.codigo !== datos.codigo.trim()) {
      const intentos = await this.verificacionRepo.incrementarIntentos(
        correoNormalizado,
        'recuperacion_password'
      );
      if (intentos >= registroOTP.max_intentos) {
        throw new AppError(
          'Código incorrecto. Ha superado los intentos permitidos. Solicite una nueva recuperación.',
          400,
          'MAX_ATTEMPTS_EXCEEDED'
        );
      }
      throw new AppError('El código de recuperación es incorrecto', 400, 'INVALID_CODE');
    }

    // 2. Buscar usuario
    const usuario = await this.cuentasRepo.buscarPorCorreo(correoNormalizado);
    if (!usuario) {
      throw new AppError('No fue posible completar la operación', 404, 'NOT_FOUND');
    }

    // 3. Derivar nuevo hash BCrypt costo 12
    const nuevoHash = await this.credenciales.derivarContrasena(datos.contrasenaNueva);
    await this.cuentasRepo.actualizarContrasena(usuario.id_usuario, nuevoHash);

    // 4. Invalidar TODAS las sesiones activas de la cuenta (RF-CUE-05-05 / CA-CUE-05-04)
    const sesionesCerradas = await this.sesion.invalidarSesionesDeUsuario(
      usuario.id_usuario,
      'cambio_contrasena'
    );

    // 5. Consumir código OTP de un solo uso
    await this.verificacionRepo.consumirCodigo(correoNormalizado, 'recuperacion_password');

    return {
      mensaje: 'Contraseña actualizada correctamente. Todas sus sesiones previas han sido cerradas.',
      sesionesCerradas,
    };
  }
}
