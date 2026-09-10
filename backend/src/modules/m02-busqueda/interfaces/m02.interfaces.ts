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
