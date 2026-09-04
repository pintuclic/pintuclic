import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse';

/**
 * Clase de error operacional para lógica de negocio controlada en servicios.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = 400, code: string = 'BAD_REQUEST', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Middleware centralizado de gestión de excepciones para Express.
 */
export function errorHandler(
  err: Error | AppError | ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Manejo de errores de validación de Zod
  if (err instanceof ZodError) {
    const formattedDetails = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    sendError(res, 'Error de validación en la solicitud', 'VALIDATION_ERROR', 400, formattedDetails);
    return;
  }

  // Manejo de errores operacionales controlados (AppError)
  if (err instanceof AppError) {
    sendError(res, err.message, err.code, err.statusCode, err.details);
    return;
  }

  // Manejo de errores no controlados / internos del servidor (HU-SEG-06 no filtrar trazas sensibles)
  console.error('💥 Error no controlado en backend:', err);

  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction ? 'Ocurrió un error interno en el servidor' : err.message;

  sendError(res, message, 'INTERNAL_SERVER_ERROR', 500);
}
