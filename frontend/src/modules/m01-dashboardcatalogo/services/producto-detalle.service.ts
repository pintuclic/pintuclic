import { apiClient } from '@/core/api/axios';
import type { ApiResponse, DetalleAdministrativoProducto } from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (DETALLE ADMINISTRATIVO DEL PRODUCTO)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/producto-detalle.service.ts
 *
 * Ficha de solo lectura de la maqueta "ADMIN 05". El store cae a la semilla
 * `producto-detalle.mock.ts` mientras el endpoint no exista.
 *
 * Autorización: permiso «Gestión de productos» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/productos';

export const ProductoDetalleService = {
  /** GET /api/catalogo/productos/:id/detalle — ficha administrativa completa. */
  async obtener(id: string): Promise<ApiResponse<DetalleAdministrativoProducto>> {
    const { data } = await apiClient.get<ApiResponse<DetalleAdministrativoProducto>>(
      `${BASE}/${id}/detalle`
    );
    return data;
  },

  /** PATCH /api/catalogo/productos/:id/estado — cambia el estado (p. ej. desactivar). */
  async cambiarEstado(
    id: string,
    estado: 'publicado' | 'borrador' | 'inactivo'
  ): Promise<ApiResponse<{ id: string; estado: string }>> {
    const { data } = await apiClient.patch<ApiResponse<{ id: string; estado: string }>>(
      `${BASE}/${id}/estado`,
      { estado }
    );
    return data;
  },
};
