import { z } from 'zod';
import { hexSchema } from './color-formulario.dto';

/**
 * ==============================================================================
 * M01 - DTO DE CARGA MASIVA DE COLORES (RF-CAT-05-03)
 * Ubicación: src/modules/m01-dashboardcatalogo/dtos/colores-carga-masiva.dto.ts
 *
 * Cada fila del CSV reutiliza las mismas reglas que el alta individual
 * (`color-formulario.dto.ts`): nombre y familia obligatorios, HEX válido.
 * `codigo` y `marca` son de texto libre porque el CSV no ofrece un selector.
 * ==============================================================================
 */

export const filaCargaMasivaColorSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre es obligatorio' })
    .trim()
    .min(1, 'El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  codigo: z.string().trim().max(60, 'Máximo 60 caracteres').default(''),
  marca: z.string().trim().max(100, 'Máximo 100 caracteres').default(''),
  familiaClave: z
    .string({ required_error: 'La familia cromática es obligatoria' })
    .trim()
    .min(1, 'La familia cromática es obligatoria'),
  hex: hexSchema,
});

export type FilaCargaMasivaColorDTO = z.infer<typeof filaCargaMasivaColorSchema>;

/** Encabezados esperados del CSV, en este orden. */
export const ENCABEZADOS_CARGA_MASIVA_COLORES = [
  'nombre',
  'codigo',
  'marca',
  'familiaClave',
  'hex',
] as const;

export interface FilaCargaMasivaValidada {
  numeroFila: number;
  datos: Record<string, string>;
  valido: boolean;
  errores: Record<string, string>;
}

/** Valida cada fila ya parseada del CSV y devuelve el detalle fila a fila. */
export function validarFilasCargaMasivaColores(
  filas: Record<string, string>[]
): FilaCargaMasivaValidada[] {
  return filas.map((datos, i) => {
    const resultado = filaCargaMasivaColorSchema.safeParse(datos);
    if (resultado.success) {
      return { numeroFila: i + 1, datos, valido: true, errores: {} };
    }
    const errores: Record<string, string> = {};
    for (const issue of resultado.error.issues) {
      const campo = issue.path.join('.') || 'general';
      if (!errores[campo]) errores[campo] = issue.message;
    }
    return { numeroFila: i + 1, datos, valido: false, errores };
  });
}
