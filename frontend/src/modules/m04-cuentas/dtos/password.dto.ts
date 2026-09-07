import { z } from 'zod';

/**
 * ==============================================================================
 * M04 - DTO Y ESQUEMAS DE VALIDACIÓN DE CONTRASEÑAS (HU-SEG-01 / HU-CUE-01 / HU-CUE-02)
 * Fuente única de la verdad (DRY) para cualquier campo de contraseña en el frontend.
 * Sincronizado 1:1 con backend (m20-seguridad/dtos/seguridad.dto.ts).
 * ==============================================================================
 */

/**
 * Esquema base reutilizable para cualquier campo de contraseña.
 * Aplica reglas estrictas de seguridad (HU-SEG-01):
 * - Longitud: mínimo 8 caracteres, máximo 128 caracteres.
 * - Al menos una letra minúscula ([a-z]).
 * - Al menos una letra mayúscula ([A-Z]).
 * - Al menos un dígito numérico ([0-9]).
 */
export const contrasenaSchema = z
  .string({ required_error: 'La contraseña es requerida' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede superar los 128 caracteres')
  .regex(/[a-z]/, 'La contraseña debe incluir al menos una letra minúscula')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

export type ContrasenaDTO = z.infer<typeof contrasenaSchema>;

/**
 * DTO para formularios que exigen creación y confirmación de contraseña.
 */
export const contrasenaConConfirmacionSchema = z
  .object({
    contrasena: contrasenaSchema,
    confirmarContrasena: z.string({ required_error: 'Debe confirmar la contraseña' }),
  })
  .refine((data) => data.contrasena === data.confirmarContrasena, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarContrasena'],
  });

export type ContrasenaConConfirmacionDTO = z.infer<typeof contrasenaConConfirmacionSchema>;

/**
 * Validador atómico DRY para cualquier valor de contraseña.
 * @param contrasena Texto de la contraseña a evaluar
 * @returns Mensaje de error si falla alguna regla de seguridad, o `null` si es válida.
 */
export function validarContrasena(contrasena: string): string | null {
  const resultado = contrasenaSchema.safeParse(contrasena);
  if (!resultado.success) {
    return resultado.error.issues[0]?.message ?? 'Contraseña inválida';
  }
  return null;
}

/**
 * Validador atómico DRY para parejas de contraseña y su confirmación.
 * @param contrasena Contraseña principal
 * @param confirmacion Contraseña repetida para confirmar
 * @returns Mensaje de error si no cumple seguridad o no coinciden, o `null` si es válida.
 */
export function validarContrasenaConConfirmacion(
  contrasena: string,
  confirmacion: string
): string | null {
  const errorContrasena = validarContrasena(contrasena);
  if (errorContrasena) {
    return errorContrasena;
  }
  if (contrasena !== confirmacion) {
    return 'Las contraseñas no coinciden.';
  }
  return null;
}
