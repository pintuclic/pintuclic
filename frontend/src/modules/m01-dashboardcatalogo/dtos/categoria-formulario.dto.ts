import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTO DEL FORMULARIO DE CATEGORÍA / SUBCATEGORÍA (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/categoria-formulario.dto.ts
 *
 * RF-CAT-01: nombre ≤ 100 obligatorio en ambos niveles, slug con formato de URL
 * y padre obligatorio cuando el tipo es subcategoría. Sincronizado 1:1 con
 * `FormularioCategoria`.
 * ==============================================================================
 */

export const tipoCategoriaSchema = z.enum(['categoria', 'subcategoria']);
export const estadoCategoriaSchema = z.enum(['publicado', 'inactivo']);

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

export const categoriaFormularioSchema = z
  .object({
    tipo: tipoCategoriaSchema,
    nombre: requerido('El nombre es obligatorio').max(100, 'Máximo 100 caracteres'),
    slug: requerido('El código / slug es obligatorio')
      .max(80, 'Máximo 80 caracteres')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones'),
    descripcion: requerido('La descripción es obligatoria').max(1000, 'Máximo 1000 caracteres'),
    iconoUrl: z.string().nullable().default(null),

    padreId: z.string().trim().min(1).nullable().default(null),
    estado: estadoCategoriaSchema,
    ordenVisualizacion: z
      .number({ invalid_type_error: 'Debe ser un número' })
      .int('Debe ser un entero')
      .nonnegative('No puede ser negativo')
      .default(1),

    filtros: z.array(z.string()).default([]),
    lineas: z.array(z.string()).default([]),

    tituloSeo: z.string().trim().max(60, 'Máximo 60 caracteres').default(''),
    metaDescripcion: z.string().trim().max(160, 'Máximo 160 caracteres').default(''),
    etiquetas: z.array(z.string().trim().min(1)).max(20, 'Máximo 20 etiquetas').default([]),
    notas: z.string().trim().max(500, 'Máximo 500 caracteres').default(''),
  })
  .superRefine((valor, ctx) => {
    // RF-CAT-01-02: la subcategoría necesita categoría padre.
    if (valor.tipo === 'subcategoria' && !valor.padreId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['padreId'],
        message: 'Selecciona la categoría padre',
      });
    }
  });

export type CategoriaFormularioDTO = z.infer<typeof categoriaFormularioSchema>;

/**
 * Valida el formulario y devuelve los errores como `Record<campo, mensaje>`
 * (mismo formato que el resto del módulo).
 */
export function validarCategoriaFormulario(
  valor: unknown
): { valido: boolean; errores: Record<string, string> } {
  const resultado = categoriaFormularioSchema.safeParse(valor);
  if (resultado.success) return { valido: true, errores: {} };

  const errores: Record<string, string> = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path.join('.') || 'general';
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return { valido: false, errores };
}

/** Deriva un slug a partir del nombre (para autocompletar mientras se escribe). */
export function slugificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
