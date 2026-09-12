import { apiClient } from '@/core/api/axios';
import type {
  ApiResponse,
  DetalleEdicionVariante,
  FormularioVariante,
  OpcionesFormularioVariante,
  ResultadoGuardadoVariante,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (FORMULARIO DE VARIANTE · CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/variante-formulario.service.ts
 *
 * Endpoints de alta y edición de variantes (HU-CAT-03). Las imágenes se suben
 * por su propio endpoint (HU-CAT-07) y no viajan en este payload.
 *
 * Autorización: permiso «Gestión de productos» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/variantes';

export const VarianteFormularioService = {
  /** GET /api/catalogo/variantes/opciones-formulario — catálogos de los selectores. */
  async obtenerOpciones(): Promise<ApiResponse<OpcionesFormularioVariante>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFormularioVariante>>(
      `${BASE}/opciones-formulario`
    );
    return data;
  },

  /** GET /api/catalogo/variantes/:id — carga una variante para editar. */
  async obtenerVariante(id: string): Promise<ApiResponse<FormularioVariante>> {
    const { data } = await apiClient.get<ApiResponse<FormularioVariante>>(`${BASE}/${id}`);
    return data;
  },

  /** GET /api/catalogo/variantes/:id/detalle-edicion — movimientos y rotación (ADMIN 08). */
  async obtenerDetalleEdicion(id: string): Promise<ApiResponse<DetalleEdicionVariante>> {
    const { data } = await apiClient.get<ApiResponse<DetalleEdicionVariante>>(
      `${BASE}/${id}/detalle-edicion`
    );
    return data;
  },

  /** POST /api/catalogo/variantes — crea la variante (borrador o activa). */
  async crear(payload: FormularioVariante): Promise<ApiResponse<ResultadoGuardadoVariante>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoGuardadoVariante>>(BASE, payload);
    return data;
  },

  /** PUT /api/catalogo/variantes/:id — actualiza la variante. */
  async actualizar(
    id: string,
    payload: FormularioVariante
  ): Promise<ApiResponse<ResultadoGuardadoVariante>> {
    const { data } = await apiClient.put<ApiResponse<ResultadoGuardadoVariante>>(
      `${BASE}/${id}`,
      payload
    );
    return data;
  },
};
