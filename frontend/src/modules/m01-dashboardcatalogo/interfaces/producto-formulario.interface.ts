/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE PRODUCTO (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/producto-formulario.interface.ts
 *
 * Tipos de integración de la vista "ADMIN 03 - Productos · Crear / editar".
 * Sincronizado 1:1 con `CrearProductoDto` / `ActualizarProductoDto` del backend
 * real (backend/src/modules/m01-catalogo/dtos/productos.dto.ts): nombre,
 * id_marca, clase_color, id_subcategorias, id_linea, id_tipo_resina,
 * descripcion, id_categoria_complementaria, patrocinado. `rendimiento` y
 * `bases` son sub-recursos que se crean DESPUÉS del producto (no viven en este
 * formulario). Cubre también HU-CAT-05 (clase de color) y HU-CAT-07 (imágenes).
 *
 * Permiso M17 requerido: «Gestión de productos», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { ClaseColorProducto, OpcionSelect } from './productos.interface';

/**
 * Estado del producto en el formulario.
 *
 * El backend real maneja DOS ejes separados: publicación (`/publicar`,
 * `/despublicar`) y activación (`/desactivar`, `/reactivar`). Este tipo los
 * aplana en el estado efectivo que la UI muestra —el mismo juego de valores que
 * `ProductoListado.estado`—: un producto desactivado queda `'inactivo'`, NO
 * `'borrador'` (un borrador es un producto sin publicar, no uno dado de baja).
 */
export type EstadoPublicacion = 'borrador' | 'publicado' | 'inactivo';

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

/**
 * Imagen del producto (HU-CAT-07), alineada con `CrearImagenDto` del backend
 * real: `{ imagen, id_variante?, id_color?, orden?, es_principal? }`.
 *
 * `url` transporta la imagen: una data URL base64 (jpeg/png/webp, ≤ 5MB — el
 * backend no acepta multipart) para las recién cargadas, o la URL ya almacenada
 * para las que vienen del servidor. La validación de formato y peso vive en
 * `dtos/producto-formulario.dto.ts` (`validarImagenProducto`).
 *
 * NOTA: en esta rama no hay endpoint de subida cableado; el modelo y la
 * validación se alinean, pero las imágenes no se envían todavía.
 */
export interface ImagenProducto {
  id: string;
  /** Data URL base64 (jpeg/png/webp, ≤ 5MB) o URL almacenada (`imagen`). */
  url: string;
  nombre: string;
  /** Posición en la galería (`orden`); 0 es la primera. */
  orden: number;
  /** `es_principal`. */
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
  /** Usada para etiquetar la categoría complementaria (id_categoria_complementaria). */
  categorias: OpcionSelect[];
  subcategorias: SubcategoriaOpcion[];
  /** Tipo de resina (id_tipo_resina). */
  tiposResina: OpcionSelect[];
  marcas: OpcionSelect[];
  lineas: LineaOpcion[];
  colores: ColorCatalogo[];
}

/**
 * Modelo editable del producto. Se envía tal cual (salvo `imagenes`, que suben
 * por su propio endpoint) al crear o actualizar. Campo a campo, corresponde a
 * `CrearProductoDto` del backend real.
 */
export interface FormularioProducto {
  // Información general (nombre, descripcion)
  nombre: string;
  descripcion: string;

  // Clasificación (id_subcategorias, id_categoria_complementaria)
  subcategoriasIds: string[];
  categoriaComplementariaId: string | null;
  estado: EstadoPublicacion;

  // Marca y línea (id_marca, id_linea)
  marcaId: string | null;
  /** Obligatoria en pinturas entonables (RF-CAT-02-02). */
  lineaId: string | null;
  /** Tipo de resina (id_tipo_resina), opcional. */
  tipoResinaId: string | null;

  // Clase de color (clase_color / RF-CAT-02-03 / HU-CAT-05)
  claseColor: ClaseColorProducto;
  colorPrincipalId: string | null;
  codigoColor: string;
  coloresDisponiblesIds: string[];

  // Imágenes (HU-CAT-07)
  imagenes: ImagenProducto[];

  /** Visibilidad destacada del producto (patrocinado). */
  patrocinado: boolean;
}

/** Clave estable de cada bloque del checklist de publicación. */
export type ClaveSeccionChecklist =
  | 'informacion_general'
  | 'clasificacion'
  | 'marca_linea'
  | 'clase_color'
  | 'imagenes';

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

/** Entrada del historial / auditoría del producto (maqueta "ADMIN 04"). */
export interface MovimientoAuditoriaProducto {
  id: string;
  fechaHora: string;
  descripcion: string;
  usuario: string;
}

/**
 * Datos que solo existen al editar un producto ya creado (maqueta "ADMIN 04"):
 * metadatos de auditoría, conteos relacionados e historial de cambios.
 */
export interface DetalleEdicionProducto {
  actualizadoEn: string;
  creadoPor: string;
  variantesActivas: number;
  productosRelacionados: number;
  historial: MovimientoAuditoriaProducto[];
}
