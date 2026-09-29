import { z } from 'zod';
import { contrasenaSchema } from '../../m20-seguridad/dtos/seguridad.dto';

// ==============================================================================
// M04 - DTOs de Recuperación de Contraseña (HU-CUE-05)
// ==============================================================================

/**
 * DTO para solicitar la recuperación de contraseña (HU-CUE-05 / RF-CUE-05-01).
 * La respuesta HTTP debe ser idéntica exista o no el correo (RF-CUE-05-04 / RF-SEG-06-06).
 */
export const solicitarRecuperacionSchema = z.object({
  correo: z
    .string()
    .trim()
    .email('Debe indicar un correo electrónico válido')
    .transform((val) => val.toLowerCase()),
});

export type SolicitarRecuperacionDTO = z.infer<typeof solicitarRecuperacionSchema>;

/**
 * DTO para confirmar el cambio de contraseña mediante el código OTP recibido (CA-CUE-05-01, CA-CUE-05-04).
 */
export const confirmarRecuperacionSchema = z.object({
  correo: z
    .string()
    .trim()
    .email('Debe indicar un correo válido')
    .transform((val) => val.toLowerCase()),
  codigo: z
    .string()
    .trim()
    .min(4, 'El código debe tener al menos 4 caracteres')
    .max(10, 'El código no puede superar 10 caracteres'),
  contrasenaNueva: contrasenaSchema,
});

export type ConfirmarRecuperacionDTO = z.infer<typeof confirmarRecuperacionSchema>;
