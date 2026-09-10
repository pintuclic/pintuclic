import { z } from 'zod';

// ==============================================================================
// M02 - DTO DE BÚSQUEDA (Zod)
// Valida los parámetros de query de HU-BUS-01. El término es opcional y sin
// longitud mínima (RF-BUS-01-01: vacío => catálogo completo). `pagina`/`limite`
// llegan como texto en la URL, por eso se coaccionan a número (HU-BUS-05).
// ==============================================================================

export const BuscarProductosDto = z.object({
  q: z.string().trim().max(150, 'El término de búsqueda es demasiado largo').optional(),
  pagina: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().positive().max(100).optional(),
});
export type BuscarProductosDto = z.infer<typeof BuscarProductosDto>;
