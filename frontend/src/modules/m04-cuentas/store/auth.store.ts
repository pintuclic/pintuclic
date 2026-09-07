import { defineStore } from 'pinia';
import { ref } from 'vue';
import { CuentasService } from '../services/cuentas.service';
import type { UsuarioSesion, RespuestaLogin } from '../interfaces/registro.interface';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'));
  
  const leerUsuarioInicial = (): UsuarioSesion | null => {
    try {
      const item = localStorage.getItem('user_data');
      return item ? (JSON.parse(item) as UsuarioSesion) : null;
    } catch {
      return null;
    }
  };

  const user = ref<UsuarioSesion | null>(leerUsuarioInicial());

  const setAuthData = (newToken: string, newUser: UsuarioSesion): void => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user_data', JSON.stringify(newUser));
  };

  const logout = (): void => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
  };

  const login = async (correo: string, contrasena: string): Promise<RespuestaLogin> => {
    const data = await CuentasService.login(correo, contrasena);
    if (data.token) {
      setAuthData(data.token, data.usuario);
    }
    return data;
  };

  return { token, user, login, logout, setAuthData };
});
