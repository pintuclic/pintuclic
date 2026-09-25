import { z } from 'zod';

export const direccionSchema = z.object({
  direccion: z
    .string()
    .trim()
    .min(5, 'La dirección debe tener al menos 5 caracteres')
    .max(255, 'La dirección no puede superar 255 caracteres'),
  barrio: z
    .string()
    .trim()
    .min(2, 'El barrio o sector debe tener al menos 2 caracteres')
    .max(100, 'El barrio no puede superar 100 caracteres'),
  apartamento_casa: z
    .string()
    .trim()
    .max(100, 'El apartamento o detalle no puede superar 100 caracteres')
    .optional()
    .nullable(),
  nombre_apellido: z
    .string()
    .trim()
    .min(2, 'El nombre del destinatario debe tener al menos 2 caracteres')
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

export type DireccionFormulario = z.infer<typeof direccionSchema>;
