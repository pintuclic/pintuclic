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

  // Errores no controlados (M20 - HU-SEG-06).
  //
  // El detalle técnico se registra internamente con lo necesario para diagnosticar
  // (RF-SEG-06-07, CA-SEG-06-06), pero el mensaje que viaja al navegador es siempre
  // genérico: sin rutas, consultas ni versiones de componentes (RF-SEG-06-04,
  // CA-SEG-06-02). `EXPONER_DETALLE_ERRORES=true` levanta la mordaza solo en local.
  console.error(
    '[CORE][ERROR_NO_CONTROLADO]',
    JSON.stringify({
      nombre: err.name,
      detalle: err.message,
      pila: err.stack,
      fecha: new Date().toISOString(),
    })
  );

  const exponerDetalle =
    process.env.NODE_ENV !== 'production' && process.env.EXPONER_DETALLE_ERRORES === 'true';
  const message = exponerDetalle ? err.message : 'Ocurrió un error interno en el servidor';

  sendError(res, message, 'INTERNAL_SERVER_ERROR', 500);
}
