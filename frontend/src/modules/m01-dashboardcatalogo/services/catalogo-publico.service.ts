import { apiClient } from '@/core/api/axios';
import type { ApiResponse } from '../interfaces/api.interface';
import type {
  CategoriaPublica,
  FichaProductoPublico,
  PaginaProductosPublicos,
} from '../interfaces/catalogo-publico.interface';

const BASE = '/catalogo/publico';

export const CatalogoPublicoService = {
  async listarCategorias(): Promise<CategoriaPublica[]> {
    const { data } = await apiClient.get<ApiResponse<CategoriaPublica[]>>(`${BASE}/categorias`);
    return data.data;
  },

  async listarProductos(params: {
    q?: string;
    subcategoria?: number;
    pagina?: number;
    limite?: number;
  }): Promise<PaginaProductosPublicos> {
    const { data } = await apiClient.get<ApiResponse<PaginaProductosPublicos>>(
      `${BASE}/productos`,
      { params }
    );
    return data.data;
  },

  async obtenerFicha(idProducto: number): Promise<FichaProductoPublico> {
    const { data } = await apiClient.get<ApiResponse<FichaProductoPublico>>(
      `${BASE}/productos/${idProducto}`
    );
    return data.data;
  },
};
