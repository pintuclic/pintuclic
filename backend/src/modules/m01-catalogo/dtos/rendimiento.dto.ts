import { z } from 'zod';

// ==============================================================================
// M01 - DTO DE RENDIMIENTO DEL PRODUCTO (Zod) — HU-CAT-10, RF-CAT-10-02/05
// Se admite ambos valores (fijar el rendimiento) o ambos null (limpiarlo);
// el mínimo debe ser > 0 y no superar al máximo.
// ==============================================================================

export const EstablecerRendimientoDto = z
  .object({
    rendimiento_min: z.number().positive('El rendimiento mínimo debe ser mayor que cero').nullable(),
    rendimiento_max: z.number().positive('El rendimiento máximo debe ser mayor que cero').nullable(),
  })
  .superRefine((d, ctx) => {
    const unoNulo = d.rendimiento_min === null || d.rendimiento_max === null;
    const ambosNulos = d.rendimiento_min === null && d.rendimiento_max === null;
    if (unoNulo && !ambosNulos) {
      ctx.addIssue({ code: 'custom', message: 'Debe indicar ambos valores de rendimiento o ninguno' });
      return;
    }
    if (d.rendimiento_min !== null && d.rendimiento_max !== null && d.rendimiento_min > d.rendimiento_max) {
      ctx.addIssue({ code: 'custom', message: 'El rendimiento mínimo no puede superar al máximo' });
    }
  });
export type EstablecerRendimientoDto = z.infer<typeof EstablecerRendimientoDto>;
