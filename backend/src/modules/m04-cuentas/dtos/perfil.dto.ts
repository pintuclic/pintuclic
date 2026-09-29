import { z } from 'zod';

// ==============================================================================
// M04 - DTOs de Gestión del Perfil (HU-CUE-06)
// ==============================================================================

/**
 * DTO para actualización de datos personales (RF-CUE-06-02).
 * Un cliente empresa no puede modificar su NIT desde aquí (RF-CUE-06-06).
 */
export const actualizarPerfilSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede exceder 150 caracteres')
    .optional(),
  telefono: z
    .string()
    .trim()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .regex(/^[0-9+\s\-()]+$/, 'El formato de teléfono es inválido')
    .optional(),
  documento_identidad: z
    .string()
    .trim()
    .max(30, 'El documento no puede exceder 30 caracteres')
    .optional(),
  nombre_representante: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .optional(),
});

export type ActualizarPerfilDTO = z.infer<typeof actualizarPerfilSchema>;

/**
 * DTO para solicitar cambio de correo electrónico (RF-CUE-06-03).
 * Exige la contraseña actual para verificar la identidad antes de emitir el código al correo vigente.
 */
export const solicitarCambioCorreoSchema = z.object({
  nuevoCorreo: z
    .string()
    .trim()
    .email('Debe indicar un correo nuevo válido')
    .transform((val) => val.toLowerCase()),
  contrasenaActual: z.string().min(1, 'Debe ingresar su contraseña actual'),
});

export type SolicitarCambioCorreoDTO = z.infer<typeof solicitarCambioCorreoSchema>;

/**
 * DTO para confirmar el cambio de correo introduciendo el código OTP enviado al correo actual.
 */
export const confirmarCambioCorreoSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(4, 'El código debe tener al menos 4 caracteres')
    .max(10, 'El código no puede superar 10 caracteres'),
  nuevoCorreo: z
    .string()
    .trim()
    .email('Debe indicar el nuevo correo electrónico')
    .transform((val) => val.toLowerCase()),
});

export type ConfirmarCambioCorreoDTO = z.infer<typeof confirmarCambioCorreoSchema>;

/**
 * DTO para solicitar ascenso de cliente particular a empresa (RF-CUE-06-07 / CA-CUE-06-06).
 */
export const solicitarAscensoEmpresaSchema = z.object({
  nombre_empresa: z
    .string()
    .trim()
    .min(2, 'La razón social debe tener al menos 2 caracteres')
    .max(150),
  nombre_representante: z
    .string()
    .trim()
    .min(2, 'El representante debe tener al menos 2 caracteres')
    .max(150),
  nit: z
    .string()
    .trim()
    .min(5, 'El NIT o RUT debe tener al menos 5 caracteres')
    .max(30)
    .regex(/^[0-9\-kK]+$/, 'El NIT debe contener dígitos y guion de verificación'),
  telefono: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^[0-9+\s\-()]+$/),
});

export type SolicitarAscensoEmpresaDTO = z.infer<typeof solicitarAscensoEmpresaSchema>;
