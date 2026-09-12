/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DE CATEGORÍAS Y SUBCATEGORÍAS
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/categorias.interface.ts
 *
 * Tipos de integración de la vista "ADMIN 05 - Categorías y subcategorías".
 * Cubren HU-CAT-01: exactamente dos niveles (categoría / subcategoría), nombre
 * obligatorio en ambas (≤ 100), padre obligatorio en la subcategoría, unicidad
 * de nombre por nivel y baja lógica en cascada (RF-CAT-01-01..05).
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * ==============================================================================
 */

export type TipoNodoCategoria = 'categoria' | 'subcategoria';

/** Estado de publicación (baja lógica, RF-CAT-01-04 / HU-CAT-09). */
export type EstadoCategoria = 'publicado' | 'inactivo';

export type CampoOrdenElementoCategoria =
  | 'nombre'
  | 'tipo'
  | 'padre'
  | 'productos'
  | 'estado'
  | 'orden';

export interface OrdenElementoCategoria {
  campo: CampoOrdenElementoCategoria;
  direccion: 'asc' | 'desc';
}

/** Nodo del árbol / fila de la tabla de elementos. */
export interface NodoCategoria {
  id: string;
  nombre: string;
  tipo: TipoNodoCategoria;
  /** `null` en una categoría raíz; id de la categoría padre en una subcategoría. */
  padreId: string | null;
  padreNombre: string | null;
  /** Nivel en la jerarquía: 1 categoría, 2 subcategoría. */
  nivel: 1 | 2;
  /** Orden de visualización dentro de su nivel (RF-CAT-01-01). */
  orden: number;
  /** Productos activos asociados (directos, sin contar los de subcategorías). */
  productosAsociados: number;
  estado: EstadoCategoria;
}

/** Categoría raíz con sus subcategorías, para el panel de árbol. */
export interface CategoriaConHijos extends NodoCategoria {
  hijos: NodoCategoria[];
}

/** Detalle de la categoría seleccionada (panel derecho). */
export interface DetalleCategoria {
  categoria: NodoCategoria;
  descripcion: string;
  /** Productos asociados a la categoría y todas sus subcategorías. */
  totalProductos: number;
  totalSubcategorias: number;
  nivel: 1 | 2;
  ordenVisualizacion: number;
  /** La categoría + sus subcategorías, como filas de la tabla "Elementos". */
  elementos: NodoCategoria[];
}

/** Filtro local de la tabla de elementos de la categoría seleccionada. */
export interface FiltrosElementosCategoria {
  busqueda: string;
  tipo: TipoNodoCategoria | null;
  estado: EstadoCategoria | null;
  orden: OrdenElementoCategoria;
}
