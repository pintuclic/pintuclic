import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE PRODUCTOS (Zod)
// Validación de entradas HTTP para HU-CAT-02. Las reglas cruzadas que dependen
// de la clase de color (pintura exige línea + resina, RF-CAT-02-02) y de la
// pertenencia de la línea a la marca se resuelven en el servicio, donde se
// conoce el estado efectivo del producto.
// ==============================================================================

const nombreProductoSchema = z
  .string()
  .trim()
  .min(1, 'El nombre del producto es obligatorio')
  .max(150, 'El nombre no puede superar los 150 caracteres');

const descripcionSchema = z.string().trim().max(5000, 'La descripción es demasiado larga');
const idPositivo = z.number().int().positive();
const claseColorSchema = z.enum(['entonable', 'colores_fijos', 'sin_color']);

// RF-CAT-02-02: al menos una subcategoría, sin duplicados.
const subcategoriasSchema = z
  .array(idPositivo)
  .min(1, 'El producto debe pertenecer al menos a una subcategoría')
  .refine((ids) => new Set(ids).size === ids.length, { message: 'Hay subcategorías repetidas' });

export const CrearProductoDto = z.object({
  nombre: nombreProductoSchema,
  id_marca: idPositivo,
  clase_color: claseColorSchema,
  id_subcategorias: subcategoriasSchema,
  id_linea: idPositivo.optional(),
  id_tipo_resina: idPositivo.optional(),
  descripcion: descripcionSchema.optional(),
});
export type CrearProductoDto = z.infer<typeof CrearProductoDto>;

export const ActualizarProductoDto = z
  .object({
    nombre: nombreProductoSchema.optional(),
    clase_color: claseColorSchema.optional(),
    id_subcategorias: subcategoriasSchema.optional(),
    // `null` limpia la línea/resina; omitirlo la deja intacta.
    id_linea: idPositivo.nullable().optional(),
    id_tipo_resina: idPositivo.nullable().optional(),
    descripcion: descripcionSchema.nullable().optional(),
  })
  .refine(
    (d) =>
      d.nombre !== undefined ||
      d.clase_color !== undefined ||
      d.id_subcategorias !== undefined ||
      d.id_linea !== undefined ||
      d.id_tipo_resina !== undefined ||
      d.descripcion !== undefined,
    { message: 'Debe indicar al menos un dato a actualizar' }
  );
export type ActualizarProductoDto = z.infer<typeof ActualizarProductoDto>;
