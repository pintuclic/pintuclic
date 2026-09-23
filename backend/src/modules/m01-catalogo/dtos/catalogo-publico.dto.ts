import { z } from 'zod';

export const IdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const ListarProductosQuerySchema = z.object({
  subcategoria: z.coerce.number().int().positive().optional(),
  q: z.string().trim().min(1).optional(),
  pagina: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().positive().max(100).optional(),
});
export type ListarProductosQuerySchema = z.infer<typeof ListarProductosQuerySchema>;

export const PaginaColoresQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  familia: z.string().trim().min(1).optional(),
  pagina: z.coerce.number().int().positive().optional(),
  limite: z.coerce.number().int().positive().max(500).optional(),
});
export type PaginaColoresQuerySchema = z.infer<typeof PaginaColoresQuerySchema>;
