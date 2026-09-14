import { apiClient } from '@/core/api/axios';
import type { ApiResponse, DetalleAdministrativoMarca } from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (DETALLE ADMINISTRATIVO DE MARCA)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/marca-detalle.service.ts
 *
 * Ficha de solo lectura de la maqueta "ADMIN 14". El store cae a la semilla
 * `marca-detalle.mock.ts` mientras el endpoint no exista.
 *
 * Autorización: permiso «Gestión del catálogo» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/marcas';

export const MarcaDetalleService = {
  /** GET /api/catalogo/marcas/:id/detalle — ficha administrativa completa. */
  async obtener(id: string): Promise<ApiResponse<DetalleAdministrativoMarca>> {
    const { data } = await apiClient.get<ApiResponse<DetalleAdministrativoMarca>>(
      `${BASE}/${id}/detalle`
    );
    return data;
  },

  /** PATCH /api/catalogo/marcas/:id/estado — cambia el estado (p. ej. desactivar). */
  async cambiarEstado(
    id: string,
    estado: 'activa' | 'inactiva'
  ): Promise<ApiResponse<{ id: string; estado: string }>> {
    const { data } = await apiClient.patch<ApiResponse<{ id: string; estado: string }>>(
      `${BASE}/${id}/estado`,
      { estado }
    );
    return data;
  },
};
