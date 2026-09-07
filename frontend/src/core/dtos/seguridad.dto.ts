import { z } from 'zod';

/**
 * ==============================================================================
 * DTOs GLOBALES DE SEGURIDAD Y CAMPOS COMUNES (M20 / HU-SEG-01)
 * Ubicación: src/core/dtos/seguridad.dto.ts
 * Esquemas Zod y validadores transversales reutilizables por cualquier módulo.
 * Sincronizado 1:1 con backend (backend/src/modules/m20-seguridad/dtos/seguridad.dto.ts).
 * ==============================================================================
 */

/**
 * Regla transversal de validación de contraseñas (HU-SEG-01).
 * Exige:
 * - Mínimo 8 caracteres, máximo 128 caracteres.
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
 * DTO para parejas de contraseña y su confirmación.
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
 * Regla transversal de teléfono celular / WhatsApp (formato Colombia / internacional).
 */
export const telefonoSchema = z
  .string({ required_error: 'El teléfono es obligatorio' })
  .trim()
  .min(7, 'El teléfono debe tener al menos 7 dígitos')
  .max(20, 'El teléfono no puede exceder 20 caracteres')
  .regex(/^[0-9+\s\-()]+$/, 'El formato de teléfono es inválido');

export type TelefonoDTO = z.infer<typeof telefonoSchema>;

/**
 * Regla transversal de correo electrónico normalizado.
 */
export const correoSchema = z
  .string({ required_error: 'El correo electrónico es obligatorio' })
  .trim()
  .email('Debe indicar un correo electrónico válido')
  .max(150, 'El correo no puede exceder 150 caracteres');

export type CorreoDTO = z.infer<typeof correoSchema>;

/**
 * Validador atómico DRY para cualquier campo o valor de contraseña.
 */
export function validarContrasena(contrasena: string): string | null {
  const resultado = contrasenaSchema.safeParse(contrasena);
  if (!resultado.success) {
    return resultado.error.issues[0]?.message ?? 'Contraseña inválida';
  }
  return null;
}

/**
 * Validador atómico DRY para pares de contraseña y confirmación.
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
