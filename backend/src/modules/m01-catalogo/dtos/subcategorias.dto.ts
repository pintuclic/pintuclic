import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE SUBCATEGORÍAS (Zod)
// Validación de entradas HTTP para HU-CAT-01.
// ==============================================================================

const nombreSubcategoriaSchema = z
  .string()
  .trim()
  .min(1, 'El nombre de la subcategoría es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

const ordenSchema = z.number().int().min(0).optional();

/** RF-CAT-01-01: exige la categoría padre además del nombre. */
export const CrearSubcategoriaDto = z.object({
  nombre: nombreSubcategoriaSchema,
  id_categoria: z.number().int().positive('Debe indicar la categoría padre'),
  orden: ordenSchema,
});
export type CrearSubcategoriaDto = z.infer<typeof CrearSubcategoriaDto>;

export const ActualizarSubcategoriaDto = z
  .object({
    nombre: nombreSubcategoriaSchema.optional(),
    orden: ordenSchema,
  })
  .refine((data) => data.nombre !== undefined || data.orden !== undefined, {
    message: 'Debe indicar al menos un dato a actualizar',
  });
export type ActualizarSubcategoriaDto = z.infer<typeof ActualizarSubcategoriaDto>;

export const DesactivarSubcategoriaDto = z.object({
  confirmar: z.boolean().optional().default(false),
});
export type DesactivarSubcategoriaDto = z.infer<typeof DesactivarSubcategoriaDto>;
