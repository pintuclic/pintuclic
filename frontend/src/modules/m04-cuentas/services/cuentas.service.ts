import { apiClient } from '@/core/api/axios';
import type {
  RegistroNaturalPayload,
  RegistroEmpresaPayload,
  RespuestaLogin,
  RespuestaApi,
} from '../interfaces/registro.interface';

/**
 * Servicio encargado de la comunicación con los endpoints del módulo de Cuentas (M04).
 * Aísla a los componentes Vue de la lógica de transporte de red (Axios).
 */
export const CuentasService = {
  async login(correo: string, contrasena: string): Promise<RespuestaLogin> {
    const response = await apiClient.post<RespuestaLogin>('/cuentas/login', { correo, contrasena });
    return response.data;
  },
  
  async registrarParticular(data: RegistroNaturalPayload): Promise<RespuestaApi> {
    const response = await apiClient.post<RespuestaApi>('/cuentas/registro/particular', data);
    return response.data;
  },
  
  async registrarEmpresa(data: RegistroEmpresaPayload): Promise<RespuestaApi> {
    const response = await apiClient.post<RespuestaApi>('/cuentas/registro/empresa', data);
    return response.data;
  },

  async verificarCodigo(correo: string, codigo: string): Promise<RespuestaApi> {
    const response = await apiClient.post<RespuestaApi>('/cuentas/verificar-codigo', { correo, codigo });
    return response.data;
  },

  async reenviarCodigo(correo: string): Promise<RespuestaApi> {
    const response = await apiClient.post<RespuestaApi>('/cuentas/reenviar-codigo', { correo });
    return response.data;
  }
};
