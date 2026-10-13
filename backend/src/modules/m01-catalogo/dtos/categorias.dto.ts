import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE CATEGORÍAS (Zod)
// Validación de entradas HTTP para HU-CAT-01.
// ==============================================================================

/** RF-CAT-01-01: nombre obligatorio, máximo 100 caracteres. */
const nombreCategoriaSchema = z
  .string()
  .trim()
  .min(1, 'El nombre de la categoría es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

const ordenSchema = z.number().int().min(0).optional();

/** RF-CAT-08-01: categoría de la que heredan sus complementarios los productos de esta categoría. */
const categoriaComplementariaSchema = z.number().int().positive().nullable().optional();

export const CrearCategoriaDto = z.object({
  nombre: nombreCategoriaSchema,
  orden: ordenSchema,
  id_categoria_complementaria: categoriaComplementariaSchema,
});
export type CrearCategoriaDto = z.infer<typeof CrearCategoriaDto>;

export const ActualizarCategoriaDto = z
  .object({
    nombre: nombreCategoriaSchema.optional(),
    orden: ordenSchema,
    id_categoria_complementaria: categoriaComplementariaSchema,
  })
  .refine((data) => Object.values(data).some((valor) => valor !== undefined), {
    message: 'Debe indicar al menos un dato a actualizar',
  });
export type ActualizarCategoriaDto = z.infer<typeof ActualizarCategoriaDto>;

/**
 * RF-CAT-01-04 / CA-CAT-01-05: primero se informa el impacto sin `confirmar`,
 * y solo se aplica la desactivación en cascada cuando el administrador confirma.
 */
export const DesactivarCategoriaDto = z.object({
  confirmar: z.boolean().optional().default(false),
});
export type DesactivarCategoriaDto = z.infer<typeof DesactivarCategoriaDto>;
