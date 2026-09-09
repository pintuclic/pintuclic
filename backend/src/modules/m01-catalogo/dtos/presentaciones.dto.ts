import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE PRESENTACIÓN (Zod) — HU-CAT-03, RF-CAT-03-05
// ==============================================================================

const nombreSchema = z
  .string()
  .trim()
  .min(1, 'El nombre de la presentación es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

const volumenSchema = z.number().positive('El volumen debe ser mayor que cero');

export const CrearPresentacionDto = z.object({ nombre: nombreSchema, volumen: volumenSchema });
export type CrearPresentacionDto = z.infer<typeof CrearPresentacionDto>;

export const ActualizarPresentacionDto = z
  .object({ nombre: nombreSchema.optional(), volumen: volumenSchema.optional() })
  .refine((d) => d.nombre !== undefined || d.volumen !== undefined, {
    message: 'Debe indicar al menos un dato a actualizar',
  });
export type ActualizarPresentacionDto = z.infer<typeof ActualizarPresentacionDto>;
