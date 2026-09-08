import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE BASES (Zod)
// Validación de entradas HTTP para HU-CAT-12 (solo el registro de bases; el
// tipo de resina de RF-CAT-12-01 se excluyó a petición explícita del PO).
// ==============================================================================

const nombreBaseSchema = z
  .string()
  .trim()
  .min(1, 'El nombre o código de la base es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

export const CrearBaseDto = z.object({
  nombre: nombreBaseSchema,
  id_marca: z.number().int().positive('Debe indicar la marca a la que pertenece la base'),
});
export type CrearBaseDto = z.infer<typeof CrearBaseDto>;

export const ActualizarBaseDto = z.object({
  nombre: nombreBaseSchema,
});
export type ActualizarBaseDto = z.infer<typeof ActualizarBaseDto>;
