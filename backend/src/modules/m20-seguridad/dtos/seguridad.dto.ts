import { z } from 'zod';

// ==============================================================================
// M20 - SEGURIDAD Y AUDITORÍA
// Esquemas de Validación (Zod) y DTOs de Entrada HTTP
// ==============================================================================

/**
 * Política de contraseñas aplicada antes de derivar el hash (HU-SEG-01).
 * La derivación se realiza siempre con BCrypt de costo 12 en `core/utils/crypto.ts`.
 */
export const contrasenaSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede superar los 128 caracteres')
  .regex(/[a-z]/, 'La contraseña debe incluir al menos una letra minúscula')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

/**
 * DTO de cambio de contraseña. Exige la contraseña vigente para evitar el
 * secuestro de una sesión abierta.
 */
export const cambioContrasenaSchema = z
  .object({
    contrasenaActual: z.string().min(1, 'Debe indicar su contraseña actual'),
    contrasenaNueva: contrasenaSchema,
  })
  .refine((datos) => datos.contrasenaActual !== datos.contrasenaNueva, {
    message: 'La contraseña nueva debe ser distinta de la actual',
    path: ['contrasenaNueva'],
  });

export type CambioContrasenaDTO = z.infer<typeof cambioContrasenaSchema>;

/**
 * DTO de actualización de la política de vigencia de sesión (RF-SEG-02-07).
 */
export const politicaSesionSchema = z.object({
  inactividadAdminSegundos: z.number().int().positive().max(86_400),
  inactividadClienteSegundos: z.number().int().positive().max(7_776_000),
});

export type PoliticaSesionDTO = z.infer<typeof politicaSesionSchema>;

/**
 * DTO de apertura de sesión (credenciales).
 *
 * El flujo de login de cara al usuario pertenece a M04; M20 solo aporta la verificación
 * de credenciales y la emisión de la sesión.
 */
export const aperturaSesionSchema = z.object({
  correo: z.string().email('Debe indicar un correo válido'),
  contrasena: z.string().min(1, 'Debe indicar su contraseña'),
});

export type AperturaSesionDTO = z.infer<typeof aperturaSesionSchema>;
