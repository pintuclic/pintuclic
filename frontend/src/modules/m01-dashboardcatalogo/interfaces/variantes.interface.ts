/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DE GESTIÓN DE VARIANTES (LISTADO)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/variantes.interface.ts
 *
 * Tipos de integración de la vista "ADMIN 04 - Variantes · Listado".
 * Cubren HU-CAT-03 (gestión de variantes) y HU-CAT-09 (ciclo de vida).
 *
 * Modelo de variante (RF-CAT-03-02):
 *   - entonable  → producto + base + presentación
 *   - fijo       → producto + color + presentación
 *   - sin color  → producto + presentación
 * El precio y la existencia referencial viven SIEMPRE en la variante física
 * (RF-CAT-03-04), nunca en el color aislado.
 *
 * Permiso M17 requerido: «Gestión de productos», revalidado en el servidor.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';

/** Estado del ciclo de vida de la variante (HU-CAT-09). "Sin stock" se deriva. */
export type EstadoVariante = 'activo' | 'borrador' | 'inactivo';

export type CampoOrdenVariantes =
  | 'producto'
  | 'presentacion'
  | 'base'
  | 'codigo'
  | 'precio'
  | 'existencia'
  | 'estado';

export interface OrdenVariantes {
  campo: CampoOrdenVariantes;
  direccion: 'asc' | 'desc';
}

/** Fila del listado de variantes. */
export interface VarianteListado {
  id: string;
  productoId: string;
  productoNombre: string;
  marca: string;
  /** Nombre de la presentación (RF-CAT-03-05), ej. "1 galón". */
  presentacion: string;
  /** Volumen numérico de la presentación, para comparar precios (RF-CAT-03-05). */
  presentacionVolumen: number;
  /** Base sobre la que se prepara (solo entonables). `null` = N/A. */
  base: string | null;
  /** Color que identifica la variante (solo colores fijos). `null` = N/A. */
  color: string | null;
  /** Código de proveedor (SAMIT), único entre variantes (RF-CAT-03-06). */
  codigoProveedor: string;
  precio: number;
  /** Existencia referencial; no puede ser negativa (RF-CAT-03-03). */
  existenciaReferencial: number;
  estado: EstadoVariante;
}

/** Estado de los filtros del listado (se envía al backend). */
export interface FiltrosVariantes {
  busqueda: string;
  productoId: string | null;
  presentacion: string | null;
  estado: EstadoVariante | null;
  marcaId: string | null;
  orden: OrdenVariantes;
  pagina: number;
  porPagina: number;
}

export interface OpcionesFiltroVariantes {
  productos: OpcionSelect[];
  presentaciones: OpcionSelect[];
  marcas: OpcionSelect[];
}

export interface PaginaVariantes {
  items: VarianteListado[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

/** Indicador del panel lateral "Resumen de variantes". */
export interface IndicadorResumen {
  valor: number;
  /** Variación en puntos porcentuales frente al periodo anterior. */
  variacionPorcentaje: number;
}

export interface ResumenVariantes {
  activas: IndicadorResumen;
  sinStock: IndicadorResumen;
  borradores: IndicadorResumen;
}
