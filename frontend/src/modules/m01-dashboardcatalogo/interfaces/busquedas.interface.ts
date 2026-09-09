/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DE BÚSQUEDAS SIN RESULTADO
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/busquedas.interface.ts
 *
 * Tipos de integración de la vista "ADMIN 08 - Búsquedas sin resultado".
 * Es un reporte del catálogo alimentado por M02 (Búsqueda y navegación): los
 * términos que los clientes buscaron y no encontraron, para detectar
 * oportunidades de alta de producto o de sinónimos.
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';

export type PeriodoBusqueda = '7d' | '30d' | '90d' | 'todo';
export type FrecuenciaBusqueda = 'todas' | 'alta' | 'media' | 'baja';
export type EstadoTerminoBusqueda = 'pendiente' | 'revisado' | 'atendido';
export type AccionSugerida = 'crear_producto' | 'agregar_sinonimo';

/** Fila del listado de términos buscados sin resultado. */
export interface TerminoBusqueda {
  id: string;
  termino: string;
  /** Nº de veces que se buscó en el periodo. */
  frecuencia: number;
  ultimaBusqueda: string;
  /** Categoría del catálogo a la que probablemente pertenece el término. */
  posibleCategoria: string;
  accionSugerida: AccionSugerida;
  estado: EstadoTerminoBusqueda;
}

export interface FiltrosBusquedas {
  busqueda: string;
  periodo: PeriodoBusqueda;
  categoriaId: string | null;
  frecuencia: FrecuenciaBusqueda;
  pagina: number;
  porPagina: number;
}

export interface OpcionesFiltroBusquedas {
  categorias: OpcionSelect[];
}

export interface PaginaBusquedas {
  items: TerminoBusqueda[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

/** Indicadores de la fila de KPIs (mezcla valores numéricos y de texto). */
export interface ResumenBusquedas {
  totalTerminos: { valor: number; variacionPorcentaje: number };
  masRepetido: { termino: string; frecuencia: number };
  ultimaBusqueda: { termino: string; fechaHora: string };
  oportunidadesDetectadas: { valor: number; variacionPorcentaje: number };
}
