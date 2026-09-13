import { EnumEstadoUsuario, EnumTipoUsuario } from '../../../core/db/types';

// ==============================================================================
// M04 - CUENTAS, AUTENTICACIÓN Y PERFIL
// Contratos de tipos de dominio (TypeScript estricto, 0 bytes en runtime)
// Conforme a AGENTS.md y backend/infraestructura.md
// ==============================================================================

/**
 * Representación segura de un usuario para respuestas públicas o clientes autenticados.
 * NUNCA contiene hashes, sales ni contraseñas (HU-SEG-06 / RF-SEG-01-04).
 */
export interface UsuarioSeguro {
  id_usuario: number;
  nombre: string;
  telefono: string | null;
  correo: string;
  estado: EnumEstadoUsuario;
  tipo: EnumTipoUsuario;
  id_rol: number | null;
  rol_nombre?: string | null;
}

/**
 * Ficha completa del perfil consultado por el usuario autenticado (HU-CUE-06).
 */
export interface PerfilUsuario {
  id_usuario: number;
  nombre: string;
  telefono: string | null;
  correo: string;
  estado: EnumEstadoUsuario;
  tipo: EnumTipoUsuario;
  id_rol: number | null;
  rol_nombre?: string | null;
  // Campos complementarios empresariales o de persona natural
  documento_identidad?: string | null;
  nombre_empresa?: string | null;
  nombre_representante?: string | null;
  nit?: string | null;
  cuenta_google_vinculada?: boolean;
}

/**
 * Dirección física para entregas y despachos del cliente (HU-CUE-07).
 */
export interface DireccionCliente {
  id_direccion: string;
  id_usuario: number;
  direccion: string;
  barrio: string;
  apartamento_casa?: string | null;
  nombre_apellido: string;
  telefono: string;
  es_predeterminada: boolean;
  latitud?: number | null;
  longitud?: number | null;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

/**
 * Tipo de propósito para un código OTP efímero.
 */
export type TipoCodigoOTP = 'registro' | 'recuperacion_password' | 'cambio_correo';

/**
 * Registro de código de verificación OTP efímero con vigencia e intentos.
 */
export interface RegistroCodigoOTP {
  id: string;
  correo: string;
  codigo: string;
  tipo: TipoCodigoOTP;
  expiracion: Date;
  intentos: number;
  max_intentos: number;
  datos_temporales?: Record<string, unknown> | null;
}

/**
 * Estado del trámite de una solicitud de cuenta empresa o ascenso (HU-CUE-03, HU-CUE-09).
 */
export type EstadoSolicitudEmpresa = 'pendiente' | 'aprobada' | 'rechazada';

/**
 * Solicitud de registro o ascenso a cliente corporativo (HU-CUE-03 / HU-CUE-09).
 */
export interface SolicitudEmpresa {
  id_solicitud: string;
  id_usuario: number;
  nombre_empresa: string;
  nombre_representante: string;
  correo_empresarial: string;
  telefono: string;
  nit: string;
  estado: EstadoSolicitudEmpresa;
  motivo_rechazo?: string | null;
  tipo_solicitud: 'registro' | 'ascenso_particular';
  fecha_solicitud: string;
  fecha_revision?: string | null;
  id_admin_revisor?: number | null;
}

/**
 * Solicitud de actualización de NIT por parte de una empresa (RF-CUE-09-07).
 */
export interface SolicitudActualizacionNit {
  id_solicitud: string;
  id_usuario: number;
  nit_anterior: string;
  nit_nuevo: string;
  documento_adjunto_url: string;
  estado: EstadoSolicitudEmpresa;
  motivo_rechazo?: string | null;
  fecha_solicitud: string;
  fecha_revision?: string | null;
  id_admin_revisor?: number | null;
}

/**
 * Resultado estructurado de una operación de registro (HU-CUE-01, HU-CUE-03).
 */
export interface ResultadoRegistro {
  requiere_verificacion: boolean;
  mensaje: string;
  correo: string;
  tipo: EnumTipoUsuario;
  estado: EnumEstadoUsuario;
}

/**
 * Metadatos de la sesión emitida al autenticarse (HU-CUE-04 / M20).
 */
export interface InfoSesionEmitida {
  idSesion: string;
  accessToken: string;
  refreshToken: string;
  expiraEnSegundos: number;
  expiraEn: string;
}

/**
 * Resultado estructurado de un login exitoso (HU-CUE-04).
 */
export interface ResultadoLogin {
  usuario: UsuarioSeguro;
  sesion: InfoSesionEmitida;
}

/**
 * Respuestas posibles al interactuar con Google Identity (HU-CUE-02).
 */
export interface ResultadoGoogleAuth {
  tipo: 'login_exitoso' | 'sugerencia_vinculacion' | 'requiere_password_inicial';
  mensaje: string;
  correo: string;
  datos_google?: {
    nombre: string;
    correo: string;
    googleId: string;
  };
  login?: ResultadoLogin;
}
