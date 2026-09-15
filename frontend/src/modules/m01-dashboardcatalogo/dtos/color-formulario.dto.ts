import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTO DEL FORMULARIO DE COLOR (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/color-formulario.dto.ts
 *
 * RF-CAT-05-01/02: nombre comercial obligatorio y valor cromático obligatorio y
 * válido. Sincronizado 1:1 con `FormularioColor`.
 * ==============================================================================
 */

export const estadoColorFormSchema = z.enum(['publicado', 'borrador']);
export const politicaProductoColorSchema = z.enum(['todos', 'especificos', 'personalizadas']);

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

/** HEX de 3 o 6 dígitos, con almohadilla (p. ej. #FFC928). */
export const hexSchema = requerido('El código HEX es obligatorio').regex(
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
  'Usa un HEX válido, p. ej. #FFC928'
);

export const colorFormularioSchema = z.object({
  nombre: requerido('El nombre del color es obligatorio').max(100, 'Máximo 100 caracteres'),
  nombreCorto: z.string().trim().max(40, 'Máximo 40 caracteres').default(''),
  descripcion: z.string().trim().max(500, 'Máximo 500 caracteres').default(''),
  familiaClave: requerido('Selecciona la familia cromática'),

  hex: hexSchema,

  estado: estadoColorFormSchema.default('publicado'),
  mostrarEnTienda: z.boolean().default(true),
  incluirEnBuscador: z.boolean().default(true),

  basesCompatibles: z.array(z.string()).min(1, 'Selecciona al menos una base compatible'),
  politicaProductos: politicaProductoColorSchema.default('todos'),

  tituloSeo: z.string().trim().max(60, 'Máximo 60 caracteres').default(''),
  metaDescripcion: z.string().trim().max(160, 'Máximo 160 caracteres').default(''),
  etiquetas: z.array(z.string().trim().min(1)).max(20, 'Máximo 20 etiquetas').default([]),

  notasInternas: z.string().trim().max(1000, 'Máximo 1000 caracteres').default(''),
});

export type ColorFormularioDTO = z.infer<typeof colorFormularioSchema>;

/** Convierte un HEX (#RRGGBB o #RGB) a componentes RGB; null si es inválido. */
export function hexARgb(hex: string): { r: number; g: number; b: number } | null {
  const limpio = hex.trim().replace('#', '');
  const full = limpio.length === 3 ? limpio.split('').map((c) => c + c).join('') : limpio;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function validarColorFormulario(
  valor: unknown
): { valido: boolean; errores: Record<string, string> } {
  const resultado = colorFormularioSchema.safeParse(valor);
  if (resultado.success) return { valido: true, errores: {} };

  const errores: Record<string, string> = {};
  for (const issue of resultado.error.issues) {
    const campo = issue.path.join('.') || 'general';
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return { valido: false, errores };
}
