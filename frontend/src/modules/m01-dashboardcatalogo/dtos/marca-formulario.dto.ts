import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTO DEL FORMULARIO DE MARCA (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/marca-formulario.dto.ts
 *
 * RF-CAT-04-01/02: nombre y logotipo obligatorios; unicidad de nombre validada
 * en el servidor. Sincronizado 1:1 con `FormularioMarca`, que a su vez refleja
 * `CrearMarcaDto` del backend real (nombre máx. 100 caracteres).
 * ==============================================================================
 */

export const estadoMarcaFormSchema = z.enum(['activa', 'inactiva']);

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

export const marcaFormularioSchema = z.object({
  nombre: requerido('El nombre de la marca es obligatorio').max(100, 'Máximo 100 caracteres'),
  // `logoUrl` empieza en `null` (sin logo cargado); no puede validarse con
  // z.string() a secas porque Zod reporta "Expected string, received null"
  // en vez del mensaje de campo obligatorio.
  logoUrl: z
    .string()
    .nullable()
    .refine((v): v is string => v !== null && v.trim().length > 0, {
      message: 'El logotipo de la marca es obligatorio',
    }),
  estado: estadoMarcaFormSchema,
});

export type MarcaFormularioDTO = z.infer<typeof marcaFormularioSchema>;

/**
 * Valida el formulario y devuelve los errores como `Record<campo, mensaje>`
 * (mismo formato que el resto del módulo).
 */
export function validarMarcaFormulario(
  valor: unknown
): { valido: boolean; errores: Record<string, string> } {
  const resultado = marcaFormularioSchema.safeParse(valor);
  if (resultado.success) return { valido: true, errores: {} };

  const errores: Record<string, string> = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path.join('.') || 'general';
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return { valido: false, errores };
}
