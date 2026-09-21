import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTO DEL FORMULARIO DE LÍNEA COMERCIAL (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/linea-formulario.dto.ts
 *
 * RF-CAT-11-01: nombre y marca obligatorios; la gama comercial es un dato
 * descriptivo opcional. Sincronizado 1:1 con `FormularioLinea`, que a su vez
 * refleja `CrearLineaDto` del backend real. Prohibido declarar este esquema
 * inline en la vista (.vue).
 * ==============================================================================
 */

export const estadoLineaFormSchema = z.enum(['activa', 'inactiva', 'pausada']);

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

export const lineaFormularioSchema = z.object({
  nombre: requerido('El nombre de la línea es obligatorio').max(100, 'Máximo 100 caracteres'),
  marcaId: requerido('Selecciona la marca a la que pertenece la línea'),
  gamaComercial: z.string().trim().max(100, 'Máximo 100 caracteres').default(''),
  estado: estadoLineaFormSchema.default('activa'),
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
