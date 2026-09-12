import { apiClient } from '@/core/api/axios';
import type {
  ApiResponse,
  FormularioMarca,
  OpcionesFormularioMarca,
  ResultadoGuardadoMarca,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (FORMULARIO DE MARCA · CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/marca-formulario.service.ts
 *
 * Alta y edición de marcas (HU-CAT-04). El logo se sube por su propio endpoint.
 * Autorización: permiso «Gestión del catálogo» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/marcas';

export const MarcaFormularioService = {
  /** GET /api/catalogo/marcas/opciones-formulario — catálogos de los selectores. */
  async obtenerOpciones(): Promise<ApiResponse<OpcionesFormularioMarca>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFormularioMarca>>(
      `${BASE}/opciones-formulario`
    );
    return data;
  },

  /** GET /api/catalogo/marcas/:id — carga una marca para editar. */
  async obtenerMarca(id: string): Promise<ApiResponse<FormularioMarca>> {
    const { data } = await apiClient.get<ApiResponse<FormularioMarca>>(`${BASE}/${id}`);
    return data;
  },

  /** POST /api/catalogo/marcas — crea la marca. */
  async crear(payload: FormularioMarca): Promise<ApiResponse<ResultadoGuardadoMarca>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoGuardadoMarca>>(BASE, payload);
    return data;
  },

  /** PUT /api/catalogo/marcas/:id — actualiza la marca. */
  async actualizar(
    id: string,
    payload: FormularioMarca
  ): Promise<ApiResponse<ResultadoGuardadoMarca>> {
    const { data } = await apiClient.put<ApiResponse<ResultadoGuardadoMarca>>(
      `${BASE}/${id}`,
      payload
    );
    return data;
  },
};
