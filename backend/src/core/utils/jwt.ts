import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { AuthenticatedUser } from '../types/api.types';

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'pintuclic_super_secret_jwt_key_default_development_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'pintuclic_super_refresh_jwt_key_default_2026';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  id: number;
  correo: string;
  id_rol?: number | null;
  /** Identificador de la sesión persistida en la tabla `sesion` (M20 - HU-SEG-02). */
  sid?: string;
}

/**
 * Genera un Access Token para un usuario autenticado.
 */
export function generateAccessToken(payload: TokenPayload, options?: SignOptions): string {
  if (options && options.expiresIn) {
    return jwt.sign(payload, JWT_SECRET, options);
  }
  const defaultOptions: SignOptions = {
    ...options,
    expiresIn: JWT_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
  };
  return jwt.sign(payload, JWT_SECRET, defaultOptions);
}

/**
 * Genera un Refresh Token con mayor duración para rotación de sesión segura.
 */
export function generateRefreshToken(payload: TokenPayload, options?: SignOptions): string {
  if (options && options.expiresIn) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, options);
  }
  const defaultOptions: SignOptions = {
    ...options,
    expiresIn: JWT_REFRESH_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd'}`,
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, defaultOptions);
}

/**
 * Verifica y decodifica un Access Token JWT.
 */
export function verifyAccessToken(token: string): AuthenticatedUser {
  return jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
}

/**
 * Verifica y decodifica un Refresh Token JWT.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
