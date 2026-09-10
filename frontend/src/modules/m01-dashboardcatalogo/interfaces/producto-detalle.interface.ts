/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL DETALLE ADMINISTRATIVO DEL PRODUCTO
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/producto-detalle.interface.ts
 *
 * Tipos de la vista "ADMIN 05 - Detalle administrativo del producto": ficha de
 * solo lectura con encabezado, tarjetas de indicadores y pestañas (información
 * general, galería, variantes, bases y entonado, etiquetas, actividad).
 *
 * Permiso M17 requerido: «Gestión de productos», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { ClaseColorProducto, EstadoProducto } from './productos.interface';
import type { MovimientoAuditoriaProducto } from './producto-formulario.interface';

/** Imagen de la galería del detalle. */
export interface ImagenDetalleProducto {
  id: string;
  url: string;
  nombre: string;
  esPrincipal: boolean;
}

/** Fila de la tabla "Variantes del producto" del detalle. */
export interface VarianteResumenDetalle {
  id: string;
  presentacion: string;
  color: string;
  /** Hex derivado del valor CIELAB (dato de catálogo, no token de UI). */
  colorHex: string | null;
  base: string;
  stock: number;
  estado: 'activo' | 'inactivo' | 'sin_stock';
  precio: number;
}

/** Par etiqueta/valor de la tarjeta "Atributos técnicos". */
export interface AtributoTecnicoDetalle {
  etiqueta: string;
  valor: string;
}

/** Color asociado mostrado como muestra en la pestaña "Bases y entonado". */
export interface ColorAsociadoDetalle {
  nombre: string;
  hex: string;
}

/** Indicador numérico con variación mensual (tarjetas de estadística). */
export interface IndicadorDetalle {
  valor: number;
  variacionPorcentaje: number;
}

/** Ficha administrativa completa del producto (maqueta ADMIN 05). */
export interface DetalleAdministrativoProducto {
  // Identidad
  id: string;
  nombre: string;
  sku: string;
  descripcion: string;
  estado: EstadoProducto;
  destacado: boolean;
  permitirOpiniones: boolean;

  // Clasificación
  marca: string;
  linea: string | null;
  categoria: string;
  subcategoria: string | null;
  tipoProducto: string;
  claseColor: ClaseColorProducto;

  // Galería
  imagenes: ImagenDetalleProducto[];

  // Encabezado: disponibilidad
  disponibleEnCatalogo: boolean;
  stockTotal: number;
  variantesActivas: number;
  variantesTotales: number;

  // Tarjetas de indicadores
  precioBase: number;
  precioReferencia: number;
  variacionPrecio: number;
  variantes: IndicadorDetalle;
  coloresAsociados: IndicadorDetalle;
  combosRelacionados: number;
  actualizadoEn: string;
  actualizadoPor: string;

  // Pestañas
  atributos: AtributoTecnicoDetalle[];
  listaVariantes: VarianteResumenDetalle[];
  basesDisponibles: string[];
  sistemaEntonado: string;
  coloresDisponibles: ColorAsociadoDetalle[];
  etiquetas: string[];
  actividad: MovimientoAuditoriaProducto[];
}

/** Pestañas de la ficha de detalle. */
export type PestanaDetalleProducto =
  | 'general'
  | 'galeria'
  | 'variantes'
  | 'bases'
  | 'etiquetas';
