import { apiClient } from '@/core/api/axios';
import { normalizarFiltrosColores } from '../dtos/colores.dto';
import type { FiltrosColoresDTO } from '../dtos/colores.dto';
import type {
  ApiResponse,
  PaginaColores,
  OpcionesFiltroColores,
  FamiliaCromatica,
  ResumenColores,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (GESTIÓN DE COLORES)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/colores.service.ts
 *
 * Endpoints de administración de colores (HU-CAT-05). Paginación del lado
 * servidor (RNF-CAT-06-01). Permiso «Gestión del catálogo» (M17).
 * ==============================================================================
 */

const BASE = '/catalogo/colores';

export const ColoresService = {
  /** GET /api/catalogo/colores — página del listado según filtros. */
  async listar(filtros?: Partial<FiltrosColoresDTO>): Promise<ApiResponse<PaginaColores>> {
    const params = normalizarFiltrosColores(filtros);
    const { data } = await apiClient.get<ApiResponse<PaginaColores>>(BASE, { params });
    return data;
  },

  /** GET /api/catalogo/colores/familias — familias cromáticas con su total. */
  async familias(): Promise<ApiResponse<FamiliaCromatica[]>> {
    const { data } = await apiClient.get<ApiResponse<FamiliaCromatica[]>>(`${BASE}/familias`);
    return data;
  },

  /** GET /api/catalogo/colores/opciones-filtro — catálogos de la barra de filtros. */
  async opcionesFiltro(): Promise<ApiResponse<OpcionesFiltroColores>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFiltroColores>>(
      `${BASE}/opciones-filtro`
    );
    return data;
  },

  /** GET /api/catalogo/colores/resumen — indicadores del panel lateral. */
  async resumen(): Promise<ApiResponse<ResumenColores>> {
    const { data } = await apiClient.get<ApiResponse<ResumenColores>>(`${BASE}/resumen`);
    return data;
  },
};
