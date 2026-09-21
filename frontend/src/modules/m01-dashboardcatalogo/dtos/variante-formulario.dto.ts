import { z } from 'zod';
import { validarImagenProducto } from './producto-formulario.dto';

/**
 * ==============================================================================
 * M01 - DTOs DEL FORMULARIO DE VARIANTE (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/variante-formulario.dto.ts
 *
 * Reglas de RF-CAT-03: la variante necesita producto asociado, presentación y
 * precio vigente (RF-CAT-03-03/04). Sincronizado 1:1 con `FormularioVariante`,
 * que a su vez refleja `CrearVarianteDto` del backend real.
 * ==============================================================================
 */

export const estadoVarianteFormSchema = z.enum(['borrador', 'activo', 'inactivo']);

/**
 * Para selects que empiezan sin selección (valor `null`, no `undefined`):
 * `z.string()`/`z.number()` a secas reportan "Expected string/number,
 * received null" en vez del mensaje de campo obligatorio, porque
 * `required_error` solo aplica a `undefined`.
 */
const requeridoNullable = (mensaje: string) =>
  z
    .string()
    .nullable()
    .refine((v): v is string => v !== null && v.trim().length > 0, { message: mensaje });

const numeroRequeridoNullable = (mensaje: string) =>
  z
    .number({ invalid_type_error: 'Debe ser un número' })
    .nonnegative('El precio no puede ser negativo')
    .nullable()
    .refine((v): v is number => v !== null, { message: mensaje });

/** Misma forma que `imagenProductoSchema`: `CrearImagenDto` cubre ambos casos. */
export const imagenVarianteSchema = z.object({
  id: z.string(),
  url: z.string().superRefine((valor, ctx) => {
    const mensaje = validarImagenProducto(valor);
    if (mensaje) ctx.addIssue({ code: z.ZodIssueCode.custom, message: mensaje });
  }),
  nombre: z.string(),
  /** Posición en la galería (`orden`); 0 es la primera. */
  orden: z.number().int().min(0).default(0),
  esPrincipal: z.boolean(),
});

export const varianteFormularioSchema = z.object({
  productoId: requeridoNullable('Selecciona el producto asociado'),

  presentacionId: requeridoNullable('Selecciona la presentación'),

  baseId: z.string().trim().min(1).nullable().default(null),
  colorId: z.string().trim().min(1).nullable().default(null),

  codigoProveedor: z.string().trim().max(100, 'Máximo 100 caracteres').default(''),

  precioVigente: numeroRequeridoNullable('El precio vigente es obligatorio'),
  existenciaReferencial: z
    .number({ invalid_type_error: 'Debe ser un número' })
    .int('Debe ser un entero')
    .nonnegative('La existencia referencial no puede ser negativa')
    .nullable()
    .default(null),

  imagenes: z.array(imagenVarianteSchema).default([]),

  estado: estadoVarianteFormSchema,
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
