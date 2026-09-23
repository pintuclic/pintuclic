import { apiClient } from '@/core/api/axios';
import { normalizarFiltroDashboard } from '../dtos/dashboard.dto';
import type { FiltroDashboardDTO } from '../dtos/dashboard.dto';
import type {
  ApiResponse,
  ResumenDashboardCatalogo,
  RegistroActividad,
  EstadoCatalogo,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (PANEL DE CATÁLOGO)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/dashboard.service.ts
 *
 * Conexión tipada con los endpoints del tablero administrativo de M01.
 * Desempaqueta las respuestas mediante el envoltorio estándar ApiResponse<T>.
 *
 * Autorización: todos los endpoints exigen el permiso «Gestión del catálogo»
 * (M17), verificado siempre en el servidor. El token se adjunta en el
 * interceptor global de `@/core/api/axios`.
 * ==============================================================================
 */

const BASE = '/catalogo/dashboard';

export const DashboardCatalogoService = {
  /**
   * GET /api/catalogo/dashboard/resumen
   * Devuelve el tablero completo: métricas, accesos rápidos, actividad
   * reciente y distribución por estado.
   */
  async obtenerResumen(
    filtro?: Partial<FiltroDashboardDTO>
  ): Promise<ApiResponse<ResumenDashboardCatalogo>> {
    const params = normalizarFiltroDashboard(filtro);
    const { data } = await apiClient.get<ApiResponse<ResumenDashboardCatalogo>>(
      `${BASE}/resumen`,
      { params }
    );
    return data;
  },

  /**
   * GET /api/catalogo/dashboard/actividad
   * Últimas acciones registradas sobre el catálogo (HU-CAT-09 / auditoría M20).
   */
  async obtenerActividadReciente(limite = 8): Promise<ApiResponse<RegistroActividad[]>> {
    const { data } = await apiClient.get<ApiResponse<RegistroActividad[]>>(
      `${BASE}/actividad`,
      { params: { limite } }
    );
    return data;
  },

  /**
   * GET /api/catalogo/dashboard/estado
   * Distribución de productos por estado del ciclo de vida (HU-CAT-09).
   */
  async obtenerEstadoCatalogo(): Promise<ApiResponse<EstadoCatalogo>> {
    const { data } = await apiClient.get<ApiResponse<EstadoCatalogo>>(`${BASE}/estado`);
    return data;
  },
};
