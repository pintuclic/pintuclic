import { apiClient } from '@/core/api/axios';
import type {
  ApiResponse,
  FormularioLinea,
  OpcionesFormularioLinea,
  ResultadoGuardadoLinea,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (FORMULARIO DE LÍNEA · CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/linea-formulario.service.ts
 *
 * Alta y edición de líneas comerciales (RF-CAT-11).
 * Autorización: permiso «Gestión del catálogo» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/lineas';

export const LineaFormularioService = {
  /** GET /api/catalogo/lineas/opciones-formulario — catálogos de los selectores. */
  async obtenerOpciones(): Promise<ApiResponse<OpcionesFormularioLinea>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFormularioLinea>>(
      `${BASE}/opciones-formulario`
    );
    return data;
  },

  /** GET /api/catalogo/lineas/:id — carga una línea para editar. */
  async obtenerLinea(id: string): Promise<ApiResponse<FormularioLinea>> {
    const { data } = await apiClient.get<ApiResponse<FormularioLinea>>(`${BASE}/${id}`);
    return data;
  },

  /** POST /api/catalogo/lineas — crea la línea. */
  async crear(payload: FormularioLinea): Promise<ApiResponse<ResultadoGuardadoLinea>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoGuardadoLinea>>(BASE, payload);
    return data;
  },

  /** PUT /api/catalogo/lineas/:id — actualiza la línea. */
  async actualizar(
    id: string,
    payload: FormularioLinea
  ): Promise<ApiResponse<ResultadoGuardadoLinea>> {
    const { data } = await apiClient.put<ApiResponse<ResultadoGuardadoLinea>>(
      `${BASE}/${id}`,
      payload
    );
    return data;
  },
};
