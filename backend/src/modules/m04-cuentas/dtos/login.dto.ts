import { z } from 'zod';
import { contrasenaSchema } from '../../m20-seguridad/dtos/seguridad.dto';

// ==============================================================================
// M04 - DTOs de Autenticación y Google Identity (HU-CUE-02, HU-CUE-04)
// ==============================================================================

/**
 * DTO para inicio de sesión por credenciales (HU-CUE-04 / RF-CUE-04-01).
 */
export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .email('Debe indicar un correo válido')
    .transform((val) => val.toLowerCase()),
  contrasena: z.string().min(1, 'Debe indicar su contraseña'),
});

export type LoginDTO = z.infer<typeof loginSchema>;

/**
 * DTO para autenticación / registro con Google Identity (HU-CUE-02 / RF-CUE-02-01).
 */
export const googleAuthSchema = z.object({
  idToken: z.string().min(1, 'El idToken o credencial de Google es obligatorio'),
  correo: z
    .string()
    .trim()
    .email('Debe indicar un correo válido')
    .transform((val) => val.toLowerCase())
    .optional(),
  nombre: z.string().trim().min(1).optional(),
  googleId: z.string().trim().min(1).optional(),
});

export type GoogleAuthDTO = z.infer<typeof googleAuthSchema>;

/**
 * DTO para confirmar la vinculación entre una cuenta existente y Google (RF-CUE-02-03).
 */
export const googleVincularSchema = z.object({
  correo: z
    .string()
    .trim()
    .email('Debe indicar un correo válido')
    .transform((val) => val.toLowerCase()),
  confirmar: z.boolean(),
  googleId: z.string().trim().min(1, 'El identificador de Google es requerido'),
});

export type GoogleVincularDTO = z.infer<typeof googleVincularSchema>;

/**
 * DTO para registrar la contraseña propia tras el primer acceso con Google (RF-CUE-02-04 / CA-CUE-02-04).
 */
export const completarPasswordGoogleSchema = z.object({
  correo: z
    .string()
    .trim()
    .email('Debe indicar un correo válido')
    .transform((val) => val.toLowerCase()),
  contrasena: contrasenaSchema,
  tokenTemporal: z.string().optional(),
});

export type CompletarPasswordGoogleDTO = z.infer<typeof completarPasswordGoogleSchema>;
