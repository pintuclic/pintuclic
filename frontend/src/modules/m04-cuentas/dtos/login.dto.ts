import { z } from 'zod';
import { correoSchema } from '@/core/dtos/seguridad.dto';

/**
 * ==============================================================================
 * M04 - DTOs DE LOGIN Y ACCESO (HU-CUE-04 / HU-CUE-02)
 * Ubicación: src/modules/m04-cuentas/dtos/login.dto.ts
 * ==============================================================================
 */

/**
 * Esquema de validación para el formulario de inicio de sesión (HU-CUE-04).
 */
export const loginSchema = z.object({
  correo: correoSchema,
  contrasena: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
});

export type LoginDTO = z.infer<typeof loginSchema>;
