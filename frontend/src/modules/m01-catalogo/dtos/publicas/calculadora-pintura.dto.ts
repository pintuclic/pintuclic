import { z } from 'zod';

export const calculadoraPinturaSchema = z.object({
  superficie: z.enum(['paredes', 'techos', 'puertas', 'muebles']),
  ancho: z.number().positive().max(100),
  alto: z.number().positive().max(100),
  cantidad: z.number().int().min(1).max(50),
});

export type CalculadoraPinturaDTO = z.infer<typeof calculadoraPinturaSchema>;
