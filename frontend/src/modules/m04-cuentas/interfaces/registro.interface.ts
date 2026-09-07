/**
 * ==============================================================================
 * M04 - CONTRATOS DE DATOS Y TIPOS DE INTEGRACIÓN END-TO-END
 * Sincronizado 1:1 con backend (dtos/registro.dto.ts, dtos/login.dto.ts,
 * services/cuentas.service.ts y services/auth.service.ts).
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */

// ==============================================================================
// 1. ENVOLTORIO ESTÁNDAR DE RESPUESTA API (UNIVERSAL API ENVELOPE)
// ==============================================================================

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    totalRecords?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorDetail {
  field?: string;
  issue?: string;
  message?: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

// ==============================================================================
// 2. DTOs DE PETICIÓN (PAYLOADS)
// ==============================================================================

export interface RegistroNaturalPayload {
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

export interface RegistroEmpresaPayload {
  nombre_empresa: string;
  nombre_representante: string;
  correo_empresarial: string;
  telefono: string;
  nit: string;
  contrasena: string;
}

export interface VerificarCodigoPayload {
  correo: string;
  codigo: string;
}

export interface ReenviarCodigoPayload {
  correo: string;
}

export interface LoginPayload {
  correo: string;
  contrasena: string;
}

export type TipoCuentaRegistro = 'natural' | 'empresa';

// ==============================================================================
// 3. MODELOS DE IDENTIDAD Y SESIÓN
// ==============================================================================

export interface UsuarioSeguro {
  id_usuario: number;
  nombre: string;
  telefono: string | null;
  correo: string;
  estado: string;
  tipo: string;
  id_rol: number | null;
  rol_nombre: string | null;
}

export interface SesionEmitida {
  idSesion: string;
  accessToken: string;
  refreshToken: string;
  expiraEnSegundos: number;
  expiraEn: string;
}

// ==============================================================================
// 4. PAYLOADS DE RESPUESTA DE SERVICIOS
// ==============================================================================

export interface ResultadoLogin {
  usuario: UsuarioSeguro;
  sesion: SesionEmitida;
}

export interface ResultadoRegistroParticular {
  mensaje: string;
  id_usuario: number;
  correo: string;
}

export interface ResultadoRegistroEmpresa {
  mensaje: string;
  id_usuario: number;
  id_empresa: number;
  estado: string;
}

export interface ResultadoVerificacion {
  mensaje: string;
  activado: boolean;
  usuario?: UsuarioSeguro;
}

export interface ResultadoReenvio {
  mensaje: string;
  tiempoEsperaSegundos?: number;
}

// ==============================================================================
// 5. GOOGLE IDENTITY SERVICES (HU-CUE-02)
// ==============================================================================

export interface GoogleAuthPayload {
  idToken: string;
}

export interface GoogleVincularPayload {
  correo: string;
  confirmar: boolean;
  googleId: string;
}

export interface CompletarPasswordGooglePayload {
  correo: string;
  contrasena: string;
}

export interface ResultadoGoogleAuth {
  tipo: 'login_exitoso' | 'sugerencia_vinculacion' | 'requiere_password_inicial';
  mensaje: string;
  correo: string;
  login?: ResultadoLogin;
  datos_google?: {
    nombre: string;
    correo: string;
    googleId: string;
  };
}
