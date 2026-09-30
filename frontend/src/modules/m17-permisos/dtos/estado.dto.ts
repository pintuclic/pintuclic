import { z } from 'zod';
export const cambioEstadoSchema = z.object({
  active: z.boolean(),
  reason: z.string().trim().max(500),
}).refine(data => !data.active || data.reason.length >= 10, {
  message: 'Describe el motivo (mínimo 10 caracteres).', path: ['reason'],
});
