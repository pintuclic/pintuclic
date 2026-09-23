/** Contratos de la API pública de M01 (HU-CAT-06). */
export type ClaseColorPublica = 'entonable' | 'colores_fijos' | 'sin_color';

export interface SubcategoriaPublica {
  readonly id_subcategoria: number;
  readonly nombre: string;
}

export interface CategoriaPublica {
  readonly id_categoria: number;
  readonly nombre: string;
  readonly subcategorias: readonly SubcategoriaPublica[];
}

export interface ProductoPublicoResumen {
  readonly id_producto: number;
  readonly nombre: string;
  readonly id_marca: number;
  readonly clase_color: ClaseColorPublica;
}

export interface PaginaProductosPublicos {
  readonly items: readonly ProductoPublicoResumen[];
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
}

export interface VariantePublica {
  readonly id_variante: number;
  readonly id_presentacion: number;
  readonly presentacion: string;
  readonly volumen: number;
  readonly id_color: number | null;
  readonly color: string | null;
  readonly codigo_color?: string | null;
  readonly muestra_hex?: string | null;
  readonly familia_color?: string | null;
  readonly id_base: number | null;
  readonly base: string | null;
  readonly precio_vigente: number;
  readonly existencia_referencial: number;
}

export interface ImagenPublica {
  readonly id_imagen: number;
  readonly id_producto: number;
  readonly id_variante: number | null;
  readonly id_color: number | null;
  readonly mime_type: string;
  readonly orden: number;
  readonly es_principal: boolean;
  readonly contenido_url: string;
}

export interface FichaProductoPublico {
  readonly id_producto: number;
  readonly nombre: string;
  readonly descripcion: string | null;
  readonly id_marca: number;
  readonly clase_color: ClaseColorPublica;
  readonly rendimiento_min: number | null;
  readonly rendimiento_max: number | null;
  readonly variantes: readonly VariantePublica[];
  readonly imagenes: readonly ImagenPublica[];
}

export interface ProductoDestacadoPublico extends ProductoPublicoResumen {
  readonly detalle: FichaProductoPublico | null;
}

/** Color deducido exclusivamente de variantes activas expuestas por la API pública. */
export interface ColorPaletaPublica {
  readonly id_color: number;
  readonly nombre: string;
  readonly codigo: string | null;
  readonly muestra_hex: string | null;
  readonly familia: string | null;
  readonly productos: readonly ProductoDestacadoPublico[];
}

/** Parámetros de consulta; la paginación se resuelve en el servidor. */
export interface ConsultaCatalogoPublico {
  q?: string;
  subcategoria?: number;
  pagina?: number;
  limite?: number;
}

/** Puerto de lectura público, independiente del transporte HTTP. */
export interface CatalogoPublicoGateway {
  listarCategorias(): Promise<CategoriaPublica[]>;
  listarProductos(params: ConsultaCatalogoPublico): Promise<PaginaProductosPublicos>;
  obtenerFicha(idProducto: number): Promise<FichaProductoPublico>;
  listarComplementarios(idProducto: number): Promise<ProductoPublicoResumen[]>;
}

export interface EsquemaColorPublico {
  readonly nombre: string;
  readonly descripcion: string;
  readonly colores: readonly ColorPaletaPublica[];
}
