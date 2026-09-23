/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DE GESTIÓN DE PRODUCTOS (LISTADO)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/productos.interface.ts
 *
 * Tipos de integración de la vista "ADMIN 02 - Productos · Listado".
 * Cubren HU-CAT-02 (gestión de productos) y HU-CAT-09 (estado y ciclo de vida).
 *
 * Permiso M17 requerido: «Gestión de productos», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */

/**
 * Estado del ciclo de vida de un producto en el panel (HU-CAT-09 / RF-CAT-02-05).
 * "borrador" aún no cumple los requisitos para publicarse (variante + imagen).
 */
export type EstadoProducto = 'publicado' | 'borrador' | 'inactivo';

/**
 * Clase de color declarada por el producto (RF-CAT-02-03). No puede cambiarse
 * una vez que el producto tiene variantes.
 */
export type ClaseColorProducto = 'entonable' | 'colores_fijos' | 'sin_color';

/** Criterios de ordenamiento del listado. */
export type OrdenProductos =
  | 'recientes'
  | 'nombre_asc'
  | 'nombre_desc'
  | 'variantes_desc';

/** Opción genérica para los selectores de filtro (value + label). */
export interface OpcionSelect {
  valor: string;
  etiqueta: string;
}

/** Fila del listado de productos. */
export interface ProductoListado {
  id: string;
  /** Código interno / referencia comercial (RF-CAT-03-06). */
  sku: string;
  nombre: string;
  /** Miniatura optimizada; `null` mientras no se ha cargado imagen (RF-CAT-07-01). */
  imagenUrl: string | null;
  marca: string;
  categoria: string;
  /** Las pinturas exigen línea; un producto sin color (brocha) puede no declararla. */
  linea: string | null;
  claseColor: ClaseColorProducto;
  /** Número de variantes activas asociadas (RF-CAT-02-05). */
  totalVariantes: number;
  estado: EstadoProducto;
  /** Marca temporal ISO-8601 de la última edición. */
  actualizadoEn: string;
  actualizadoPor: string;
}

/** Estado de los filtros del listado (se envía tal cual al backend). */
export interface FiltrosProductos {
  busqueda: string;
  categoriaId: string | null;
  marcaId: string | null;
  lineaId: string | null;
  estado: EstadoProducto | null;
  claseColor: ClaseColorProducto | null;
  orden: OrdenProductos;
  pagina: number;
  porPagina: number;
}

/** Catálogos que llenan los selectores de la barra de filtros. */
export interface OpcionesFiltroProductos {
  categorias: OpcionSelect[];
  marcas: OpcionSelect[];
  lineas: OpcionSelect[];
}

/** Página de resultados del listado (RNF-CAT-06-01: nunca el catálogo completo). */
export interface PaginaProductos {
  items: ProductoListado[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}
