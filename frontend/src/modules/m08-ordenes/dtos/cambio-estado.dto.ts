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
 * opcional) y reúne en un solo sitio cuándo el motivo deja de serlo. Avisar aquí
 * evita que el servidor rechace la operación después de haberla intentado.
 * ==============================================================================
 */

/**
 * Estados que no se pueden aplicar sin justificar.
 *
 * Dos orígenes distintos:
 *
 * 1. **El backend lo exige.** Volver de «Preparada» a «En preparación» responde
 *    `400 MOTIVO_REQUERIDO` si el motivo llega vacío (`requiereMotivo` en
 *    `ciclo-estados.ts`, y el «volver con motivo» del diagrama oficial). Hoy es el
 *    único caso que puede darse, porque cancelar y devolver están bloqueados.
 * 2. **Lo exige la interfaz.** Cancelar y devolver son las dos decisiones que el
 *    cliente ve reflejadas, y conviene poder justificarlas. El backend las acepta sin
 *    motivo, pero aquí se piden igual. Se activará cuando M11 habilite esas
 *    transiciones.
 */
export const ESTADOS_QUE_EXIGEN_MOTIVO = ['cancelado', 'devuelto'] as const;

/** Retroceso que el backend rechaza sin motivo (CA-ORD-05-08, D01). */
export function esRetrocesoConMotivo(desde: string, hacia: string): boolean {
  return desde === 'preparada' && hacia === 'en_preparacion';
}

export const CambioEstadoDto = z
  .object({
    estado: z.string().min(1, 'Elige el nuevo estado de la orden.'),
    /** Estado de partida: hace falta para saber si la transición es un retroceso. */
    estadoActual: z.string().optional(),
    motivo: z
      .string()
      .trim()
      .max(500, 'El motivo no puede superar 500 caracteres.')
      .optional()
      .default(''),
  })
  .refine((v) => !exigeMotivo(v.estado, v.estadoActual) || (v.motivo ?? '').trim() !== '', {
    path: ['motivo'],
    message: 'Indica el motivo para dejar constancia de esta decisión.',
  });

export type CambioEstadoDto = z.infer<typeof CambioEstadoDto>;

/**
 * `true` si la transición obliga a escribir un motivo. Sirve para rotular el campo
 * antes de enviar, en lugar de dejar que el servidor rechace la operación.
 */
export function exigeMotivo(estado: string, estadoActual?: string): boolean {
  if ((ESTADOS_QUE_EXIGEN_MOTIVO as readonly string[]).includes(estado)) return true;
  return estadoActual !== undefined && esRetrocesoConMotivo(estadoActual, estado);
}
