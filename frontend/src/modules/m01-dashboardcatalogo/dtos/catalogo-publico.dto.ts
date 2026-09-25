import { z } from 'zod';

/** Entrada del buscador público. Mantiene la validación fuera de la vista Vue. */
export const busquedaCatalogoPublicoSchema = z.object({
  q: z.string().trim().max(120, 'La búsqueda no puede superar 120 caracteres'),
});

export type BusquedaCatalogoPublicoDTO = z.infer<typeof busquedaCatalogoPublicoSchema>;

export function normalizarBusquedaCatalogoPublico(valor: string): BusquedaCatalogoPublicoDTO {
  return busquedaCatalogoPublicoSchema.parse({ q: valor });
}
