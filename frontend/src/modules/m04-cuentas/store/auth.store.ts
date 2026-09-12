import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { CuentasService } from "../services/cuentas.service";
import type {
  UsuarioSeguro,
  ResultadoLogin,
  LoginPayload,
} from "../interfaces/registro.interface";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem("access_token"));
  const sessionId = ref<string | null>(localStorage.getItem("session_id"));

  const leerUsuarioInicial = (): UsuarioSeguro | null => {
    try {
      const item = localStorage.getItem("user_data");
      return item ? (JSON.parse(item) as UsuarioSeguro) : null;
    } catch {
      return null;
    }
  };

  const user = ref<UsuarioSeguro | null>(leerUsuarioInicial());

  const isAuthenticated = computed(() => !!token.value);

  const setAuthData = (
    newToken: string,
    newUser: UsuarioSeguro,
    sid?: string,
  ): void => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem("access_token", newToken);
    localStorage.setItem("user_data", JSON.stringify(newUser));
    if (sid) {
      sessionId.value = sid;
      localStorage.setItem("session_id", sid);
    }
  };

  const logout = (): void => {
    token.value = null;
    user.value = null;
    sessionId.value = null;
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("session_id");
  };

  const login = async (
    correo: string,
    contrasena: string,
  ): Promise<ResultadoLogin> => {
    const payload: LoginPayload = { correo, contrasena };
    const response = await CuentasService.login(payload);
    const data = response.data;
    if (data.sesion?.accessToken) {
      setAuthData(data.sesion.accessToken, data.usuario, data.sesion.idSesion);
    }
    return data;
  };

  return {
    token,
    user,
    sessionId,
    isAuthenticated,
    login,
    logout,
    setAuthData,
  };
});
