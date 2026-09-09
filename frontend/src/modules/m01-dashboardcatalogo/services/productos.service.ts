import { apiClient } from '@/core/api/axios';
import { normalizarFiltrosProductos } from '../dtos/productos.dto';
import type { FiltrosProductosDTO } from '../dtos/productos.dto';
import type {
  ApiResponse,
  PaginaProductos,
  OpcionesFiltroProductos,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (GESTIÓN DE PRODUCTOS · LISTADO)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/productos.service.ts
 *
 * Endpoints del listado administrativo de productos (HU-CAT-02). La paginación
 * y el filtrado se resuelven SIEMPRE en el servidor (RNF-CAT-06-01): el
 * frontend nunca descarga el catálogo completo.
 *
 * Autorización: permiso «Gestión de productos» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/productos';

export const ProductosService = {
  /**
   * GET /api/catalogo/productos
   * Devuelve una página del listado según los filtros indicados.
   */
  async listar(filtros?: Partial<FiltrosProductosDTO>): Promise<ApiResponse<PaginaProductos>> {
    const params = normalizarFiltrosProductos(filtros);
    const { data } = await apiClient.get<ApiResponse<PaginaProductos>>(BASE, { params });
    return data;
  },

  /**
   * GET /api/catalogo/productos/opciones-filtro
   * Catálogos (categorías, marcas, líneas) para poblar la barra de filtros.
   */
  async opcionesFiltro(): Promise<ApiResponse<OpcionesFiltroProductos>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFiltroProductos>>(
      `${BASE}/opciones-filtro`
    );
    return data;
  },
};
