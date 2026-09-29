import { z } from 'zod';
import {
  contrasenaSchema,
  telefonoSchema,
  correoSchema,
} from '@/core/dtos/seguridad.dto';

/**
 * ==============================================================================
 * M04 - DTOs DE REGISTRO DE CUENTAS (HU-CUE-01 / HU-CUE-03)
 * Ubicación: src/modules/m04-cuentas/dtos/registro.dto.ts
 * Contratos de validación para registro particular y empresarial.
 * Sincronizados 1:1 con backend (backend/src/modules/m04-cuentas/dtos/registro.dto.ts).
 * ==============================================================================
 */

/**
 * Esquema de validación para registro de persona natural (HU-CUE-01).
 */
export const registroNaturalSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  correo: correoSchema,
  telefono: telefonoSchema,
  contrasena: contrasenaSchema,
});

export type RegistroNaturalDTO = z.infer<typeof registroNaturalSchema>;

/**
 * Esquema de validación para registro de persona jurídica / empresa (HU-CUE-03).
 */
export const registroEmpresaSchema = z.object({
  nombre_empresa: z
    .string({ required_error: 'El nombre de empresa es obligatorio' })
    .trim()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  nombre_representante: z
    .string({ required_error: 'El representante es obligatorio' })
    .trim()
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  correo_empresarial: correoSchema,
  telefono: telefonoSchema,
  nit: z
    .string({ required_error: 'El NIT es obligatorio' })
    .trim()
    .min(5, 'El NIT o RUT debe tener al menos 5 caracteres')
    .max(30, 'Máximo 30 caracteres')
    .regex(/^[0-9\-kK]+$/, 'El NIT debe contener dígitos y guion de verificación'),
  contrasena: contrasenaSchema,
});

export type RegistroEmpresaDTO = z.infer<typeof registroEmpresaSchema>;
