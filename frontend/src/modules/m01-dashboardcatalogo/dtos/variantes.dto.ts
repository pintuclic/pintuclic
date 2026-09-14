import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DEL LISTADO DE VARIANTES
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/variantes.dto.ts
 *
 * Validación de los filtros de la vista "ADMIN 04 - Variantes". Sincronizado
 * 1:1 con `FiltrosVariantes` de ../interfaces/variantes.interface.ts.
 * ==============================================================================
 */

export const estadoVarianteSchema = z.enum(['activo', 'borrador', 'inactivo']);

export const campoOrdenVariantesSchema = z.enum([
  'producto',
  'presentacion',
  'base',
  'codigo',
  'precio',
  'existencia',
  'estado',
]);

export const ordenVariantesSchema = z.object({
  campo: campoOrdenVariantesSchema.default('producto'),
  direccion: z.enum(['asc', 'desc']).default('asc'),
});

export const filtrosVariantesSchema = z.object({
  busqueda: z.string().trim().max(120, 'Máximo 120 caracteres').default(''),
  productoId: z.string().min(1).nullable().default(null),
  presentacion: z.string().min(1).nullable().default(null),
  estado: estadoVarianteSchema.nullable().default(null),
  marcaId: z.string().min(1).nullable().default(null),
  orden: ordenVariantesSchema.default({ campo: 'producto', direccion: 'asc' }),
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(100).default(10),
});

export type FiltrosVariantesDTO = z.infer<typeof filtrosVariantesSchema>;

export const FILTROS_VARIANTES_INICIALES: FiltrosVariantesDTO = filtrosVariantesSchema.parse({});

export function normalizarFiltrosVariantes(
  filtros?: Partial<FiltrosVariantesDTO>
): FiltrosVariantesDTO {
  return filtrosVariantesSchema.parse(filtros ?? {});
}

export function hayFiltrosVariantesActivos(filtros: FiltrosVariantesDTO): boolean {
  return (
    filtros.busqueda.trim() !== '' ||
    filtros.productoId !== null ||
    filtros.presentacion !== null ||
    filtros.estado !== null ||
    filtros.marcaId !== null
  );
}
