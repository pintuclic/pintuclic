import { apiClient } from '@/core/api/axios';
import type {
  ApiResponse,
  FormularioColor,
  OpcionesFormularioColor,
  PayloadColor,
  ResultadoGuardadoColor,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (FORMULARIO DE COLOR · CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/color-formulario.service.ts
 *
 * Alta y edición de colores (HU-CAT-05).
 * Autorización: permiso «Gestión del catálogo» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/colores';

export const ColorFormularioService = {
  async obtenerOpciones(): Promise<ApiResponse<OpcionesFormularioColor>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFormularioColor>>(
      `${BASE}/opciones-formulario`
    );
    return data;
  },

  async obtenerColor(id: string): Promise<ApiResponse<FormularioColor>> {
    const { data } = await apiClient.get<ApiResponse<FormularioColor>>(`${BASE}/${id}`);
    return data;
  },

  /** El payload viaja con `cielab` (RF-CAT-05-02), no con el HEX de captura. */
  async crear(payload: PayloadColor): Promise<ApiResponse<ResultadoGuardadoColor>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoGuardadoColor>>(BASE, payload);
    return data;
  },

  async actualizar(
    id: string,
    payload: PayloadColor
  ): Promise<ApiResponse<ResultadoGuardadoColor>> {
    const { data } = await apiClient.put<ApiResponse<ResultadoGuardadoColor>>(
      `${BASE}/${id}`,
      payload
    );
    return data;
  },
};
