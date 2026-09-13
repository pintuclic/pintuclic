import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE VARIANTES (Zod) — HU-CAT-03
// La forma según clase (base vs color) y la pertenencia a la marca se validan
// en el servicio, donde se conoce el producto.
// ==============================================================================

const idPositivo = z.number().int().positive();
const precioSchema = z.number().min(0, 'El precio no puede ser negativo');
const existenciaSchema = z.number().int().min(0, 'La existencia referencial no puede ser negativa');
const codigoProveedorSchema = z.string().trim().min(1).max(100);

export const CrearVarianteDto = z.object({
  id_producto: idPositivo,
  id_presentacion: idPositivo,
  precio_vigente: precioSchema,
  existencia_referencial: existenciaSchema.optional(),
  id_color: idPositivo.optional(),
  id_base: idPositivo.optional(),
  codigo_proveedor: codigoProveedorSchema.optional(),
});
export type CrearVarianteDto = z.infer<typeof CrearVarianteDto>;

export const ActualizarVarianteDto = z
  .object({
    id_presentacion: idPositivo.optional(),
    precio_vigente: precioSchema.optional(),
    existencia_referencial: existenciaSchema.optional(),
    // `null` limpia base/color/código; omitirlo los deja intactos.
    id_color: idPositivo.nullable().optional(),
    id_base: idPositivo.nullable().optional(),
    codigo_proveedor: codigoProveedorSchema.nullable().optional(),
  })
  .refine(
    (d) =>
      d.id_presentacion !== undefined ||
      d.precio_vigente !== undefined ||
      d.existencia_referencial !== undefined ||
      d.id_color !== undefined ||
      d.id_base !== undefined ||
      d.codigo_proveedor !== undefined,
    { message: 'Debe indicar al menos un dato a actualizar' }
  );
export type ActualizarVarianteDto = z.infer<typeof ActualizarVarianteDto>;
