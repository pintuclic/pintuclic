/**
 * Contrato de datos del registro, alineado 1:1 con los DTOs reales de backend
 * (backend/src/modules/m04-cuentas/dtos/registro.dto.ts: registroParticularSchema
 * y registroEmpresaSchema). Tener los nombres de campo en un solo lugar evita
 * que PasoDatos.vue, RegistroWizard.vue y el futuro service diverjan entre sí.
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
