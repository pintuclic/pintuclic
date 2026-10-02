import { z } from 'zod';
import { tokenVisitanteSchema } from './token-visitante.dto';

// ==============================================================================
// M05 - DTO: Fusionar carrito de visitante con cuenta de cliente (HU-CAR-04)
// ==============================================================================

/**
 * DTO para asociar el carrito anónimo de un visitante al cliente recién autenticado.
 * El token_visitante identifica el carrito previo del dispositivo (RF-CAR-04-01).
 * Si el token no tiene carrito asociado, el servicio solo retorna el carrito del cliente.
 */
export const fusionarCarritoSchema = z.object({
  token_visitante: tokenVisitanteSchema,
});

export type FusionarCarritoDTO = z.infer<typeof fusionarCarritoSchema>;
