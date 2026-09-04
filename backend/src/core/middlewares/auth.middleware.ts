import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/apiResponse';

/**
 * Middleware para validar la sesión JWT en cabeceras de autorización Bearer (HU-SEG-02).
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    sendError(res, 'Token de autenticación no proporcionado', 'UNAUTHORIZED', 401);
    return;
  }

  try {
    const userPayload = verifyAccessToken(token);
    req.user = userPayload;
    next();
  } catch (error) {
    sendError(res, 'Token de autenticación inválido o expirado', 'FORBIDDEN', 403);
  }
}
