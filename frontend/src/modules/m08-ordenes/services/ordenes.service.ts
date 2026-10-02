import { apiClient } from '@/core/api/axios';
import type {
  ApiResponse,
  DetalleOrdenGestion,
  DetallePedido,
  EstadoOrden,
  FiltrosGestion,
  PaginaOrdenesGestion,
  PedidosCliente,
  ResultadoCambioEstado,
  ResumenEstadosOrdenes,
} from '../interfaces/ordenes.interface';

/**
 * ==============================================================================
 * M08 - SERVICIO HTTP DE ÓRDENES
 * Ubicación: src/modules/m08-ordenes/services/ordenes.service.ts
 *
 * Todos los endpoints exigen sesión activa: el token se adjunta solo si está
 * guardado en localStorage bajo la clave `access_token`, que es la que lee el
 * interceptor de `core/api/axios.ts`.
 *
 * Los de `/gestion` exigen además permiso del servidor: `ventas.ver` para
 * consultar y `ventas.gestionar` para cambiar estados. Esa comprobación NO se
 * replica aquí a propósito; el navegador no decide sobre permisos.
 * ==============================================================================
 */

const BASE = '/ordenes';

export const OrdenesService = {
  // ---------------------------------------------------------------- cliente

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
   * El parámetro es el código visible (PC-2026-00101), nunca el id interno.
   * Un pedido ajeno responde 404 igual que uno inexistente (CA-SEG-03-06).
   */
  async detalle(codigo: string): Promise<DetallePedido> {
    const { data } = await apiClient.get<ApiResponse<DetallePedido>>(
      `${BASE}/mis-pedidos/${encodeURIComponent(codigo)}`
    );
    return data.data;
  },

  // --------------------------------------------------------------- personal

  /**
   * GET /api/ordenes/gestion
   * Bandeja del personal. El backend filtra, ordena y pagina; aquí no se recorta
   * nada. Los campos vacíos se omiten para no enviar parámetros en blanco, que el
   * validador rechazaría.
   */
  async listarGestion(filtros: FiltrosGestion = {}): Promise<PaginaOrdenesGestion> {
    const params: Record<string, string | number> = {};
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params[clave] = valor as string | number;
      }
    }
    const { data } = await apiClient.get<ApiResponse<PaginaOrdenesGestion>>(
      `${BASE}/gestion`,
      { params }
    );
    return data.data;
  },

  /**
   * GET /api/ordenes/gestion/resumen
   * Contadores por estado para las tarjetas de la bandeja. Incluye los estados en
   * cero, así que la vista puede recorrerlos sin comprobar existencia.
   */
  async resumenEstados(): Promise<ResumenEstadosOrdenes> {
    const { data } = await apiClient.get<ApiResponse<ResumenEstadosOrdenes>>(
      `${BASE}/gestion/resumen`
    );
    return data.data;
  },

  /**
   * GET /api/ordenes/gestion/:codigo
   * Consulta administrativa. Busca por código EXACTO: un fragmento no encuentra
   * nada. Añade contacto del cliente, historial con autor, notas y contactos.
   */
  async detalleGestion(codigo: string): Promise<DetalleOrdenGestion> {
    const { data } = await apiClient.get<ApiResponse<DetalleOrdenGestion>>(
      `${BASE}/gestion/${encodeURIComponent(codigo)}`
    );
    return data.data;
  },

  /**
   * PATCH /api/ordenes/gestion/:codigo/estado
   * Si la transición no es válida, responde con error: la vista nunca decide qué
   * transiciones existen, solo ofrece las de `transiciones_permitidas`.
   */
  async cambiarEstado(
    codigo: string,
    estado: EstadoOrden,
    motivo?: string
  ): Promise<ResultadoCambioEstado> {
    const cuerpo: { estado: EstadoOrden; motivo?: string } = { estado };
    if (motivo && motivo.trim() !== '') cuerpo.motivo = motivo.trim();
    const { data } = await apiClient.patch<ApiResponse<ResultadoCambioEstado>>(
      `${BASE}/gestion/${encodeURIComponent(codigo)}/estado`,
      cuerpo
    );
    return data.data;
  },
};
