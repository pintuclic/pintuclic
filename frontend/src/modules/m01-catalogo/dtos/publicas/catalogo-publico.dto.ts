import { z } from 'zod';

/** Entrada del buscador público. Mantiene la validación fuera de la vista Vue. */
export const busquedaCatalogoPublicoSchema = z.object({
  q: z.string().trim().max(120, 'La búsqueda no puede superar 120 caracteres'),
});

export type BusquedaCatalogoPublicoDTO = z.infer<typeof busquedaCatalogoPublicoSchema>;

export function normalizarBusquedaCatalogoPublico(valor: string): BusquedaCatalogoPublicoDTO {
  return busquedaCatalogoPublicoSchema.parse({ q: valor });
}

/**
 * Valor de precio del panel: vacío o 0 significan «sin límite»; un negativo es un error
 * que se informa en lugar de descartarse en silencio.
 */
const numeroOVacio = (valor: unknown) => (typeof valor === 'number' && Number.isFinite(valor) ? valor : undefined);

/** Mínimo: vacío o 0 equivalen a «desde $0» (sin límite inferior); un negativo es un error. */
const precioMinimo = z
  .preprocess(numeroOVacio, z.number().nonnegative('El precio no puede ser negativo.').optional())
  .transform((valor) => (valor === 0 ? undefined : valor));

/**
 * Máximo: vacío significa «sin límite»; 0 no es válido (ningún producto cuesta $0, así que
 * aplicarlo no tiene sentido y antes se convertía en silencio en «sin límite»).
 */
const precioMaximo = z.preprocess(
  numeroOVacio,
  z.number().nonnegative('El precio no puede ser negativo.').positive('El precio máximo debe ser mayor que 0.').optional()
);

/** Rango de precio del panel de filtros (RF-BUS-02-04 / CA-BUS-02-06). */
export const rangoPrecioPublicoSchema = z
  .object({ min: precioMinimo, max: precioMaximo })
  .refine((r) => r.min === undefined || r.max === undefined || r.min <= r.max, {
    message: 'El precio mínimo no puede ser mayor que el máximo.',
    path: ['min'],
  });

export type RangoPrecioPublicoDTO = z.infer<typeof rangoPrecioPublicoSchema>;
