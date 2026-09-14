import { z } from 'zod';

// ==============================================================================
// M05 - DTO: Fusionar carrito de visitante con cuenta de cliente (HU-CAR-04)
// ==============================================================================

/**
 * DTO para asociar el carrito anónimo de un visitante al cliente recién autenticado.
 * El token_visitante identifica el carrito previo del dispositivo (RF-CAR-04-01).
 * Si no se envía token, el servicio solo retorna el carrito existente del cliente.
 */
export const fusionarCarritoSchema = z.object({
  token_visitante: z
    .string({ error: 'El token de visitante debe ser una cadena de texto' })
    .trim()
    .min(1, 'El token de visitante no puede estar vacío')
    .max(255, 'El token de visitante no puede superar 255 caracteres'),
});

export type FusionarCarritoDTO = z.infer<typeof fusionarCarritoSchema>;
