import { z } from 'zod';

/** Entrada del buscador público. Mantiene la validación fuera de la vista Vue. */
export const busquedaCatalogoPublicoSchema = z.object({
  q: z.string().trim().max(120, 'La búsqueda no puede superar 120 caracteres'),
});

export type BusquedaCatalogoPublicoDTO = z.infer<typeof busquedaCatalogoPublicoSchema>;

export function normalizarBusquedaCatalogoPublico(valor: string): BusquedaCatalogoPublicoDTO {
  return busquedaCatalogoPublicoSchema.parse({ q: valor });
}

/** Valor de precio del panel: vacío, no numérico o ≤ 0 se trata como «sin límite». */
const precioOpcional = z.preprocess(
  (valor) => (typeof valor === 'number' && Number.isFinite(valor) && valor > 0 ? valor : undefined),
  z.number().positive().optional()
);

/** Rango de precio del panel de filtros (RF-BUS-02-04 / CA-BUS-02-06). */
export const rangoPrecioPublicoSchema = z
  .object({ min: precioOpcional, max: precioOpcional })
  .refine((r) => r.min === undefined || r.max === undefined || r.min <= r.max, {
    message: 'El precio mínimo no puede ser mayor que el máximo.',
    path: ['min'],
  });

export type RangoPrecioPublicoDTO = z.infer<typeof rangoPrecioPublicoSchema>;
