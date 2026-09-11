import { apiClient } from '@/core/api/axios';
import { normalizarFiltrosLineas } from '../dtos/lineas.dto';
import type { FiltrosLineasDTO } from '../dtos/lineas.dto';
import type {
  ApiResponse,
  PaginaLineas,
  ResumenLineas,
  OpcionesFiltroLineas,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (LÍNEAS COMERCIALES · LISTADO)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/lineas.service.ts
 *
 * Endpoints del listado administrativo de líneas comerciales (RF-CAT-11). La
 * paginación y el filtrado se resuelven en el servidor; el frontend nunca
 * descarga el catálogo completo.
 *
 * Autorización: permiso «Gestión del catálogo» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/lineas';

export const LineasService = {
  /** GET /api/catalogo/lineas — página del listado según filtros. */
  async listar(filtros?: Partial<FiltrosLineasDTO>): Promise<ApiResponse<PaginaLineas>> {
    const params = normalizarFiltrosLineas(filtros);
    const { data } = await apiClient.get<ApiResponse<PaginaLineas>>(BASE, { params });
    return data;
  },

  /** GET /api/catalogo/lineas/resumen — indicadores de la fila de KPIs. */
  async resumen(): Promise<ApiResponse<ResumenLineas>> {
    const { data } = await apiClient.get<ApiResponse<ResumenLineas>>(`${BASE}/resumen`);
    return data;
  },

  /** GET /api/catalogo/lineas/opciones-filtro — catálogos de marca y segmento. */
  async opcionesFiltro(): Promise<ApiResponse<OpcionesFiltroLineas>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFiltroLineas>>(
      `${BASE}/opciones-filtro`
    );
    return data;
  },
};
