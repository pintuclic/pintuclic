/**
 * ==============================================================================
 * M01 - CONTRATOS DEL CATÁLOGO (0 runtime)
 * Ubicación: src/modules/m01-catalogo/interfaces/index.ts
 *
 * Espejo 1:1 de lo que responde el backend en `/api/catalogo`
 * (backend/src/modules/m01-catalogo/interfaces/m01.interfaces.ts y las tablas
 * de core/db/types.ts). Si el backend cambia un contrato, se cambia aquí y en
 * ningún otro lugar.
 * ==============================================================================
 */

// ------------------------------------------------------------------------------
// Sobre estándar de respuesta (core/utils/apiResponse.ts del backend)
// ------------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorDetalle {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string; details?: ApiErrorDetalle[] };
}

// ------------------------------------------------------------------------------
// Enumeraciones compartidas con la base de datos
// ------------------------------------------------------------------------------

export type EstadoGeneral = 'activo' | 'inactivo';
export type EstadoVariante = 'activo' | 'inactivo' | 'agotado' | 'descontinuado';
export type ClaseColor = 'entonable' | 'colores_fijos' | 'sin_color';

// ------------------------------------------------------------------------------
// Entidades administrativas (HU-CAT-01, 02, 03, 04, 05, 10, 11, 12)
// ------------------------------------------------------------------------------

export interface Categoria {
  id_categoria: number;
  nombre: string;
  orden: number;
  estado: EstadoGeneral;
}

export interface Subcategoria {
  id_subcategoria: number;
  id_categoria: number;
  nombre: string;
  orden: number;
  estado: EstadoGeneral;
}

export interface Marca {
  id_marca: number;
  nombre: string;
  logotipo_mime_type: string;
  estado: EstadoGeneral;
}

export interface Linea {
  id_linea: number;
  id_marca: number;
  nombre: string;
  gama_comercial: string | null;
  estado: EstadoGeneral;
}

export interface Base {
  id_base: number;
  id_marca: number;
  nombre: string;
  estado: EstadoGeneral;
}

export interface Cielab {
  l: number;
  a: number;
  b: number;
}

export interface Color {
  id_color: number;
  id_marca: number;
  nombre: string;
  codigo: string | null;
  cielab: Cielab;
  muestra_hex: string;
  estado: EstadoGeneral;
}

export interface TipoResina {
  id_tipo_resina: number;
  nombre: string;
  estado: EstadoGeneral;
}

export interface Presentacion {
  id_presentacion: number;
  nombre: string;
  volumen: number;
  estado: EstadoGeneral;
}

export interface Producto {
  id_producto: number;
  id_marca: number;
  id_linea: number | null;
  id_tipo_resina: number | null;
  nombre: string;
  descripcion: string | null;
  clase_color: ClaseColor;
  estado: EstadoGeneral;
  publicado: boolean;
  id_subcategorias: number[];
  rendimiento_min: number | null;
  rendimiento_max: number | null;
  id_categoria_complementaria: number | null;
  patrocinado: boolean;
}

export interface Variante {
  id_variante: number;
  id_producto: number;
  id_presentacion: number;
  id_color: number | null;
  id_base: number | null;
  precio_vigente: number;
  existencia_referencial: number;
  codigo_proveedor: string | null;
  estado: EstadoVariante;
}

export interface RendimientoPorPresentacion {
  id_presentacion: number;
  nombre: string;
  volumen: number;
  rendimiento_min: number;
  rendimiento_max: number;
}

export interface RendimientoProducto {
  id_producto: number;
  rendimiento_min: number | null;
  rendimiento_max: number | null;
  por_presentacion: RendimientoPorPresentacion[];
}

export interface Imagen {
  id_imagen: number;
  id_producto: number;
  id_variante: number | null;
  id_color: number | null;
  mime_type: string;
  orden: number;
  es_principal: boolean;
  /** Llega con prefijo `/api`; usar `rutaApi()` antes de pedirla con apiClient. */
  contenido_url: string;
}

// ------------------------------------------------------------------------------
// Ciclo de vida (HU-CAT-09)
// ------------------------------------------------------------------------------

/** Respuesta de categorías, subcategorías y líneas cuando se desactiva sin `confirmar`. */
export interface ImpactoDesactivacion {
  requiere_confirmacion: true;
  productos_afectados: number;
  subcategorias_afectadas?: number;
  reglas_afectadas?: number;
}

export interface ImpactoDesactivacionMarca {
  requiere_confirmacion: true;
  lineas_afectadas: number;
  bases_afectadas: number;
  colores_afectados: number;
  productos_afectados: number;
}

export interface ImpactoDesactivacionProducto {
  requiere_confirmacion: true;
  variantes_afectadas: number;
  imagenes_afectadas: number;
}

export type Impacto = ImpactoDesactivacion | ImpactoDesactivacionMarca | ImpactoDesactivacionProducto;

export interface ResultadoDesactivacion {
  desactivado: true;
}

export interface ResultadoReactivacion {
  reactivado: true;
}

// ------------------------------------------------------------------------------
// Formulario genérico del panel (components/admin/ModalFormularioCatalogo.vue)
// ------------------------------------------------------------------------------

export interface OpcionSelect {
  valor: number | string;
  etiqueta: string;
}

/**
 * Campo declarativo. `cielab` pinta L*, a*, b* (claves `l`, `a`, `b`) con muestra
 * y selector de color; `imagen` produce un data URL base64.
 */
export interface CampoFormulario {
  clave: string;
  etiqueta: string;
  tipo: 'texto' | 'numero' | 'textarea' | 'select' | 'imagen' | 'cielab';
  opciones?: OpcionSelect[];
  placeholder?: string;
  ayuda?: string;
  deshabilitado?: boolean;
}

export type ValoresFormulario = Record<string, string | number | boolean | null | number[]>;

// ------------------------------------------------------------------------------
// Consulta pública (HU-CAT-06) — sin autenticación
// ------------------------------------------------------------------------------

export interface CategoriaPublica {
  id_categoria: number;
  nombre: string;
  subcategorias: { id_subcategoria: number; nombre: string }[];
}

export interface ProductoPublicoResumen {
  id_producto: number;
  nombre: string;
  id_marca: number;
  clase_color: ClaseColor;
}

export interface PaginaProductosPublicos {
  items: ProductoPublicoResumen[];
  total: number;
  pagina: number;
  limite: number;
}

export interface VariantePublica {
  id_variante: number;
  id_presentacion: number;
  presentacion: string;
  volumen: number;
  id_color: number | null;
  color: string | null;
  id_base: number | null;
  base: string | null;
  precio_vigente: number;
  existencia_referencial: number;
}

export interface FichaProductoPublico {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  id_marca: number;
  clase_color: ClaseColor;
  rendimiento_min: number | null;
  rendimiento_max: number | null;
  variantes: VariantePublica[];
  imagenes: Imagen[];
}
