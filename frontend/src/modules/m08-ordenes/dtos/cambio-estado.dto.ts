import { z } from 'zod';

/**
 * ==============================================================================
 * M08 - VALIDACIÓN DEL CAMBIO DE ESTADO (HU-ORD-03)
 * Ubicación: src/modules/m08-ordenes/dtos/cambio-estado.dto.ts
 *
 * Vive aquí y no dentro del `.vue` porque la Directiva 12 prohíbe declarar
 * esquemas Zod inline en componentes o vistas.
 *
 * Espeja al `CambiarEstadoDto` del backend (máximo 500 caracteres, motivo
 * opcional) y añade UNA regla propia de la interfaz: cancelar o devolver exige
 * motivo. El backend lo acepta vacío, pero son las dos únicas decisiones que el
 * cliente ve reflejadas, así que conviene obligar a dejar constancia. Si alguna
 * vez el backend endurece la regla, este archivo es el único punto a tocar.
 * ==============================================================================
 */

/** Estados que, desde la interfaz, no se pueden aplicar sin justificar. */
export const ESTADOS_QUE_EXIGEN_MOTIVO = ['cancelado', 'devuelto'] as const;

export const CambioEstadoDto = z
  .object({
    estado: z.string().min(1, 'Elige el nuevo estado de la orden.'),
    motivo: z
      .string()
      .trim()
      .max(500, 'El motivo no puede superar 500 caracteres.')
      .optional()
      .default(''),
  })
  .refine(
    (v) =>
      !(ESTADOS_QUE_EXIGEN_MOTIVO as readonly string[]).includes(v.estado) ||
      (v.motivo ?? '').trim() !== '',
    {
      path: ['motivo'],
      message: 'Indica el motivo para dejar constancia de esta decisión.',
    }
  );

export type CambioEstadoDto = z.infer<typeof CambioEstadoDto>;

/** `true` si ese estado obliga a escribir un motivo (sirve para rotular el campo). */
export function exigeMotivo(estado: string): boolean {
  return (ESTADOS_QUE_EXIGEN_MOTIVO as readonly string[]).includes(estado);
}
