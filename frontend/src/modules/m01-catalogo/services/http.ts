import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';
import { apiClient } from '@/core/api/axios';
import type { ApiErrorResponse, ApiResponse } from '../interfaces';

/**
 * ==============================================================================
 * M01 - TRANSPORTE HTTP DEL MÓDULO
 * Ubicación: src/modules/m01-catalogo/services/http.ts
 *
 * Único punto que conoce el sobre `{ success, data }` del backend. Los servicios
 * del módulo solo declaran URLs; las vistas solo reciben datos tipados o un
 * mensaje de error legible. Nunca hay datos de respaldo: si la API falla, falla.
 * ==============================================================================
 */

/** Subidas en base64 (logotipos e imágenes de hasta 5 MB) superan el timeout global de 7 s. */
export const CONFIG_SUBIDA: AxiosRequestConfig = { timeout: 30000 };

export async function get<T>(url: string, params?: object): Promise<T> {
  const { data } = await apiClient.get<ApiResponse<T>>(url, { params });
  return data.data;
}

export async function post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.post<ApiResponse<T>>(url, body, config);
  return data.data;
}

export async function patch<T>(url: string, body: unknown = {}, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await apiClient.patch<ApiResponse<T>>(url, body, config);
  return data.data;
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await apiClient.delete<ApiResponse<T>>(url);
  return data.data;
}

/** Binarios protegidos (logotipos, imágenes): se piden con Bearer, un `<img src>` directo no lo envía. */
export async function getBlob(url: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(url, { responseType: 'blob' });
  return data;
}

/** El backend entrega `contenido_url` con el prefijo `/api`, que `apiClient` ya incluye en su baseURL. */
export function rutaApi(url: string): string {
  return url.replace(/^\/api(?=\/)/, '');
}

/** Traduce cualquier fallo a un mensaje para el usuario, priorizando el que redactó el backend. */
export function mensajeError(error: unknown): string {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) return 'Ocurrió un error inesperado.';
  if (!error.response) return 'No fue posible conectar con el servidor. Verifica que la API esté en línea.';

  const cuerpo = error.response.data;
  const detalles = cuerpo?.error?.details;
  if (Array.isArray(detalles) && detalles.length > 0) {
    return detalles.map((d) => d.message).join(' · ');
  }
  if (cuerpo?.error?.message) return cuerpo.error.message;
  if (error.response.status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente.';
  if (error.response.status === 403) return 'No tienes permiso para realizar esta acción.';
  return `El servidor respondió con un error (${error.response.status}).`;
}
