import { apiClient } from '@/core/api/axios';
import type { CategoriaFormDTO, SubcategoriaFormDTO } from '../dtos/categorias.dto';
import type {
  ApiResponse,
  CategoriaConHijos,
  DetalleCategoria,
  EstadoCategoria,
  NodoCategoria,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (CATEGORÍAS Y SUBCATEGORÍAS)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/categorias.service.ts
 *
 * Endpoints de la estructura del catálogo (HU-CAT-01). Permiso «Gestión del
 * catálogo» (M17). La baja lógica en cascada y la unicidad de nombre por nivel
 * se resuelven en el backend (RF-CAT-01-03 / RF-CAT-01-04).
 * ==============================================================================
 */

const BASE = '/catalogo/categorias';

export const CategoriasService = {
  /** GET /api/catalogo/categorias/arbol — categorías raíz con sus subcategorías. */
  async obtenerArbol(): Promise<ApiResponse<CategoriaConHijos[]>> {
    const { data } = await apiClient.get<ApiResponse<CategoriaConHijos[]>>(`${BASE}/arbol`);
    return data;
  },

  /** GET /api/catalogo/categorias/:id — detalle + elementos de una categoría. */
  async obtenerDetalle(id: string): Promise<ApiResponse<DetalleCategoria>> {
    const { data } = await apiClient.get<ApiResponse<DetalleCategoria>>(`${BASE}/${id}`);
    return data;
  },

  /** POST /api/catalogo/categorias — crea una categoría raíz. */
  async crearCategoria(payload: CategoriaFormDTO): Promise<ApiResponse<NodoCategoria>> {
    const { data } = await apiClient.post<ApiResponse<NodoCategoria>>(BASE, payload);
    return data;
  },

  /** POST /api/catalogo/categorias/subcategorias — crea una subcategoría. */
  async crearSubcategoria(payload: SubcategoriaFormDTO): Promise<ApiResponse<NodoCategoria>> {
    const { data } = await apiClient.post<ApiResponse<NodoCategoria>>(
      `${BASE}/subcategorias`,
      payload
    );
    return data;
  },

  /**
   * PATCH /api/catalogo/categorias/:id/estado — cambia el estado (baja lógica).
   * El backend devuelve además cuántos elementos quedan afectados en cascada.
   */
  async cambiarEstado(
    id: string,
    estado: EstadoCategoria
  ): Promise<ApiResponse<{ afectados: number }>> {
    const { data } = await apiClient.patch<ApiResponse<{ afectados: number }>>(
      `${BASE}/${id}/estado`,
      { estado }
    );
    return data;
  },
};
