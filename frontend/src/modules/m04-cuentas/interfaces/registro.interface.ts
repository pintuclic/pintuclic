/**
 * Contrato de datos del registro y autenticación, alineado 1:1 con los DTOs y respuestas
 * de backend (backend/src/modules/m04-cuentas/dtos/registro.dto.ts y auth.service.ts).
 * Pureza estricta de compilación: 0 bytes runtime.
 */

export interface RegistroNaturalPayload {
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

export interface RegistroEmpresaPayload {
  nombre_empresa: string;
  nombre_representante: string;
  correo_empresarial: string;
  telefono: string;
  nit: string;
  contrasena: string;
}

export type TipoCuentaRegistro = 'natural' | 'empresa';

export interface UsuarioSesion {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  rol?: string;
  tipo_usuario?: string;
}

export interface RespuestaLogin {
  token: string;
  usuario: UsuarioSesion;
  sid?: string;
}

export interface RespuestaApi<T = unknown> {
  exito: boolean;
  mensaje?: string;
  datos?: T;
  data?: T;
}
