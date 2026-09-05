/**
 * Tipos y contratos estándar para las respuestas HTTP de la API de Pintuclic.
 */

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[] | unknown;
  };
}

export interface AuthenticatedUser {
  id: number;
  correo: string;
  id_rol?: number | null;
  /** Permisos vigentes resueltos en vivo por los guardas de M20 (RF-SEG-03-01). */
  permisos?: string[];
  /** Ventana de inactividad aplicable a la sesión en curso (RF-SEG-02-02). */
  tipo_sesion?: 'admin' | 'cliente';
  /** Identificador de la sesión persistida que ampara esta petición (HU-SEG-02). */
  sid?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
