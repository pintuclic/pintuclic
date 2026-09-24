import { apiClient } from '@/core/api/axios';
import type {
  ApiResponse,
  DetallePedido,
  DetallePedidoPersonal,
  PedidosCliente,
} from '../interfaces/ordenes.interface';

/**
 * ==============================================================================
 * M08 - SERVICIO HTTP DE ÓRDENES
 * Ubicación: src/modules/m08-ordenes/services/ordenes.service.ts
 *
 * Los tres endpoints que el backend expone hoy. Todos exigen sesión activa: el
 * token se adjunta solo si está guardado en localStorage bajo la clave
 * `access_token`, que es la que lee el interceptor de `core/api/axios.ts`.
 * ==============================================================================
 */

const BASE = '/ordenes';

export const OrdenesService = {
  /**
   * GET /api/ordenes/mis-pedidos
   * Devuelve los pedidos del cliente autenticado YA separados en dos grupos.
   * El término de búsqueda es opcional: vacío lista todos (CA-ORD-07-03).
   */
  async misPedidos(q?: string): Promise<PedidosCliente> {
    const params = q && q.trim() !== '' ? { q: q.trim() } : undefined;
    const { data } = await apiClient.get<ApiResponse<PedidosCliente>>(
      `${BASE}/mis-pedidos`,
      { params }
    );
    return data.data;
  },

  /**
   * GET /api/ordenes/mis-pedidos/:codigo
   * El parámetro es el código visible (ORD-2026-0001), nunca el id interno.
   * Un pedido ajeno responde 404 igual que uno inexistente (CA-SEG-03-06).
   */
  async detalle(codigo: string): Promise<DetallePedido> {
    const { data } = await apiClient.get<ApiResponse<DetallePedido>>(
      `${BASE}/mis-pedidos/${encodeURIComponent(codigo)}`
    );
    return data.data;
  },

  /**
   * GET /api/ordenes/gestion/:codigo
   * Consulta administrativa. Exige el permiso `ventas.ver` y busca por código
   * EXACTO: un fragmento no encuentra nada.
   */
  async detalleGestion(codigo: string): Promise<DetallePedidoPersonal> {
    const { data } = await apiClient.get<ApiResponse<DetallePedidoPersonal>>(
      `${BASE}/gestion/${encodeURIComponent(codigo)}`
    );
    return data.data;
  },
};
