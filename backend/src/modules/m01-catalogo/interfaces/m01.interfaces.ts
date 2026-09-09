import { EnumEstadoGeneral, EnumClaseColor, EnumEstadoProducto } from '../../../core/db/types';

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
  /** Reglas comerciales vigentes de M06 que dependen del elemento (RF-CAT-11-03). */
  readonly reglas_afectadas?: number;
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
