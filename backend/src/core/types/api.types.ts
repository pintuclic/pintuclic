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
  permisos?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
