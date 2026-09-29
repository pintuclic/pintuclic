import { z } from 'zod';

// ==============================================================================
// M01 - DTO DE ASIGNACIÓN DE BASE A PRODUCTO (Zod) — HU-CAT-12 flujo 2
// ==============================================================================

export const AsignarBaseDto = z.object({
  id_base: z.number().int().positive('Debe indicar la base a asignar'),
});
export type AsignarBaseDto = z.infer<typeof AsignarBaseDto>;
