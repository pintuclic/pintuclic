import { z } from 'zod';

/**
 * ==============================================================================
 * M01 - DTO DEL FORMULARIO DE COLOR (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/color-formulario.dto.ts
 *
 * Sincronizado con `CrearColorDto` / `ActualizarColorDto` del backend real
 * (backend/src/modules/m01-catalogo/dtos/colores.dto.ts).
 * RF-CAT-05-01: nombre obligatorio (máx. 100), marca obligatoria, código
 * opcional (máx. 60).
 * RF-CAT-05-02: valor cromático CIELAB obligatorio; en la UI se captura como
 * HEX y el CIELAB se deriva de él (`composables/useColorCielab.ts`).
 * RF-CAT-05-03: familia cromática administrable.
 * Prohibido declarar este esquema inline en la vista (.vue).
 * ==============================================================================
 */

export const estadoColorFormSchema = z.enum(['publicado', 'borrador']);

const requerido = (mensaje: string) =>
  z.string({ required_error: mensaje }).trim().min(1, mensaje);

/** HEX de 3 o 6 dígitos, con almohadilla (p. ej. #FFC928). */
export const hexSchema = requerido('El código HEX es obligatorio').regex(
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/,
  'Usa un HEX válido, p. ej. #FFC928'
);

/** Rangos estándar del espacio CIELAB, idénticos a los del backend. */
export const cielabSchema = z.object({
  l: z.number().min(0, 'L* debe ser ≥ 0').max(100, 'L* debe ser ≤ 100'),
  a: z.number().min(-128, 'a* debe ser ≥ -128').max(128, 'a* debe ser ≤ 128'),
  b: z.number().min(-128, 'b* debe ser ≥ -128').max(128, 'b* debe ser ≤ 128'),
});

export const colorFormularioSchema = z.object({
  nombre: requerido('El nombre del color es obligatorio').max(100, 'Máximo 100 caracteres'),
  marcaId: requerido('Selecciona la marca a la que pertenece el color'),
  codigo: z.string().trim().max(60, 'Máximo 60 caracteres').default(''),
  familiaClave: requerido('Selecciona la familia cromática'),

  hex: hexSchema,

  estado: estadoColorFormSchema.default('publicado'),
});

export type ColorFormularioDTO = z.infer<typeof colorFormularioSchema>;

/** Payload que viaja al backend: `cielab` en lugar de `hex`, `codigo` omitido si va vacío. */
export const colorPayloadSchema = z.object({
  nombre: requerido('El nombre del color es obligatorio').max(100, 'Máximo 100 caracteres'),
  marcaId: requerido('Selecciona la marca a la que pertenece el color'),
  codigo: z.string().trim().min(1).max(60, 'Máximo 60 caracteres').optional(),
  cielab: cielabSchema,
  familiaClave: requerido('Selecciona la familia cromática'),
  estado: estadoColorFormSchema,
});

export type ColorPayloadDTO = z.infer<typeof colorPayloadSchema>;

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
