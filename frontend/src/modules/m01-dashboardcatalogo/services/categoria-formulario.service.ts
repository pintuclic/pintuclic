import { apiClient } from '@/core/api/axios';
import type {
  ApiResponse,
  FormularioCategoria,
  OpcionesFormularioCategoria,
  ResumenImpactoCategoria,
  ResultadoGuardadoCategoria,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - SERVICIO HTTP CLIENTE (FORMULARIO DE CATEGORÍA / SUBCATEGORÍA)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/categoria-formulario.service.ts
 *
 * Alta y edición de categorías y subcategorías (HU-CAT-01). El store cae a la
 * semilla `categoria-formulario.mock.ts` mientras el endpoint no exista.
 *
 * Autorización: permiso «Gestión del catálogo» (M17), verificado en el backend.
 * ==============================================================================
 */

const BASE = '/catalogo/categorias';

export const CategoriaFormularioService = {
  /** GET /api/catalogo/categorias/opciones-formulario — catálogos de los selectores. */
  async obtenerOpciones(): Promise<ApiResponse<OpcionesFormularioCategoria>> {
    const { data } = await apiClient.get<ApiResponse<OpcionesFormularioCategoria>>(
      `${BASE}/opciones-formulario`
    );
    return data;
  },

  /** GET /api/catalogo/categorias/:id — carga una categoría para editar. */
  async obtenerCategoria(id: string): Promise<ApiResponse<FormularioCategoria>> {
    const { data } = await apiClient.get<ApiResponse<FormularioCategoria>>(`${BASE}/${id}`);
    return data;
  },

  /** GET /api/catalogo/categorias/:id/impacto — panel "Resumen e impacto". */
  async obtenerResumenImpacto(id: string): Promise<ApiResponse<ResumenImpactoCategoria>> {
    const { data } = await apiClient.get<ApiResponse<ResumenImpactoCategoria>>(
      `${BASE}/${id}/impacto`
    );
    return data;
  },

  /** POST /api/catalogo/categorias — crea la categoría o subcategoría. */
  async crear(payload: FormularioCategoria): Promise<ApiResponse<ResultadoGuardadoCategoria>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoGuardadoCategoria>>(BASE, payload);
    return data;
  },

  /** PUT /api/catalogo/categorias/:id — actualiza la categoría. */
  async actualizar(
    id: string,
    payload: FormularioCategoria
  ): Promise<ApiResponse<ResultadoGuardadoCategoria>> {
    const { data } = await apiClient.put<ApiResponse<ResultadoGuardadoCategoria>>(
      `${BASE}/${id}`,
      payload
    );
    return data;
  },
};
