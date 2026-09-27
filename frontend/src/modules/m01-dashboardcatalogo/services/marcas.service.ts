import { apiClient } from '@/core/api/axios';
import { normalizarFiltrosMarcas } from '../dtos/marcas.dto';
import type { FiltrosMarcasDTO, MarcaFormDTO } from '../dtos/marcas.dto';
import type { ApiResponse, MarcaListado, PaginaMarcas, ResumenMarcas } from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (GESTIÓN DE MARCAS)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/marcas.service.ts
 *
 * Endpoints de administración de marcas (HU-CAT-04). Permiso «Gestión del
 * catálogo» (M17). La cascada de desactivación se resuelve en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/marcas';

export const MarcasService = {
  /** GET /api/catalogo/marcas — página del listado según filtros. */
  async listar(filtros?: Partial<FiltrosMarcasDTO>): Promise<ApiResponse<PaginaMarcas>> {
    const params = normalizarFiltrosMarcas(filtros);
    const { data } = await apiClient.get<ApiResponse<PaginaMarcas>>(BASE, { params });
    return data;
  },

  /** GET /api/catalogo/marcas/resumen — indicadores de la fila de KPIs. */
  async resumen(): Promise<ApiResponse<ResumenMarcas>> {
    const { data } = await apiClient.get<ApiResponse<ResumenMarcas>>(`${BASE}/resumen`);
    return data;
  },

  /** POST /api/catalogo/marcas — crea una marca. */
  async crear(payload: MarcaFormDTO): Promise<ApiResponse<MarcaListado>> {
    const { data } = await apiClient.post<ApiResponse<MarcaListado>>(BASE, payload);
    return data;
  },

  /** PUT /api/catalogo/marcas/:id — actualiza una marca. */
  async actualizar(id: string, payload: MarcaFormDTO): Promise<ApiResponse<MarcaListado>> {
    const { data } = await apiClient.put<ApiResponse<MarcaListado>>(`${BASE}/${id}`, payload);
    return data;
  },
};
