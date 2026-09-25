import { z } from 'zod';

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
    .regex(/^\d{6,10}$/, 'El documento de identidad debe tener entre 6 y 10 dígitos numéricos')
    .optional()
    .or(z.literal('')),
  nombre_representante: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .optional(),
  correo: z
    .string()
    .trim()
    .email('Formato de correo inválido')
    .optional(),
  ciudad: z
    .string()
    .trim()
    .optional(),
  direccion: z
    .string()
    .trim()
    .optional(),
  barrio: z
    .string()
    .trim()
    .optional(),
});

export type ActualizarPerfilDTO = z.infer<typeof actualizarPerfilSchema>;
