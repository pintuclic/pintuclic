/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DE LÍNEAS COMERCIALES
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/lineas.interface.ts
 *
 * Tipos de integración de las maquetas "ADMIN 15/16/17 - Líneas comerciales".
 * Una línea comercial (o gama) agrupa productos de una marca bajo una misma
 * clasificación de uso (Premium, Profesional, Estándar, Económica…). Vive dentro
 * de la sección Marcas del panel; desactivarla afecta en cascada a los productos
 * y a las reglas de precios/promoción asociadas (RF-CAT-11).
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * ==============================================================================
 */

export type EstadoLinea = 'activa' | 'inactiva' | 'pausada';

export type OrdenLineas = 'recientes' | 'nombre_asc' | 'nombre_desc' | 'productos_desc';

/** Fila del listado de líneas comerciales. */
export interface LineaListado {
  id: string;
  nombre: string;
  /** Subtítulo descriptivo de la gama (p. ej. "Línea premium interior"). */
  descripcionCorta: string;
  /** URL de la imagen representativa; `null` mientras no se ha cargado. */
  imagenUrl: string | null;
  marca: string;
  gamaComercial: string;
  productosAsociados: number;
  estado: EstadoLinea;
  actualizadoEn: string;
  actualizadoPor: string;
}

export interface FiltrosLineas {
  busqueda: string;
  marca: string | null;
  estado: EstadoLinea | null;
  segmento: string | null;
  orden: OrdenLineas;
  pagina: number;
  porPagina: number;
}

export interface PaginaLineas {
  items: LineaListado[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

/** Indicadores de la fila de KPIs del listado de líneas. */
export interface ResumenLineas {
  lineasActivas: { valor: number; total: number };
  marcasAsociadas: { valor: number };
  productosVinculados: { valor: number };
  reglasDependientes: { valor: number };
}

/** Opciones para poblar los selectores de filtro (marca y segmento/gama). */
export interface OpcionesFiltroLineas {
  marcas: { valor: string; etiqueta: string }[];
  segmentos: { valor: string; etiqueta: string }[];
}
