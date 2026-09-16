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
import type {
  SolicitudEmpresa,
  DictamenSolicitudPayload,
} from "../interfaces/admin.interface";

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

  async solicitarCambioCorreo(
    nuevoCorreo: string,
    contrasenaActual: string,
  ): Promise<ApiResponse<{ mensaje: string }>> {
    const { data } = await apiClient.post<ApiResponse<{ mensaje: string }>>(
      "/cuentas/perfil/cambiar-correo/solicitar",
      { nuevoCorreo, contrasenaActual },
    );
    return data;
  },

  async confirmarCambioCorreo(
    nuevoCorreo: string,
    codigo: string,
  ): Promise<ApiResponse<{ mensaje: string; nuevoCorreo: string }>> {
    const { data } = await apiClient.post<
      ApiResponse<{ mensaje: string; nuevoCorreo: string }>
    >("/cuentas/perfil/cambiar-correo/confirmar", { nuevoCorreo, codigo });
    return data;
  },

  // ==============================================================================
  // MÉTODOS DE ADMINISTRACIÓN (HU-CUE-09)
  // ==============================================================================
  async listarSolicitudesEmpresa(): Promise<ApiResponse<SolicitudEmpresa[]>> {
    const { data } = await apiClient.get<ApiResponse<SolicitudEmpresa[]>>(
      "/cuentas/admin/solicitudes-empresa",
    );
    return data;
  },

  async dictaminarSolicitudEmpresa(
    idSolicitud: string,
    payload: DictamenSolicitudPayload,
  ): Promise<ApiResponse<SolicitudEmpresa>> {
    const { data } = await apiClient.post<ApiResponse<SolicitudEmpresa>>(
      `/cuentas/admin/solicitudes-empresa/${idSolicitud}/dictamen`,
      payload,
    );
    return data;
  },
};
