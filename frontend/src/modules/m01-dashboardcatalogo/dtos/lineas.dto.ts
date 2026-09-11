import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DE LÍNEAS COMERCIALES
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/lineas.dto.ts
 *
 * Validación de los filtros del listado "ADMIN 15 - Líneas comerciales".
 * Sincronizado 1:1 con `FiltrosLineas` de ../interfaces/lineas.interface.ts.
 * ==============================================================================
 */

export const estadoLineaSchema = z.enum(['activa', 'inactiva', 'pausada']);

export const ordenLineasSchema = z
  .enum(['recientes', 'nombre_asc', 'nombre_desc', 'productos_desc'])
  .default('recientes');

export const filtrosLineasSchema = z.object({
  busqueda: z.string().trim().max(120, 'Máximo 120 caracteres').default(''),
  marca: z.string().min(1).nullable().default(null),
  estado: estadoLineaSchema.nullable().default(null),
  segmento: z.string().min(1).nullable().default(null),
  orden: ordenLineasSchema,
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(100).default(8),
});

export type FiltrosLineasDTO = z.infer<typeof filtrosLineasSchema>;

/** Filtros por defecto (listado sin filtrar, primera página). */
export const FILTROS_LINEAS_INICIALES: FiltrosLineasDTO = filtrosLineasSchema.parse({});

/** Normaliza un filtro parcial a un DTO completo y válido. */
export function normalizarFiltrosLineas(
  filtros?: Partial<FiltrosLineasDTO>
): FiltrosLineasDTO {
  return filtrosLineasSchema.parse(filtros ?? {});
}

/** True si hay algún filtro activo (para habilitar "Limpiar filtros"). */
export function hayFiltrosLineasActivos(filtros: FiltrosLineasDTO): boolean {
  return (
    filtros.busqueda.trim() !== '' ||
    filtros.marca !== null ||
    filtros.estado !== null ||
    filtros.segmento !== null
  );
}
