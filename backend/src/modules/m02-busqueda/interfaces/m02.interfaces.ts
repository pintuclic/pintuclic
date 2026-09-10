import { EnumClaseColor } from '../../../core/db/types';

// ==============================================================================
// M02 - BÚSQUEDA Y NAVEGACIÓN
// Contratos e interfaces públicas del módulo (solo tipos de compilación, 0 runtime).
// ==============================================================================

/** Producto tal como se lista en un resultado de búsqueda (RF-BUS-01-04). */
export interface ProductoBusqueda {
  readonly id_producto: number;
  readonly nombre: string;
  readonly id_marca: number;
  readonly clase_color: EnumClaseColor;
}

/** Página de resultados: conserva total y ubicación para la paginación (HU-BUS-05). */
export interface PaginaBusqueda {
  readonly items: ReadonlyArray<ProductoBusqueda>;
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
}

/**
 * Filtros del catálogo aplicables de forma simultánea y multivalor (HU-BUS-02,
 * RF-BUS-02-01). Cada lista actúa como OR interno; entre filtros distintos es AND
 * (RF-BUS-02-03: siempre se devuelven productos, no variantes). El rango de precio
 * se valida (min ≤ max, RF-BUS-02-04) antes de llegar aquí.
 */
export interface FiltrosBusqueda {
  readonly idCategoria?: number[];
  readonly idSubcategoria?: number[];
  readonly idMarca?: number[];
  readonly idLinea?: number[];
  readonly idTipoResina?: number[];
  readonly idColor?: number[];
  readonly idPresentacion?: number[];
  readonly precioMin?: number;
  readonly precioMax?: number;
}
