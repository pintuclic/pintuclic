import { apiClient } from '@/core/api/axios';
import { normalizarFiltrosBusquedas } from '../dtos/busquedas.dto';
import type { FiltrosBusquedasDTO } from '../dtos/busquedas.dto';
import type {
  ApiResponse,
  PaginaBusquedas,
  OpcionesFiltroBusquedas,
  ResumenBusquedas,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (BÚSQUEDAS SIN RESULTADO)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/busquedas.service.ts
 *
 * Reporte alimentado por M02. Permiso «Gestión del catálogo» (M17).
 * ==============================================================================
 */

const BASE = '/catalogo/busquedas-sin-resultado';

export const BusquedasService = {
  /** GET /api/catalogo/busquedas-sin-resultado — página del reporte. */
  async listar(filtros?: Partial<FiltrosBusquedasDTO>): Promise<ApiResponse<PaginaBusquedas>> {
    const params = normalizarFiltrosBusquedas(filtros);
    const { data } = await apiClient.get<ApiResponse<PaginaBusquedas>>(BASE, { params });
    return data;
  },

  /** GET .../opciones-filtro — catálogos de la barra de filtros. */
  async opcionesFiltro(): Promise<ApiResponse<OpcionesFiltroBusquedas>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFiltroBusquedas>>(
      `${BASE}/opciones-filtro`
    );
    return data;
  },

  /** GET .../resumen — indicadores de la fila de KPIs. */
  async resumen(): Promise<ApiResponse<ResumenBusquedas>> {
    const { data } = await apiClient.get<ApiResponse<ResumenBusquedas>>(`${BASE}/resumen`);
    return data;
  },
};
