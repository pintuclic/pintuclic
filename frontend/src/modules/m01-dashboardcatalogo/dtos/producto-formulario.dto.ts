import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DEL FORMULARIO DE PRODUCTO (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/producto-formulario.dto.ts
 *
 * Reglas de RF-CAT-02-02 (marca + subcategoría; línea en pinturas),
 * RF-CAT-02-03 (clase de color obligatoria) y RF-CAT-02-05 (para publicar hace
 * falta al menos una imagen). Sincronizado 1:1 con `FormularioProducto`.
 * ==============================================================================
 */

export const estadoPublicacionSchema = z.enum(['borrador', 'publicado']);
export const claseColorSchema = z.enum(['entonable', 'colores_fijos', 'sin_color']);

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

const dineroOpcional = z
  .number({ invalid_type_error: 'Debe ser un número' })
  .nonnegative('No puede ser negativo')
  .nullable();

export const imagenProductoSchema = z.object({
  id: z.string(),
  url: z.string(),
  nombre: z.string(),
  esPrincipal: z.boolean(),
});

/**
 * Esquema base del formulario. Las validaciones cruzadas (color según clase,
 * imagen obligatoria para publicar) se aplican en `.superRefine`.
 */
export const productoFormularioSchema = z
  .object({
    nombre: requerido('El nombre del producto es obligatorio').max(150, 'Máximo 150 caracteres'),
    descripcion: z.string().trim().max(1000, 'Máximo 1000 caracteres').default(''),

    categoriaId: requerido('Selecciona una categoría'),
    subcategoriaId: requerido('Selecciona una subcategoría'),
    tipoProductoId: requerido('Selecciona el tipo de producto'),
    estado: estadoPublicacionSchema,

    marcaId: requerido('Selecciona una marca'),
    lineaId: z.string().trim().min(1).nullable().default(null),

    claseColor: claseColorSchema,
    colorPrincipalId: z.string().trim().min(1).nullable().default(null),
    codigoColor: z.string().trim().max(40, 'Máximo 40 caracteres').default(''),
    coloresDisponiblesIds: z.array(z.string()).default([]),

    imagenes: z.array(imagenProductoSchema).default([]),

    precioVenta: z
      .number({ required_error: 'El precio de venta es obligatorio', invalid_type_error: 'Debe ser un número' })
      .positive('El precio debe ser mayor a cero'),
    precioReferencia: dineroOpcional,
    sku: requerido('El SKU o código es obligatorio').max(40, 'Máximo 40 caracteres'),
    stockInicial: z
      .number({ required_error: 'El stock inicial es obligatorio', invalid_type_error: 'Debe ser un número' })
      .int('Debe ser un entero')
      .nonnegative('No puede ser negativo'),
    destacado: z.boolean().default(false),
    mostrarEnOfertas: z.boolean().default(false),
    permitirOpiniones: z.boolean().default(true),
    requiereEnvioEspecial: z.boolean().default(false),

    etiquetas: z.array(z.string().trim().min(1)).max(20, 'Máximo 20 etiquetas').default([]),
  })
  .superRefine((valor, ctx) => {
    // RF-CAT-02-03 / HU-CAT-05: un producto con color necesita color principal.
    if (valor.claseColor !== 'sin_color' && !valor.colorPrincipalId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['colorPrincipalId'],
        message: 'Define el color principal del producto',
      });
    }
    // RF-CAT-02-05: no se puede publicar sin al menos una imagen.
    if (valor.estado === 'publicado' && valor.imagenes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['imagenes'],
        message: 'Sube al menos una imagen para publicar el producto',
      });
    }
  });

export type ProductoFormularioDTO = z.infer<typeof productoFormularioSchema>;

/**
 * Valida el formulario y devuelve los errores como `Record<campo, mensaje>`
 * (mismo formato que consume `useCuentas` en m04).
 */
export function validarProductoFormulario(
  valor: unknown
): { valido: boolean; errores: Record<string, string> } {
  const resultado = productoFormularioSchema.safeParse(valor);
  if (resultado.success) return { valido: true, errores: {} };

  const errores: Record<string, string> = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path.join('.') || 'general';
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return { valido: false, errores };
}
