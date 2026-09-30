import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DE CATEGORÍAS Y SUBCATEGORÍAS
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/categorias.dto.ts
 *
 * RF-CAT-01-01: nombre obligatorio (≤ 100) en ambas; la subcategoría exige
 * categoría padre. RF-CAT-01-02: solo dos niveles. RF-CAT-01-03: la unicidad
 * de nombre por nivel se valida en el servidor.
 * ==============================================================================
 */

const nombreCategoriaSchema = z
  .string({ required_error: 'El nombre es obligatorio' })
  .trim()
  .min(2, 'Debe tener al menos 2 caracteres')
  .max(100, 'Máximo 100 caracteres');

/** Alta / edición de una categoría raíz. */
export const categoriaFormSchema = z.object({
  nombre: nombreCategoriaSchema,
  descripcion: z.string().trim().max(300, 'Máximo 300 caracteres').default(''),
  orden: z.number().int().positive().default(1),
});

export type CategoriaFormDTO = z.infer<typeof categoriaFormSchema>;

/** Alta / edición de una subcategoría (RF-CAT-01-01: padre obligatorio). */
export const subcategoriaFormSchema = z.object({
  nombre: nombreCategoriaSchema,
  categoriaPadreId: z
    .string({ required_error: 'Selecciona la categoría padre' })
    .min(1, 'Selecciona la categoría padre'),
  orden: z.number().int().positive().default(1),
});

export type SubcategoriaFormDTO = z.infer<typeof subcategoriaFormSchema>;

export const ordenElementoCategoriaSchema = z.object({
  campo: z
    .enum(['nombre', 'tipo', 'padre', 'productos', 'estado', 'orden'])
    .default('orden'),
  direccion: z.enum(['asc', 'desc']).default('asc'),
});

export const filtrosElementosCategoriaSchema = z.object({
  busqueda: z.string().trim().max(120).default(''),
  tipo: z.enum(['categoria', 'subcategoria']).nullable().default(null),
  estado: z.enum(['publicado', 'inactivo']).nullable().default(null),
  orden: ordenElementoCategoriaSchema.default({ campo: 'orden', direccion: 'asc' }),
});

export type FiltrosElementosCategoriaDTO = z.infer<typeof filtrosElementosCategoriaSchema>;

export const FILTROS_ELEMENTOS_INICIALES: FiltrosElementosCategoriaDTO =
  filtrosElementosCategoriaSchema.parse({});
