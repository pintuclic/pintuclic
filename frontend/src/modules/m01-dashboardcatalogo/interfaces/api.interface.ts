/**
 * ==============================================================================
 * M01 - ENVOLTORIO ESTÁNDAR DE RESPUESTA API (UNIVERSAL API ENVELOPE)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/api.interface.ts
 *
 * Mismo contrato que el resto de módulos (ver m04-cuentas). Compartido por
 * todas las vistas del módulo (dashboard, productos, …).
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */

export interface PaginacionMeta {
  page?: number;
  limit?: number;
  totalRecords?: number;
  totalPages?: number;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginacionMeta & Record<string, unknown>;
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
