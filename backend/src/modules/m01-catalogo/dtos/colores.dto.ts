import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE COLORES (Zod) — HU-CAT-05
// Catálogo único de colores (RF-CAT-05-01): no pertenecen a ninguna marca. El
// hexadecimal es obligatorio y genera la muestra visual (RF-CAT-05-02).
// ==============================================================================

const nombreColorSchema = z
  .string()
  .trim()
  .min(1, 'El nombre comercial del color es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

const codigoColorSchema = z.string().trim().min(1, 'El código no puede ser vacío').max(60, 'El código no puede superar los 60 caracteres');

/** RF-CAT-05-02: hexadecimal `#RRGGBB`, normalizado a mayúsculas. */
const hexadecimalSchema = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, 'El hexadecimal debe tener el formato #RRGGBB')
  .transform((valor) => valor.toUpperCase());

export const CrearColorDto = z.object({
  nombre: nombreColorSchema,
  codigo: codigoColorSchema.optional(),
  hexadecimal: hexadecimalSchema,
  // RF-CAT-12-13: color de productos transparentes, que no se prepara sobre ninguna base.
  sin_base: z.boolean().default(false),
});
export type CrearColorDto = z.infer<typeof CrearColorDto>;

export const ActualizarColorDto = z
  .object({
    nombre: nombreColorSchema.optional(),
    // `null` limpia el código; omitirlo lo deja intacto.
    codigo: codigoColorSchema.nullable().optional(),
    hexadecimal: hexadecimalSchema.optional(),
    sin_base: z.boolean().optional(),
  })
  .refine((d) => Object.values(d).some((valor) => valor !== undefined), {
    message: 'Debe indicar al menos un dato a actualizar',
  });
export type ActualizarColorDto = z.infer<typeof ActualizarColorDto>;

/** RF-CAT-05-01 / CA-CAT-05-05: búsqueda paginada sobre el catálogo (miles de colores). */
export const ListarColoresQueryDto = z.object({
  q: z.string().trim().min(1).optional(),
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(200).default(50),
});
export type ListarColoresQueryDto = z.infer<typeof ListarColoresQueryDto>;
