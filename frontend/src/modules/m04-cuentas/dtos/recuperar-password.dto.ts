import { z } from 'zod';
import { correoSchema, contrasenaSchema } from '@/core/dtos/seguridad.dto';

/**
 * ==============================================================================
 * M04 - DTO DE RECUPERACIÓN DE CONTRASEÑA (HU-CUE-06)
 * Ubicación: src/modules/m04-cuentas/dtos/recuperar-password.dto.ts
 * ==============================================================================
 */

export const solicitarRecuperacionSchema = z.object({
  correo: correoSchema,
});

export type SolicitarRecuperacionDTO = z.infer<typeof solicitarRecuperacionSchema>;

export const confirmarRecuperacionSchema = z.object({
  contrasena_nueva: contrasenaSchema,
});

export type ConfirmarRecuperacionDTO = z.infer<typeof confirmarRecuperacionSchema>;
