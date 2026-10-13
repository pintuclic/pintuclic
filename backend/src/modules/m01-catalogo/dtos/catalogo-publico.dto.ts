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

/** RNF-CAT-07-01: tamaño de la imagen pública; por defecto, la versión optimizada. */
export const ImagenPublicaQuerySchema = z.object({
  tamano: z.enum(['miniatura', 'optimizada', 'original']).default('optimizada'),
});
export type ImagenPublicaQuerySchema = z.infer<typeof ImagenPublicaQuerySchema>;

/** RF-CAT-12-05 / RF-CAT-12-07: el cliente elige color y presentación, nunca la base. */
export const EntonadoQuerySchema = z.object({
  id_color: z.coerce.number().int().positive(),
  id_presentacion: z.coerce.number().int().positive(),
});
export type EntonadoQuerySchema = z.infer<typeof EntonadoQuerySchema>;
