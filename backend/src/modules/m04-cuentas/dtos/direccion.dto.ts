import { z } from 'zod';

// ==============================================================================
// M04 - DTOs de Gestión de Direcciones del Cliente (HU-CUE-07)
// ==============================================================================

/**
 * DTO para creación de nueva dirección (RF-CUE-07-01 / RF-CUE-07-06).
 */
export const crearDireccionSchema = z.object({
  direccion: z
    .string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(255, 'La dirección no puede superar 255 caracteres'),
  barrio: z
    .string()
    .trim()
    .min(2, 'El barrio debe tener al menos 2 caracteres')
    .max(100, 'El barrio no puede superar 100 caracteres'),
  apartamento_casa: z
    .string()
    .trim()
    .max(100, 'El apartamento o casa no puede superar 100 caracteres')
    .optional()
    .nullable(),
  nombre_apellido: z
    .string()
    .trim()
    .min(2, 'El nombre y apellido del destinatario debe tener al menos 2 caracteres')
    .max(150, 'El nombre no puede superar 150 caracteres'),
  telefono: z
    .string()
    .trim()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(20, 'El teléfono no puede superar 20 caracteres')
    .regex(/^[0-9+\s\-()]+$/, 'El formato de teléfono es inválido'),
  es_predeterminada: z.boolean().optional().default(false),
  latitud: z.number().min(-90).max(90).optional().nullable(),
  longitud: z.number().min(-180).max(180).optional().nullable(),
});

export type CrearDireccionDTO = z.infer<typeof crearDireccionSchema>;

/**
 * DTO para modificación de dirección existente (RF-CUE-07-02).
 */
export const actualizarDireccionSchema = crearDireccionSchema.partial();

export type ActualizarDireccionDTO = z.infer<typeof actualizarDireccionSchema>;
