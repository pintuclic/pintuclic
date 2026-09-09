import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DEL LISTADO DE PRODUCTOS
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/productos.dto.ts
 *
 * Validación de los filtros que la vista "ADMIN 02 - Productos" envía al
 * backend. Sincronizado 1:1 con `FiltrosProductos` de
 * ../interfaces/productos.interface.ts.
 * ==============================================================================
 */

export const estadoProductoSchema = z.enum(['publicado', 'borrador', 'inactivo']);
export const claseColorProductoSchema = z.enum(['entonable', 'colores_fijos', 'sin_color']);

export const ordenProductosSchema = z
  .enum(['recientes', 'nombre_asc', 'nombre_desc', 'variantes_desc'])
  .default('recientes');

export const filtrosProductosSchema = z.object({
  busqueda: z.string().trim().max(120, 'Máximo 120 caracteres').default(''),
  categoriaId: z.string().min(1).nullable().default(null),
  marcaId: z.string().min(1).nullable().default(null),
  lineaId: z.string().min(1).nullable().default(null),
  estado: estadoProductoSchema.nullable().default(null),
  claseColor: claseColorProductoSchema.nullable().default(null),
  orden: ordenProductosSchema,
  pagina: z.number().int().positive().default(1),
  porPagina: z.number().int().positive().max(100).default(8),
});

export type FiltrosProductosDTO = z.infer<typeof filtrosProductosSchema>;

/** Filtros por defecto (listado sin filtrar, primera página). */
export const FILTROS_PRODUCTOS_INICIALES: FiltrosProductosDTO = filtrosProductosSchema.parse({});

/** Normaliza un filtro parcial a un DTO completo y válido. */
export function normalizarFiltrosProductos(
  filtros?: Partial<FiltrosProductosDTO>
): FiltrosProductosDTO {
  return filtrosProductosSchema.parse(filtros ?? {});
}

/** True si hay algún filtro activo (para habilitar "Limpiar filtros"). */
export function hayFiltrosActivos(filtros: FiltrosProductosDTO): boolean {
  return (
    filtros.busqueda.trim() !== '' ||
    filtros.categoriaId !== null ||
    filtros.marcaId !== null ||
    filtros.lineaId !== null ||
    filtros.estado !== null ||
    filtros.claseColor !== null
  );
}
