import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTOs DEL FORMULARIO DE PRODUCTO (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/producto-formulario.dto.ts
 *
 * Reglas de RF-CAT-02-02 (marca + al menos una subcategoría), RF-CAT-02-03
 * (clase de color obligatoria) y RF-CAT-02-05 (para publicar hace falta al
 * menos una imagen). Sincronizado 1:1 con `FormularioProducto`, que a su vez
 * refleja `CrearProductoDto` / `ActualizarProductoDto` del backend real.
 * ==============================================================================
 */

/**
 * Estado efectivo del producto. `inactivo` es un estado real (el backend expone
 * `/desactivar` y `/reactivar` como eje independiente de `/publicar`), no un
 * sinónimo de borrador.
 */
export const estadoPublicacionSchema = z.enum(['borrador', 'publicado', 'inactivo']);
export const claseColorSchema = z.enum(['entonable', 'colores_fijos', 'sin_color']);

/**
 * RF / `CrearImagenDto` del backend: la imagen viaja como data URL base64
 * (jpeg, png o webp) y no puede pesar más de 5MB. No hay subida multipart.
 */
export const FORMATOS_IMAGEN_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const PESO_MAXIMO_IMAGEN_BYTES = 5 * 1024 * 1024;

const DATA_URL_IMAGEN_REGEX = /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

/** Bytes reales que representa la parte base64 de una data URL. */
export function pesoDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const relleno = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - relleno);
}

/**
 * Valida una imagen de producto tal como la exige el backend: formato y peso.
 * Devuelve `null` si es válida, o el mensaje de error para mostrar en la galería.
 * Las URL remotas (imágenes ya almacenadas) no se revalidan aquí.
 */
export function validarImagenProducto(
  url: string,
  formatos: readonly string[] = FORMATOS_IMAGEN_PERMITIDOS,
  pesoMaximo: number = PESO_MAXIMO_IMAGEN_BYTES
): string | null {
  if (!url.startsWith('data:')) return null;
  if (!DATA_URL_IMAGEN_REGEX.test(url)) {
    return `La imagen debe estar en formato ${formatos.map((f) => f.replace('image/', '')).join(', ')}.`;
  }
  if (pesoDataUrlBytes(url) > pesoMaximo) {
    return `La imagen no puede pesar más de ${pesoMaximo / (1024 * 1024)}MB.`;
  }
  return null;
}

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

/**
 * Para selects que empiezan sin selección (valor `null`, no `undefined`):
 * `z.string()` a secas reporta "Expected string, received null" en vez del
 * mensaje de campo obligatorio, porque `required_error` solo aplica a
 * `undefined`.
 */
const requeridoNullable = (mensaje: string) =>
  z
    .string()
    .nullable()
    .refine((v): v is string => v !== null && v.trim().length > 0, { message: mensaje });

/**
 * Imagen del producto (`CrearImagenDto`: `imagen` como data URL base64 de
 * jpeg/png/webp ≤ 5MB, `orden` y `es_principal`). `url` acepta tanto una data
 * URL recién capturada como la URL ya almacenada de una imagen existente.
 */
export const imagenProductoSchema = z.object({
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

/**
 * Esquema base del formulario. Las validaciones cruzadas (color según clase,
 * imagen obligatoria para publicar) se aplican en `.superRefine`.
 */
export const productoFormularioSchema = z
  .object({
    nombre: requerido('El nombre del producto es obligatorio').max(150, 'Máximo 150 caracteres'),
    descripcion: z.string().trim().max(5000, 'Máximo 5000 caracteres').default(''),

    subcategoriasIds: z
      .array(z.string())
      .min(1, 'El producto debe pertenecer al menos a una subcategoría')
      .refine((ids) => new Set(ids).size === ids.length, { message: 'Hay subcategorías repetidas' }),
    categoriaComplementariaId: z.string().trim().min(1).nullable().default(null),
    estado: estadoPublicacionSchema,

    marcaId: requeridoNullable('Selecciona una marca'),
    lineaId: z.string().trim().min(1).nullable().default(null),
    tipoResinaId: z.string().trim().min(1).nullable().default(null),

    claseColor: claseColorSchema,
    colorPrincipalId: z.string().trim().min(1).nullable().default(null),
    codigoColor: z.string().trim().max(40, 'Máximo 40 caracteres').default(''),
    coloresDisponiblesIds: z.array(z.string()).default([]),

    imagenes: z.array(imagenProductoSchema).default([]),

    patrocinado: z.boolean().default(false),
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
