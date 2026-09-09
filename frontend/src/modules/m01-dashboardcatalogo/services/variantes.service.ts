import { apiClient } from '@/core/api/axios';
import { normalizarFiltrosVariantes } from '../dtos/variantes.dto';
import type { FiltrosVariantesDTO } from '../dtos/variantes.dto';
import type {
  ApiResponse,
  PaginaVariantes,
  OpcionesFiltroVariantes,
  ResumenVariantes,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (GESTIÓN DE VARIANTES · LISTADO)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/variantes.service.ts
 *
 * Endpoints del listado administrativo de variantes (HU-CAT-03). Paginación y
 * filtrado del lado servidor. Permiso «Gestión de productos» (M17).
 * ==============================================================================
 */

const BASE = '/catalogo/variantes';

export const VariantesService = {
  /** GET /api/catalogo/variantes — página del listado según filtros. */
  async listar(filtros?: Partial<FiltrosVariantesDTO>): Promise<ApiResponse<PaginaVariantes>> {
    const params = normalizarFiltrosVariantes(filtros);
    const { data } = await apiClient.get<ApiResponse<PaginaVariantes>>(BASE, { params });
    return data;
  },

  /** GET /api/catalogo/variantes/opciones-filtro — catálogos de la barra de filtros. */
  async opcionesFiltro(): Promise<ApiResponse<OpcionesFiltroVariantes>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFiltroVariantes>>(
      `${BASE}/opciones-filtro`
    );
    return data;
  },

  /** GET /api/catalogo/variantes/resumen — indicadores del panel lateral. */
  async resumen(): Promise<ApiResponse<ResumenVariantes>> {
    const { data } = await apiClient.get<ApiResponse<ResumenVariantes>>(`${BASE}/resumen`);
    return data;
  },
};
