import { z } from 'zod';

// ==============================================================================
// M05 - DTO: Token opaco del visitante anónimo (ADR-01 / RNF-CAR-01-01)
// ==============================================================================

/**
 * El frontend genera el token con `crypto.randomUUID()` y lo guarda en el dispositivo.
 * Se exige un UUID para no aceptar cualquier texto como identificador de carrito, y se
 * normaliza a minúsculas para que el mismo token no abra dos carritos distintos.
 */
export const tokenVisitanteSchema = z
  .string({ error: 'El token de visitante debe ser una cadena de texto' })
  .trim()
  .toLowerCase()
  .pipe(z.uuid({ error: 'El token de visitante debe ser un UUID válido' }));

export type TokenVisitanteDTO = z.infer<typeof tokenVisitanteSchema>;
