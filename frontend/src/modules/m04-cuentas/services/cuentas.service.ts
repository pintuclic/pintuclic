import { apiClient } from '@/core/api/axios';

/**
 * Servicio encargado de la comunicación con los endpoints del módulo de Cuentas (M04).
 * Aísla a los componentes Vue de la lógica de red (Axios).
 */
export const CuentasService = {
  async login(correo: string, contrasena: string) {
    const response = await apiClient.post('/cuentas/login', { correo, contrasena });
    return response.data;
  },
  
  async registrarParticular(data: any) {
    const response = await apiClient.post('/cuentas/registro/particular', data);
    return response.data;
  },
  
  async registrarEmpresa(data: any) {
    const response = await apiClient.post('/cuentas/registro/empresa', data);
    return response.data;
  },

  async verificarCodigo(correo: string, codigo: string) {
    const response = await apiClient.post('/cuentas/verificar-codigo', { correo, codigo });
    return response.data;
  },

  async reenviarCodigo(correo: string) {
    const response = await apiClient.post('/cuentas/reenviar-codigo', { correo });
    return response.data;
  }
};
