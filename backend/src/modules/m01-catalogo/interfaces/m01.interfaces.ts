import { Transaction } from 'kysely';
import { Database, EnumEstadoGeneral, EnumClaseColor, EnumEstadoProducto } from '../../../core/db/types';

// ==============================================================================
// M01 - CATÁLOGO DE PRODUCTOS
// Contratos e interfaces públicas del módulo (Solo tipos de compilación, 0 runtime)
// ==============================================================================

// ------------------------------------------------------------------------------
// CATEGORÍAS Y SUBCATEGORÍAS (HU-CAT-01)
// ------------------------------------------------------------------------------

/** Ficha de una categoría raíz tal como se expone en el panel administrativo. */
export interface CategoriaDetalle {
  readonly id_categoria: number;
  readonly nombre: string;
  readonly orden: number;
  readonly estado: EnumEstadoGeneral;
  /** RF-CAT-08-01: complementarios heredables por los productos de la categoría. */
  readonly id_categoria_complementaria: number | null;
}

/** Ficha de una subcategoría, siempre atada a una única categoría padre (RF-CAT-01-02). */
export interface SubcategoriaDetalle {
  readonly id_subcategoria: number;
  readonly id_categoria: number;
  readonly nombre: string;
  readonly orden: number;
  readonly estado: EnumEstadoGeneral;
}

/**
 * Resultado de contar el impacto de una desactivación antes de confirmarla
 * (RF-CAT-01-04, CA-CAT-01-05: "el sistema me dice antes cuántos productos
 * dejarán de verse").
 */
export interface ImpactoDesactivacion {
  readonly requiere_confirmacion: true;
  readonly productos_afectados: number;
  readonly subcategorias_afectadas?: number;
  /**
   * Reglas comerciales vigentes de M06 que dependen del elemento (RF-CAT-11-03).
   * `null` indica que M06 no está integrado: no hay conteo confirmado.
   */
  readonly reglas_afectadas?: number | null;
}

/** Confirmación de que la desactivación (o reactivación) se aplicó. */
export interface ResultadoDesactivacion {
  readonly desactivado: true;
}

export interface ResultadoReactivacion {
  readonly reactivado: true;
}

// ------------------------------------------------------------------------------
// LÍNEAS COMERCIALES (HU-CAT-11)
// ------------------------------------------------------------------------------

/** Ficha de una línea comercial, siempre atada a una única marca (RF-CAT-11-02). */
export interface LineaDetalle {
  readonly id_linea: number;
  readonly id_marca: number;
  readonly nombre: string;
  readonly gama_comercial: string | null;
  readonly estado: EnumEstadoGeneral;
}

// ------------------------------------------------------------------------------
// MARCAS (HU-CAT-04)
// ------------------------------------------------------------------------------

/**
 * Ficha de una marca sin el binario del logotipo (nunca viaja en listados ni
 * fichas, para no inflar las respuestas JSON). El logotipo se sirve aparte
 * por `GET /catalogo/marcas/:id/logotipo`.
 */
export interface MarcaResumen {
  readonly id_marca: number;
  readonly nombre: string;
  readonly logotipo_mime_type: string;
  readonly estado: EnumEstadoGeneral;
}

/** Bytes crudos del logotipo, para el endpoint dedicado de servirlo. */
export interface MarcaLogotipo {
  readonly logotipo: Buffer;
  readonly logotipo_mime_type: string;
}

// ------------------------------------------------------------------------------
// COLORES (HU-CAT-05)
// ------------------------------------------------------------------------------

/**
 * Ficha de un color tal como se expone en el panel. Cada color pertenece a una
 * única marca (RF-CAT-05-01). `muestra_hex` se deriva del valor CIELAB para
 * pintar la muestra sin requerir imagen (RF-CAT-05-02).
 */
export interface ColorDetalle {
  readonly id_color: number;
  readonly id_marca: number;
  readonly nombre: string;
  readonly codigo: string | null;
  readonly cielab: { readonly l: number; readonly a: number; readonly b: number };
  readonly muestra_hex: string;
  readonly estado: EnumEstadoGeneral;
}

// ------------------------------------------------------------------------------
// PRODUCTOS (HU-CAT-02)
// ------------------------------------------------------------------------------

/**
 * Ficha de un producto tal como se expone en el panel. La información es común e
 * independiente de las variantes (RF-CAT-02-01). `id_subcategorias` es la lista
 * de subcategorías a las que pertenece (RF-CAT-02-02, al menos una).
 */
export interface ProductoDetalle {
  readonly id_producto: number;
  readonly id_marca: number;
  readonly id_linea: number | null;
  readonly id_tipo_resina: number | null;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly clase_color: EnumClaseColor;
  readonly estado: EnumEstadoGeneral;
  readonly publicado: boolean;
  readonly id_subcategorias: number[];
  readonly rendimiento_min: number | null;
  readonly rendimiento_max: number | null;
  readonly id_categoria_complementaria: number | null;
  readonly patrocinado: boolean;
}

/** Rendimiento derivado para una presentación concreta (RF-CAT-10-03). */
export interface RendimientoPorPresentacion {
  readonly id_presentacion: number;
  readonly nombre: string;
  readonly volumen: number;
  readonly rendimiento_min: number;
  readonly rendimiento_max: number;
}

/** Rendimiento del producto (por galón) y su derivación por presentación (HU-CAT-10). */
export interface RendimientoProducto {
  readonly id_producto: number;
  readonly rendimiento_min: number | null;
  readonly rendimiento_max: number | null;
  readonly por_presentacion: RendimientoPorPresentacion[];
}

// ------------------------------------------------------------------------------
// IMÁGENES (HU-CAT-07)
// ------------------------------------------------------------------------------

/**
 * Metadatos de una imagen del producto (sin el binario). El binario se sirve
 * aparte por `contenido_url` (RF-CAT-07-03). Puede asociarse a una variante o a
 * un color (RF-CAT-07-02).
 */
export interface ImagenDetalle {
  readonly id_imagen: number;
  readonly id_producto: number;
  readonly id_variante: number | null;
  readonly id_color: number | null;
  readonly mime_type: string;
  readonly orden: number;
  readonly es_principal: boolean;
  readonly contenido_url: string;
}

/** Bytes crudos de una imagen, para el endpoint dedicado de servirla. */
export interface ImagenContenido {
  readonly datos: Buffer;
  readonly mime_type: string;
}

/**
 * RNF-CAT-07-01: tamaño de imagen que se entrega al visitante. La miniatura
 * sirve a los listados, la optimizada a la ficha y el original al panel.
 */
export type TamanoImagen = 'miniatura' | 'optimizada' | 'original';

/** Versiones derivadas de una imagen original (WebP). */
export interface VersionesImagen {
  readonly miniatura: Buffer;
  readonly optimizada: Buffer;
}

/**
 * Puerto de procesamiento de imágenes (RNF-CAT-07-01). Aísla la librería de
 * imágenes del resto del módulo y permite sustituirla en las pruebas.
 */
export interface OptimizadorImagenes {
  readonly mimeVersiones: string;
  /** Genera las versiones; rechaza si el archivo no es una imagen válida. */
  generarVersiones(original: Buffer): Promise<VersionesImagen>;
}

// ------------------------------------------------------------------------------
// CICLO DE VIDA (HU-CAT-09): aviso de impacto en cascada antes de desactivar
// ------------------------------------------------------------------------------

/** RF-CAT-09-03: elementos que quedarán ocultos al desactivar una marca. */
export interface ImpactoDesactivacionMarca {
  readonly requiere_confirmacion: true;
  readonly lineas_afectadas: number;
  readonly bases_afectadas: number;
  readonly colores_afectados: number;
  readonly productos_afectados: number;
}

/** RF-CAT-09-03: elementos que quedarán ocultos al desactivar un producto. */
export interface ImpactoDesactivacionProducto {
  readonly requiere_confirmacion: true;
  readonly variantes_afectadas: number;
  readonly imagenes_afectadas: number;
}

// ------------------------------------------------------------------------------
// CONSULTA PÚBLICA (HU-CAT-06) — solo elementos activos y publicados
// ------------------------------------------------------------------------------

/** Categoría pública con sus subcategorías que tienen productos activos+publicados. */
export interface CategoriaPublica {
  readonly id_categoria: number;
  readonly nombre: string;
  readonly subcategorias: ReadonlyArray<{ readonly id_subcategoria: number; readonly nombre: string }>;
}

/** Producto en el listado público (datos mínimos; la ficha trae el detalle). */
export interface ProductoPublicoResumen {
  readonly id_producto: number;
  readonly nombre: string;
  readonly id_marca: number;
  readonly marca: string;
  readonly clase_color: EnumClaseColor;
  readonly precio_desde: number | null;
  readonly imagen_principal_url: string | null;
  readonly cantidad_colores: number;
  readonly patrocinado: boolean;
  /** HU-CAT-13: el producto es un combo con existencia controlada. */
  readonly es_combo: boolean;
  /** CA-CAT-13-06: combo sin unidades disponibles; se muestra pero no se puede comprar. */
  readonly agotado: boolean;
}

/** Página del listado público (RNF-CAT-06-01: no se descarga todo el catálogo). */
export interface PaginaProductosPublicos {
  readonly items: ProductoPublicoResumen[];
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
}

/** Color en el listado público de colores. */
export interface ColorProductoPublico {
  readonly id_color: number;
  readonly nombre: string;
  readonly codigo_color: string | null;
  readonly muestra_hex: string;
  readonly familia_color: string;
}

/** Página de colores para el listado público. */
export interface PaginaColoresProductoPublico {
  readonly items: ColorProductoPublico[];
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
}

/** Variante vendible tal como se ofrece en la ficha pública. */
export interface VariantePublica {
  readonly id_variante: number;
  readonly id_presentacion: number;
  readonly presentacion: string;
  readonly volumen: number;
  readonly id_color: number | null;
  readonly color: string | null;
  readonly codigo_color: string | null;
  readonly muestra_hex: string | null;
  readonly familia_color: string | null;
  readonly id_base: number | null;
  readonly base: string | null;
  readonly precio_vigente: number;
  readonly existencia_referencial: number;
}

/**
 * RF-CAT-12-05 / CA-CAT-12-04/08: variante de base que se consume al pedir un
 * color entonado. M05/M08 la registran en la línea junto al color solicitado.
 */
export interface VarianteEntonada {
  readonly id_variante: number;
  readonly id_base: number;
  readonly base: string;
  readonly id_color: number;
  readonly id_presentacion: number;
  readonly precio_vigente: number;
}

/** Ficha pública de un producto (RF-CAT-06-01, CA-CAT-06-02). */
export interface FichaProductoPublico {
  readonly id_producto: number;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly id_marca: number;
  readonly clase_color: EnumClaseColor;
  readonly rendimiento_min: number | null;
  readonly rendimiento_max: number | null;
  readonly es_combo: boolean;
  readonly agotado: boolean;
  readonly variantes: VariantePublica[];
  readonly imagenes: ImagenDetalle[];
}

// ------------------------------------------------------------------------------
// PRESENTACIONES Y VARIANTES (HU-CAT-03)
// ------------------------------------------------------------------------------

/** Presentación comercial administrable con volumen numérico (RF-CAT-03-05). */
export interface PresentacionDetalle {
  readonly id_presentacion: number;
  readonly nombre: string;
  readonly volumen: number;
  readonly estado: EnumEstadoGeneral;
}

/**
 * Ficha de una variante vendible (SKU). Su forma depende de la clase del
 * producto (RF-CAT-03-02): entonable lleva base; colores_fijos lleva color;
 * sin_color no lleva ninguno. Precio y existencia viven en la variante física
 * (RF-CAT-03-04).
 */
export interface VarianteDetalle {
  readonly id_variante: number;
  readonly id_producto: number;
  readonly id_presentacion: number;
  readonly id_color: number | null;
  readonly id_base: number | null;
  readonly precio_vigente: number;
  readonly existencia_referencial: number;
  readonly codigo_proveedor: string | null;
  readonly estado: EnumEstadoProducto;
}

// ------------------------------------------------------------------------------
// COMBOS (HU-CAT-13)
// ------------------------------------------------------------------------------

/** Variante que compone un combo y cuántas unidades incluye (informativo, RF-CAT-13-01). */
export interface ComponenteCombo {
  readonly id_variante: number;
  readonly cantidad: number;
}

/** Ficha administrativa de un combo: producto propio con existencia controlada. */
export interface ComboDetalle {
  readonly id_combo: number;
  readonly id_producto: number;
  /** RF-CAT-13-01 / CA-CAT-13-09: se cobra a su precio, sin rebajas. */
  readonly excluido_descuentos: boolean;
  readonly componentes: readonly ComponenteCombo[];
}

/**
 * Unidades de una variante que una orden reserva o libera (RF-CAT-13-02/03,
 * CA-CAT-13-07). Contrato que M08 consume al generar o cancelar una orden.
 */
export interface LineaExistencia {
  readonly id_variante: number;
  readonly cantidad: number;
}

// ------------------------------------------------------------------------------
// PUERTOS HACIA MÓDULOS AÚN NO INTEGRADOS (Inversión de dependencias)
// M01 depende de estos contratos, no de M06 ni del módulo de campañas: cuando
// existan, se inyecta su implementación en m01.routes.ts sin tocar el catálogo.
// ------------------------------------------------------------------------------

/** Consulta a M06 de las reglas comerciales vigentes que dependen de una línea (RF-CAT-11-03). */
export interface ConsultaReglasComerciales {
  /** Cantidad de reglas vigentes, o `null` si M06 no está integrado. */
  contarVigentesPorLinea(idLinea: number): Promise<number | null>;
}

/** Cascada de la baja de una marca hacia sus campañas (RF-CAT-04-03), dentro de la misma transacción. */
export interface CascadaCampanas {
  desactivarPorMarca(idMarca: number, trx: Transaction<Database>): Promise<void>;
}
