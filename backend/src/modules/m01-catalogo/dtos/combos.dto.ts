import { z } from 'zod';

// ==============================================================================
// M01 - DTO DE COMBOS (Zod) — HU-CAT-13
// ==============================================================================

const ComponenteComboSchema = z.object({
  id_variante: z.number().int().positive('Debe indicar la variante del componente'),
  cantidad: z.number().int().positive('La cantidad del componente debe ser mayor que cero'),
});

/**
 * RF-CAT-13-01 / CA-CAT-13-02: el combo puede guardarse sin declarar de qué se
 * compone; si se declaran componentes, cada variante aparece una sola vez. Puede
 * marcarse excluido de descuentos (CA-CAT-13-09).
 */
export const DefinirComboDto = z.object({
  excluido_descuentos: z.boolean().default(false),
  componentes: z
    .array(ComponenteComboSchema)
    .default([])
    .refine(
      (componentes) => new Set(componentes.map((c) => c.id_variante)).size === componentes.length,
      'Una variante no puede repetirse entre los componentes del combo'
    ),
});
export type DefinirComboDto = z.infer<typeof DefinirComboDto>;
