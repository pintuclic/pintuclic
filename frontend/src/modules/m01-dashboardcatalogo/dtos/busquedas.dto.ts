import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DEL REPORTE DE BÚSQUEDAS SIN RESULTADO
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/busquedas.dto.ts
 *
 * Sincronizado 1:1 con `FiltrosBusquedas` de
 * ../interfaces/busquedas.interface.ts.
 * ==============================================================================
 */

export const periodoBusquedaSchema = z.enum(['7d', '30d', '90d', 'todo']).default('30d');
export const frecuenciaBusquedaSchema = z.enum(['todas', 'alta', 'media', 'baja']).default('todas');

export const filtrosBusquedasSchema = z.object({
  busqueda: z.string().trim().max(120, 'Máximo 120 caracteres').default(''),
  periodo: periodoBusquedaSchema,
  categoriaId: z.string().min(1).nullable().default(null),
  frecuencia: frecuenciaBusquedaSchema,
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(100).default(10),
});

export type FiltrosBusquedasDTO = z.infer<typeof filtrosBusquedasSchema>;

export const FILTROS_BUSQUEDAS_INICIALES: FiltrosBusquedasDTO = filtrosBusquedasSchema.parse({});

export function normalizarFiltrosBusquedas(
  filtros?: Partial<FiltrosBusquedasDTO>
): FiltrosBusquedasDTO {
  return filtrosBusquedasSchema.parse(filtros ?? {});
}

export function hayFiltrosBusquedasActivos(filtros: FiltrosBusquedasDTO): boolean {
  return (
    filtros.busqueda.trim() !== '' ||
    filtros.periodo !== '30d' ||
    filtros.categoriaId !== null ||
    filtros.frecuencia !== 'todas'
  );
}
