import { apiClient } from '@/core/api/axios';
import type {
  RegistroNaturalPayload,
  RegistroEmpresaPayload,
  VerificarCodigoPayload,
  ReenviarCodigoPayload,
  LoginPayload,
  ApiResponse,
  ResultadoLogin,
  ResultadoRegistroParticular,
  ResultadoRegistroEmpresa,
  ResultadoVerificacion,
  ResultadoReenvio,
  GoogleAuthPayload,
  GoogleVincularPayload,
  CompletarPasswordGooglePayload,
  ResultadoGoogleAuth,
} from '../interfaces/registro.interface';

/**
 * ==============================================================================
 * M04 - SERVICIO HTTP CLIENTE (CUENTAS Y AUTENTICACIÓN)
 * Conexión tipada con los endpoints de Express Kysely.
 * Desempaqueta y tipa las respuestas mediante ApiResponse<T>.
 * ==============================================================================
 */
export const CuentasService = {
  /**
   * POST /api/cuentas/login (HU-CUE-04)
   */
  async login(payload: LoginPayload): Promise<ApiResponse<ResultadoLogin>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoLogin>>('/cuentas/login', payload);
    return data;
  },

  /**
   * POST /api/cuentas/registro/particular (HU-CUE-01)
   */
  async registrarParticular(
    payload: RegistroNaturalPayload
  ): Promise<ApiResponse<ResultadoRegistroParticular>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoRegistroParticular>>(
      '/cuentas/registro/particular',
      payload
    );
    return data;
  },

  /**
   * POST /api/cuentas/registro/empresa (HU-CUE-03)
   */
  async registrarEmpresa(
    payload: RegistroEmpresaPayload
  ): Promise<ApiResponse<ResultadoRegistroEmpresa>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoRegistroEmpresa>>(
      '/cuentas/registro/empresa',
      payload
    );
    return data;
  },

  /**
   * POST /api/cuentas/verificar-codigo (HU-CUE-01 / CA-CUE-01-02)
   */
  async verificarCodigo(
    payload: VerificarCodigoPayload
  ): Promise<ApiResponse<ResultadoVerificacion>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoVerificacion>>(
      '/cuentas/verificar-codigo',
      payload
    );
    return data;
  },

  /**
   * POST /api/cuentas/reenviar-codigo (HU-CUE-01 / RF-CUE-01-04)
   */
  async reenviarCodigo(
    payload: ReenviarCodigoPayload
  ): Promise<ApiResponse<ResultadoReenvio>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoReenvio>>(
      '/cuentas/reenviar-codigo',
      payload
    );
    return data;
  },

  /**
   * POST /api/cuentas/logout (HU-CUE-04)
   */
  async logout(): Promise<ApiResponse<{ mensaje: string }>> {
    const { data } = await apiClient.post<ApiResponse<{ mensaje: string }>>('/cuentas/logout');
    return data;
  },

  /**
   * POST /api/cuentas/google (HU-CUE-02 / RF-CUE-02-01)
   */
  async loginConGoogle(
    payload: GoogleAuthPayload
  ): Promise<ApiResponse<ResultadoGoogleAuth>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoGoogleAuth>>(
      '/cuentas/google',
      payload
    );
    return data;
  },

  /**
   * POST /api/cuentas/google/vincular (HU-CUE-02 / RF-CUE-02-03)
   */
  async confirmarVinculacionGoogle(
    payload: GoogleVincularPayload
  ): Promise<ApiResponse<ResultadoLogin>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoLogin>>(
      '/cuentas/google/vincular',
      payload
    );
    return data;
  },

  /**
   * POST /api/cuentas/google/completar-password (HU-CUE-02 / RF-CUE-02-04)
   */
  async completarPasswordGoogle(
    payload: CompletarPasswordGooglePayload
  ): Promise<ApiResponse<ResultadoLogin>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoLogin>>(
      '/cuentas/google/completar-password',
      payload
    );
    return data;
  },
};
