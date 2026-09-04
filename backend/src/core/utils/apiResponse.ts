import { Response } from 'express';
import { ApiResponse, ApiErrorResponse, ApiErrorDetail } from '../types/api.types';

/**
 * Retorna una respuesta exitosa estandarizada con código HTTP 200 o el especificado.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200,
  meta?: Record<string, unknown>
): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

/**
 * Retorna una respuesta de error estandarizada.
 */
export function sendError(
  res: Response,
  message: string,
  code: string = 'BAD_REQUEST',
  statusCode: number = 400,
  details?: ApiErrorDetail[] | unknown
): Response {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(payload);
}
