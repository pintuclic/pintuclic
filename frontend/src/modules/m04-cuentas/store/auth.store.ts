import { defineStore } from 'pinia';
import { ref } from 'vue';
import { CuentasService } from '../services/cuentas.service';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('access_token'));
  const user = ref<any | null>(JSON.parse(localStorage.getItem('user_data') || 'null'));

  const setAuthData = (newToken: string, newUser: any) => {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('user_data', JSON.stringify(newUser));
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
  };

  const login = async (correo: string, contrasena: string) => {
    const data = await CuentasService.login(correo, contrasena);
    if (data.token) {
      setAuthData(data.token, data.usuario);
    }
    return data;
  };

  return { token, user, login, logout, setAuthData };
});
