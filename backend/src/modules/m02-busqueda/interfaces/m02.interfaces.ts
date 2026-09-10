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

/**
 * Ventana temporal para consultar la analítica de búsquedas sin resultado
 * (HU-BUS-06, RF-BUS-06-02).
 */
export type PeriodoEstadistica = 'diario' | 'semanal' | 'mensual' | 'anual';

/**
 * Término sin resultado agregado (HU-BUS-06, CA-BUS-06-01): un término aparece una
 * sola vez con su número de repeticiones. Sin identidad de usuario (CA-BUS-06-02).
 */
export interface TerminoSinResultado {
  readonly termino: string;
  readonly repeticiones: number;
}

/**
 * Criterio de ordenamiento de resultados (HU-BUS-03, RF-BUS-03-01). `relevancia`
 * pondera nombre>marca>línea>color>descripción (RF-BUS-03-02); `precio_asc`/`desc`
 * ordenan por el precio del producto; `novedad`, por lo más reciente.
 */
export type OrdenBusqueda = 'relevancia' | 'precio_asc' | 'precio_desc' | 'novedad';

/**
 * Página de resultados (HU-BUS-05). Entrega solo el tramo pedido (RF-BUS-05-01) e
 * incluye los metadatos para páginas numeradas (RF-BUS-05-02): `total` de
 * resultados, `pagina` actual, `limite` (tamaño) y `total_paginas`. Una página que
 * excede el total devuelve `items` vacío sin error (CA-BUS-05-04).
 */
export interface PaginaBusqueda {
  readonly items: ReadonlyArray<ProductoBusqueda>;
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
  readonly total_paginas: number;
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
