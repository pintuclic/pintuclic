import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DEL FORMULARIO DE VARIANTE (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/variante-formulario.dto.ts
 *
 * Reglas de RF-CAT-03: la variante necesita producto asociado, presentación y
 * códigos únicos; el precio y la existencia referencial viven en la variante
 * (RF-CAT-03-03/04). Sincronizado 1:1 con `FormularioVariante`.
 * ==============================================================================
 */

export const estadoVarianteFormSchema = z.enum(['borrador', 'activo', 'inactivo']);

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

const enteroOpcional = z
  .number({ invalid_type_error: 'Debe ser un número' })
  .nonnegative('No puede ser negativo')
  .nullable();

export const imagenVarianteSchema = z.object({
  id: z.string(),
  url: z.string(),
  nombre: z.string(),
  esPrincipal: z.boolean(),
});

export const varianteFormularioSchema = z
  .object({
    productoId: requerido('Selecciona el producto asociado'),

    presentacion: requerido('Selecciona la presentación'),
    unidadMedida: requerido('Selecciona la unidad de medida'),
    base: z.string().trim().default(''),

    colorId: z.string().trim().min(1).nullable().default(null),

    sku: requerido('El SKU o código interno es obligatorio').max(60, 'Máximo 60 caracteres'),
    codigoProveedor: z.string().trim().max(60, 'Máximo 60 caracteres').default(''),
    codigoBarras: z.string().trim().max(40, 'Máximo 40 caracteres').default(''),

    precioVenta: z
      .number({ required_error: 'El precio de venta es obligatorio', invalid_type_error: 'Debe ser un número' })
      .positive('El precio debe ser mayor a cero'),
    precioReferencia: enteroOpcional,
    costoCompra: enteroOpcional,
    impuestoIva: z.number().nonnegative().default(19),

    stockInicial: z
      .number({ required_error: 'El stock inicial es obligatorio', invalid_type_error: 'Debe ser un número' })
      .int('Debe ser un entero')
      .nonnegative('No puede ser negativo'),
    stockMinimo: z
      .number({ required_error: 'El stock mínimo es obligatorio', invalid_type_error: 'Debe ser un número' })
      .int('Debe ser un entero')
      .nonnegative('No puede ser negativo'),
    bodegaId: requerido('Selecciona la bodega principal'),

    pesoKg: enteroOpcional,
    altoCm: enteroOpcional,
    anchoCm: enteroOpcional,
    profundidadCm: enteroOpcional,

    notasLogisticas: z.string().trim().max(500, 'Máximo 500 caracteres').default(''),
    imagenes: z.array(imagenVarianteSchema).default([]),

    estado: estadoVarianteFormSchema,
  })
  .superRefine((valor, ctx) => {
    if (
      valor.stockInicial !== undefined &&
      valor.stockMinimo !== undefined &&
      valor.stockMinimo > valor.stockInicial
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['stockMinimo'],
        message: 'El stock mínimo no puede superar al inicial',
      });
    }
  });

export type VarianteFormularioDTO = z.infer<typeof varianteFormularioSchema>;

/**
 * Valida el formulario y devuelve los errores como `Record<campo, mensaje>`
 * (mismo formato que el resto del módulo).
 */
export function validarVarianteFormulario(
  valor: unknown
): { valido: boolean; errores: Record<string, string> } {
  const resultado = varianteFormularioSchema.safeParse(valor);
  if (resultado.success) return { valido: true, errores: {} };

  const errores: Record<string, string> = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path.join('.') || 'general';
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return { valido: false, errores };
}
