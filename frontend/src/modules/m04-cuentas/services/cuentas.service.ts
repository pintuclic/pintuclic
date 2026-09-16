import { apiClient } from "@/core/api/axios";
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
  PerfilUsuarioResponse,
} from "../interfaces/registro.interface";
import type { ActualizarPerfilDTO, AscensoEmpresaDTO } from "../dtos";

export const CuentasService = {
  async login(payload: LoginPayload): Promise<ApiResponse<ResultadoLogin>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoLogin>>(
      "/cuentas/login",
      payload,
    );
    return data;
  },

  async registrarParticular(
    payload: RegistroNaturalPayload,
  ): Promise<ApiResponse<ResultadoRegistroParticular>> {
    const { data } = await apiClient.post<
      ApiResponse<ResultadoRegistroParticular>
    >("/cuentas/registro/particular", payload);
    return data;
  },

  async registrarEmpresa(
    payload: RegistroEmpresaPayload,
  ): Promise<ApiResponse<ResultadoRegistroEmpresa>> {
    const { data } = await apiClient.post<
      ApiResponse<ResultadoRegistroEmpresa>
    >("/cuentas/registro/empresa", payload);
    return data;
  },

  async verificarCodigo(
    payload: VerificarCodigoPayload,
  ): Promise<ApiResponse<ResultadoVerificacion>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoVerificacion>>(
      "/cuentas/verificar-codigo",
      payload,
    );
    return data;
  },

  async reenviarCodigo(
    payload: ReenviarCodigoPayload,
  ): Promise<ApiResponse<ResultadoReenvio>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoReenvio>>(
      "/cuentas/reenviar-codigo",
      payload,
    );
    return data;
  },

  async logout(): Promise<ApiResponse<{ mensaje: string }>> {
    const { data } =
      await apiClient.post<ApiResponse<{ mensaje: string }>>("/cuentas/logout");
    return data;
  },

  async loginConGoogle(
    payload: GoogleAuthPayload,
  ): Promise<ApiResponse<ResultadoGoogleAuth>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoGoogleAuth>>(
      "/cuentas/google",
      payload,
    );
    return data;
  },

  async confirmarVinculacionGoogle(
    payload: GoogleVincularPayload,
  ): Promise<ApiResponse<ResultadoLogin>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoLogin>>(
      "/cuentas/google/vincular",
      payload,
    );
    return data;
  },

  async completarPasswordGoogle(
    payload: CompletarPasswordGooglePayload,
  ): Promise<ApiResponse<ResultadoLogin>> {
    const { data } = await apiClient.post<ApiResponse<ResultadoLogin>>(
      "/cuentas/google/completar-password",
      payload,
    );
    return data;
  },

  async solicitarRecuperacion(
    correo: string,
  ): Promise<ApiResponse<{ mensaje: string }>> {
    const { data } = await apiClient.post<ApiResponse<{ mensaje: string }>>(
      "/cuentas/recuperar-password/solicitar",
      { correo },
    );
    return data;
  },

  async confirmarRecuperacion(
    correo: string,
    codigo: string,
    contrasena_nueva: string,
  ): Promise<ApiResponse<{ mensaje: string }>> {
    const { data } = await apiClient.post<ApiResponse<{ mensaje: string }>>(
      "/cuentas/recuperar-password/confirmar",
      { correo, codigo, contrasena_nueva },
    );
    return data;
  },

  async actualizarPerfil(
    payload: ActualizarPerfilDTO,
  ): Promise<ApiResponse<PerfilUsuarioResponse>> {
    const { data } = await apiClient.put<ApiResponse<PerfilUsuarioResponse>>(
      "/cuentas/perfil",
      payload,
    );
    return data;
  },

  async solicitarAscensoEmpresa(
    payload: AscensoEmpresaDTO,
  ): Promise<ApiResponse<{ mensaje: string }>> {
    const { data } = await apiClient.post<ApiResponse<{ mensaje: string }>>(
      "/cuentas/perfil/solicitar-empresa",
      payload,
    );
    return data;
  },
};
