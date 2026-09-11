import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTO DEL FORMULARIO DE LÍNEA COMERCIAL (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/linea-formulario.dto.ts
 *
 * RF-CAT-11: nombre, descripción y marca obligatorios. Sincronizado 1:1 con
 * `FormularioLinea`. Prohibido declarar este esquema inline en la vista (.vue).
 * ==============================================================================
 */

export const estadoLineaFormSchema = z.enum(['activa', 'inactiva', 'pausada']);

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

export const lineaFormularioSchema = z.object({
  nombre: requerido('El nombre de la línea es obligatorio')
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(80, 'Máximo 80 caracteres'),
  descripcion: requerido('La descripción es obligatoria').max(1000, 'Máximo 1000 caracteres'),
  imagenUrl: z.string().nullable().default(null),

  marca: requerido('Selecciona la marca a la que pertenece la línea'),
  categoria: requerido('Selecciona la categoría de uso'),
  subcategoria: z.string().trim().default(''),
  tipoLinea: z.string().trim().default(''),

  estado: estadoLineaFormSchema.default('activa'),
  mostrarEnCatalogo: z.boolean().default(true),
  mostrarEnFiltros: z.boolean().default(true),
  destacarEnPortada: z.boolean().default(false),

  productosAsociados: z.array(z.string()).default([]),

  etiquetas: z.array(z.string().trim().min(1)).max(20, 'Máximo 20 etiquetas').default([]),

  notasInternas: z.string().trim().max(500, 'Máximo 500 caracteres').default(''),
});

export type LineaFormularioDTO = z.infer<typeof lineaFormularioSchema>;

/**
 * Valida el formulario y devuelve los errores como `Record<campo, mensaje>`
 * (mismo formato que el resto del módulo).
 */
export function validarLineaFormulario(
  valor: unknown
): { valido: boolean; errores: Record<string, string> } {
  const resultado = lineaFormularioSchema.safeParse(valor);
  if (resultado.success) return { valido: true, errores: {} };

  const errores: Record<string, string> = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path.join('.') || 'general';
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return { valido: false, errores };
}
