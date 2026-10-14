import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE BASES (Zod) — HU-CAT-12
// Una base pertenece a una marca y declara su tipo de resina (RF-CAT-12-01).
// ==============================================================================

const nombreBaseSchema = z
  .string()
  .trim()
  .min(1, 'El nombre o código de la base es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

const tipoResinaSchema = z.number().int().positive('Debe indicar el tipo de resina de la base');

export const CrearBaseDto = z.object({
  nombre: nombreBaseSchema,
  id_marca: z.number().int().positive('Debe indicar la marca a la que pertenece la base'),
  id_tipo_resina: tipoResinaSchema,
});
export type CrearBaseDto = z.infer<typeof CrearBaseDto>;

export const ActualizarBaseDto = z
  .object({
    nombre: nombreBaseSchema.optional(),
    id_tipo_resina: tipoResinaSchema.optional(),
  })
  .refine((d) => d.nombre !== undefined || d.id_tipo_resina !== undefined, {
    message: 'Debe indicar al menos un dato a actualizar',
  });
export type ActualizarBaseDto = z.infer<typeof ActualizarBaseDto>;
