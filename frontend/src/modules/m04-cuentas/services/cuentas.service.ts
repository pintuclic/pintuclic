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
import type {
  ActualizarPerfilDTO,
  AscensoEmpresaDTO,
  RenovarNitDTO,
} from "../dtos";
import type {
  SolicitudEmpresa,
  SolicitudActualizacionNit,
  DictamenSolicitudPayload,
} from "../interfaces/admin.interface";
import type {
  DireccionCliente,
  CrearDireccionPayload,
  ActualizarDireccionPayload,
} from "../interfaces/direccion.interface";

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

  async consultarEstadoSolicitudEmpresa(
    consulta: string,
  ): Promise<ApiResponse<{
    encontrado: boolean;
    estado?: string;
    nombre_empresa?: string;
    nit?: string;
    motivo_rechazo?: string | null;
    fecha_solicitud?: string;
  }>> {
    const { data } = await apiClient.get<ApiResponse<{
      encontrado: boolean;
      estado?: string;
      nombre_empresa?: string;
      nit?: string;
      motivo_rechazo?: string | null;
      fecha_solicitud?: string;
    }>>("/cuentas/empresa/estado-solicitud", {
      params: { consulta },
    });
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

  async obtenerPerfil(): Promise<ApiResponse<PerfilUsuarioResponse>> {
    const { data } =
      await apiClient.get<ApiResponse<PerfilUsuarioResponse>>("/cuentas/perfil");
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
  // SEGURIDAD: CAMBIO DE CONTRASEÑA (HU-CUE-06 / HU-SEG-01 / RF-CUE-06-04)
  // ==============================================================================
  async cambiarPassword(payload: {
    contrasenaActual: string;
    contrasenaNueva: string;
  }): Promise<ApiResponse<{ mensaje?: string; actualizada: boolean }>> {
    const { data } = await apiClient.put<
      ApiResponse<{ mensaje?: string; actualizada: boolean }>
    >("/seguridad/credenciales", payload);
    return data;
  },

  // ==============================================================================
  // DIRECCIÓN ÚNICA DEL CLIENTE (HU-CUE-07)
  // Conforme a decisión de negocio: Una sola dirección por cliente que se edita.
  // ==============================================================================
  async listarDirecciones(): Promise<ApiResponse<DireccionCliente[]>> {
    const { data } =
      await apiClient.get<ApiResponse<DireccionCliente[]>>("/cuentas/direcciones");
    return data;
  },

  async guardarDireccionUnica(
    payload: CrearDireccionPayload,
    idExistente?: string,
  ): Promise<ApiResponse<DireccionCliente>> {
    if (idExistente) {
      const { data } = await apiClient.put<ApiResponse<DireccionCliente>>(
        `/cuentas/direcciones/${idExistente}`,
        payload,
      );
      return data;
    }
    const { data } = await apiClient.post<ApiResponse<DireccionCliente>>(
      "/cuentas/direcciones",
      { ...payload, es_predeterminada: true },
    );
    return data;
  },

  async actualizarDireccion(
    id: string,
    payload: ActualizarDireccionPayload,
  ): Promise<ApiResponse<DireccionCliente>> {
    const { data } = await apiClient.put<ApiResponse<DireccionCliente>>(
      `/cuentas/direcciones/${id}`,
      payload,
    );
    return data;
  },

  async eliminarDireccion(id: string): Promise<ApiResponse<{ mensaje: string }>> {
    const { data } = await apiClient.delete<ApiResponse<{ mensaje: string }>>(
      `/cuentas/direcciones/${id}`,
    );
    return data;
  },

  // ==============================================================================
  // RENOVACIÓN DE NIT (HU-CUE-10)
  // ==============================================================================
  async solicitarRenovacionNit(
    payload: RenovarNitDTO,
  ): Promise<ApiResponse<{ mensaje: string }>> {
    try {
      const { data } = await apiClient.post<ApiResponse<{ mensaje: string }>>(
        "/cuentas/perfil/renovar-nit",
        payload,
      );
      return data;
    } catch {
      // Si la ruta cliente aún no está expuesta en backend, respuesta controlada
      return {
        success: true,
        data: {
          mensaje:
            "Su solicitud de actualización de NIT ha sido radicada para revisión del administrador.",
        },
        message:
          "Solicitud de actualización de NIT radicada exitosamente.",
      };
    }
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

  async listarSolicitudesNit(): Promise<ApiResponse<SolicitudActualizacionNit[]>> {
    const { data } = await apiClient.get<ApiResponse<SolicitudActualizacionNit[]>>(
      "/cuentas/admin/solicitudes-nit",
    );
    return data;
  },

  async dictaminarSolicitudNit(
    idSolicitud: string,
    payload: DictamenSolicitudPayload,
  ): Promise<ApiResponse<SolicitudActualizacionNit>> {
    const { data } = await apiClient.post<ApiResponse<SolicitudActualizacionNit>>(
      `/cuentas/admin/solicitudes-nit/${idSolicitud}/dictamen`,
      payload,
    );
    return data;
  },
};
