import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTO DEL FORMULARIO DE CATEGORÍA / SUBCATEGORÍA (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/categoria-formulario.dto.ts
 *
 * RF-CAT-01: nombre ≤ 100 obligatorio en ambos niveles, orden opcional y
 * padre obligatorio cuando el tipo es subcategoría. Sincronizado 1:1 con
 * `FormularioCategoria`, que a su vez refleja `CrearCategoriaDto` /
 * `CrearSubcategoriaDto` del backend real.
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

    padreId: z.string().trim().min(1).nullable().default(null),
    estado: estadoCategoriaSchema,
    // Campo opcional en la UI: dejarlo vacío entrega `null` desde el `Input`
    // del Core y equivale a 0 (el backend lo trata como "sin orden explícito").
    ordenVisualizacion: z
      .number({ invalid_type_error: 'Debe ser un número' })
      .int('Debe ser un entero')
      .nonnegative('No puede ser negativo')
      .nullable()
      .default(0)
      .transform((v) => v ?? 0),
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
