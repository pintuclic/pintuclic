import { apiClient } from '@/core/api/axios';
import type {
  ApiResponse,
  DetalleEdicionProducto,
  FormularioProducto,
  OpcionesFormularioProducto,
  ResultadoGuardadoProducto,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (FORMULARIO DE PRODUCTO · CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/producto-formulario.service.ts
 *
 * Endpoints de alta y edición de productos (HU-CAT-02). Las imágenes se suben
 * por su propio endpoint (HU-CAT-07) y no viajan en este payload.
 *
 * Autorización: permiso «Gestión de productos» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/productos';

export const ProductoFormularioService = {
  /** GET /api/catalogo/productos/opciones-formulario — catálogos de los selectores. */
  async obtenerOpciones(): Promise<ApiResponse<OpcionesFormularioProducto>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFormularioProducto>>(
      `${BASE}/opciones-formulario`
    );
    return data;
  },

  /** GET /api/catalogo/productos/:id — carga un producto para editar. */
  async obtenerProducto(id: string): Promise<ApiResponse<FormularioProducto>> {
    const { data } = await apiClient.get<ApiResponse<FormularioProducto>>(`${BASE}/${id}`);
    return data;
  },

  /** GET /api/catalogo/productos/:id/detalle-edicion — auditoría y conteos (maqueta ADMIN 04). */
  async obtenerDetalleEdicion(id: string): Promise<ApiResponse<DetalleEdicionProducto>> {
    const { data } = await apiClient.get<ApiResponse<DetalleEdicionProducto>>(
      `${BASE}/${id}/detalle-edicion`
    );
    return data;
  },

  /** POST /api/catalogo/productos — crea el producto (borrador o publicado). */
  async crear(payload: FormularioProducto): Promise<ApiResponse<ResultadoGuardadoProducto>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoGuardadoProducto>>(BASE, payload);
    return data;
  },

  /** PUT /api/catalogo/productos/:id — actualiza el producto. */
  async actualizar(
    id: string,
    payload: FormularioProducto
  ): Promise<ApiResponse<ResultadoGuardadoProducto>> {
    const { data } = await apiClient.put<ApiResponse<ResultadoGuardadoProducto>>(
      `${BASE}/${id}`,
      payload
    );
    return data;
  },
};
