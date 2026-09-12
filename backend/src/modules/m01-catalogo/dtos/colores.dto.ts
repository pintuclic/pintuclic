import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE COLORES (Zod)
// Validación de entradas HTTP para HU-CAT-05 (alcance aprobado: registro por
// marca + valor CIELAB obligatorio, sin familias cromáticas —RF-CAT-05-03
// diferido por decisión del PO en esta conversación—).
// ==============================================================================

const nombreColorSchema = z
  .string()
  .trim()
  .min(1, 'El nombre comercial del color es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

const codigoColorSchema = z.string().trim().min(1, 'El código no puede ser vacío').max(60, 'El código no puede superar los 60 caracteres');

/**
 * RF-CAT-05-02: valor cromático CIELAB obligatorio. Rangos estándar del espacio:
 * L* ∈ [0, 100]; a*, b* ∈ [-128, 128].
 */
const cielabSchema = z.object({
  l: z.number().min(0, 'L* debe ser ≥ 0').max(100, 'L* debe ser ≤ 100'),
  a: z.number().min(-128, 'a* debe ser ≥ -128').max(128, 'a* debe ser ≤ 128'),
  b: z.number().min(-128, 'b* debe ser ≥ -128').max(128, 'b* debe ser ≤ 128'),
});

export const CrearColorDto = z.object({
  nombre: nombreColorSchema,
  id_marca: z.number().int().positive('Debe indicar la marca a la que pertenece el color'),
  codigo: codigoColorSchema.optional(),
  cielab: cielabSchema,
});
export type CrearColorDto = z.infer<typeof CrearColorDto>;

export const ActualizarColorDto = z
  .object({
    nombre: nombreColorSchema.optional(),
    // `null` limpia el código; omitirlo lo deja intacto.
    codigo: codigoColorSchema.nullable().optional(),
    cielab: cielabSchema.optional(),
  })
  .refine((d) => d.nombre !== undefined || d.codigo !== undefined || d.cielab !== undefined, {
    message: 'Debe indicar al menos un dato a actualizar',
  });
export type ActualizarColorDto = z.infer<typeof ActualizarColorDto>;
