/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE PRODUCTO (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/producto-formulario.interface.ts
 *
 * Tipos de integración de la vista "ADMIN 03 - Productos · Crear / editar".
 * Cubren HU-CAT-02 (gestión de productos), HU-CAT-05 (clase de color),
 * HU-CAT-07 (imágenes) y HU-CAT-09 (estado y ciclo de vida).
 *
 * Permiso M17 requerido: «Gestión de productos», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { ClaseColorProducto, OpcionSelect } from './productos.interface';

/** Estado que el formulario puede fijar (el ciclo de vida completo vive en HU-CAT-09). */
export type EstadoPublicacion = 'borrador' | 'publicado';

/** Modo de edición de la vista. */
export type ModoFormulario = 'crear' | 'editar';

/**
 * Color administrado de una marca (HU-CAT-05). `hex` es la representación visual
 * que el backend deriva del valor CIELAB (RF-CAT-05-02); el frontend solo lo pinta.
 */
export interface ColorCatalogo {
  id: string;
  nombre: string;
  codigo: string | null;
  hex: string;
  marcaId: string;
}

/** Imagen del producto (HU-CAT-07). La primera activa es la principal. */
export interface ImagenProducto {
  id: string;
  url: string;
  nombre: string;
  esPrincipal: boolean;
}

/** Subcategoría dependiente de su categoría padre (RF-CAT-01-02). */
export interface SubcategoriaOpcion extends OpcionSelect {
  categoriaId: string;
}

/** Línea comercial dependiente de su marca (RF-CAT-11-02). */
export interface LineaOpcion extends OpcionSelect {
  marcaId: string;
}

/** Catálogos que llenan los selectores del formulario. */
export interface OpcionesFormularioProducto {
  categorias: OpcionSelect[];
  subcategorias: SubcategoriaOpcion[];
  tiposProducto: OpcionSelect[];
  marcas: OpcionSelect[];
  lineas: LineaOpcion[];
  colores: ColorCatalogo[];
}

/**
 * Modelo editable del producto. Se envía tal cual (salvo `imagenes`, que suben
 * por su propio endpoint) al crear o actualizar.
 */
export interface FormularioProducto {
  // Información general
  nombre: string;
  descripcion: string;

  // Clasificación
  categoriaId: string | null;
  subcategoriaId: string | null;
  tipoProductoId: string | null;
  estado: EstadoPublicacion;

  // Marca y línea
  marcaId: string | null;
  /** Obligatoria en pinturas; opcional en productos sin color (RF-CAT-02-02). */
  lineaId: string | null;

  // Clase de color (RF-CAT-02-03 / HU-CAT-05)
  claseColor: ClaseColorProducto;
  colorPrincipalId: string | null;
  codigoColor: string;
  coloresDisponiblesIds: string[];

  // Imágenes (HU-CAT-07)
  imagenes: ImagenProducto[];

  // Información comercial
  precioVenta: number | null;
  precioReferencia: number | null;
  sku: string;
  stockInicial: number | null;
  destacado: boolean;
  mostrarEnOfertas: boolean;
  permitirOpiniones: boolean;
  requiereEnvioEspecial: boolean;

  // Descubrimiento
  etiquetas: string[];
}

/** Clave estable de cada bloque del checklist de publicación. */
export type ClaveSeccionChecklist =
  | 'informacion_general'
  | 'clasificacion'
  | 'marca_linea'
  | 'clase_color'
  | 'imagenes'
  | 'informacion_comercial'
  | 'etiquetas';

export interface SeccionChecklist {
  clave: ClaveSeccionChecklist;
  etiqueta: string;
  completa: boolean;
  /** Si es opcional no bloquea la publicación (RF-CAT-02-05). */
  opcional: boolean;
}

export interface ProgresoChecklist {
  completas: number;
  total: number;
}

/** Respuesta de crear / actualizar. */
export interface ResultadoGuardadoProducto {
  id: string;
  estado: EstadoPublicacion;
  mensaje: string;
}
