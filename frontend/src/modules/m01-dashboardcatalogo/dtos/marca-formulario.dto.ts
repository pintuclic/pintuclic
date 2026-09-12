import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTO DEL FORMULARIO DE MARCA (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/marca-formulario.dto.ts
 *
 * RF-CAT-04-01/02: nombre y logotipo obligatorios; unicidad de nombre validada
 * en el servidor. Sincronizado 1:1 con `FormularioMarca`.
 * ==============================================================================
 */

export const estadoMarcaFormSchema = z.enum(['activa', 'inactiva']);

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

const urlOpcional = z
  .string()
  .trim()
  .max(200, 'Máximo 200 caracteres')
  .refine((v) => v === '' || /^https?:\/\/.+/.test(v), 'Debe ser una URL válida (http/https)')
  .default('');

export const marcaFormularioSchema = z.object({
  nombre: requerido('El nombre de la marca es obligatorio')
    .min(2, 'Debe tener al menos 2 caracteres')
    .max(80, 'Máximo 80 caracteres'),
  descripcion: requerido('La descripción es obligatoria').max(1000, 'Máximo 1000 caracteres'),
  logoUrl: requerido('El logo principal es obligatorio'),

  sitioWeb: urlOpcional,
  paisOrigen: z.string().trim().max(60).default(''),
  contactoEmail: z
    .string()
    .trim()
    .max(120)
    .refine((v) => v === '' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Correo no válido')
    .default(''),
  telefono: z.string().trim().max(40).default(''),

  lineas: z.array(z.string()).default([]),
  politicaColor: z.string().trim().default('todos'),
  basesCompatibles: z.array(z.string()).default([]),

  tituloSeo: z.string().trim().max(60, 'Máximo 60 caracteres').default(''),
  descripcionSeo: z.string().trim().max(160, 'Máximo 160 caracteres').default(''),
  etiquetas: z.array(z.string().trim().min(1)).max(20, 'Máximo 20 etiquetas').default([]),

  notasInternas: z.string().trim().max(500, 'Máximo 500 caracteres').default(''),
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
