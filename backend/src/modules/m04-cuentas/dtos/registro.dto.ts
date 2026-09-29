import { z } from 'zod';
import { contrasenaSchema } from '../../m20-seguridad/dtos/seguridad.dto';

// ==============================================================================
// M04 - DTOs de Registro y Verificación (HU-CUE-01, HU-CUE-03)
// ==============================================================================

/**
 * Registro de cliente particular (HU-CUE-01 / RF-CUE-01-01).
 * Nombre, correo electrónico, teléfono y contraseña segura (BCrypt costo 12).
 */
export const registroParticularSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres'),
  correo: z
    .string()
    .trim()
    .email('Debe indicar un correo electrónico válido')
    .max(150, 'El correo no puede exceder 150 caracteres')
    .transform((val) => val.toLowerCase()),
  telefono: z
    .string()
    .trim()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[0-9+\s\-()]+$/, 'El formato de teléfono es inválido'),
  contrasena: contrasenaSchema,
});

export type RegistroParticularDTO = z.infer<typeof registroParticularSchema>;

/**
 * Confirmación de código OTP de activación (CA-CUE-01-02).
 */
export const verificarCodigoSchema = z.object({
  correo: z
    .string()
    .trim()
    .email('Debe indicar un correo electrónico válido')
    .transform((val) => val.toLowerCase()),
  codigo: z
    .string()
    .trim()
    .min(4, 'El código debe tener al menos 4 caracteres')
    .max(10, 'El código no puede superar 10 caracteres'),
});

export type VerificarCodigoDTO = z.infer<typeof verificarCodigoSchema>;

/**
 * Solicitud de reenvío de código de activación (RF-CUE-01-04).
 */
export const reenviarCodigoSchema = z.object({
  correo: z
    .string()
    .trim()
    .email('Debe indicar un correo electrónico válido')
    .transform((val) => val.toLowerCase()),
});

export type ReenviarCodigoDTO = z.infer<typeof reenviarCodigoSchema>;

/**
 * Registro de cliente corporativo / empresa (HU-CUE-03 / RF-CUE-03-01).
 * Nombre empresa, representante legal, correo empresarial, teléfono, NIT o RUT y contraseña.
 */
export const registroEmpresaSchema = z.object({
  nombre_empresa: z
    .string()
    .trim()
    .min(2, 'El nombre o razón social debe tener al menos 2 caracteres')
    .max(150, 'El nombre de empresa no puede exceder 150 caracteres'),
  nombre_representante: z
    .string()
    .trim()
    .min(2, 'El nombre del representante legal debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres'),
  correo_empresarial: z
    .string()
    .trim()
    .email('Debe indicar un correo corporativo válido')
    .max(150, 'El correo no puede exceder 150 caracteres')
    .transform((val) => val.toLowerCase()),
  telefono: z
    .string()
    .trim()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[0-9+\s\-()]+$/, 'El formato de teléfono es inválido'),
  nit: z
    .string()
    .trim()
    .min(5, 'El NIT o RUT debe tener al menos 5 caracteres')
    .max(30, 'El NIT no puede superar 30 caracteres')
    .regex(/^[0-9\-kK]+$/, 'El NIT debe contener dígitos y guion de verificación'),
  contrasena: contrasenaSchema,
});

export type RegistroEmpresaDTO = z.infer<typeof registroEmpresaSchema>;
