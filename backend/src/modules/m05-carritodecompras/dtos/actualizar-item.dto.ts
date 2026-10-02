import { z } from 'zod';

// ==============================================================================
// M05 - DTO: Actualizar cantidad de una línea del carrito (HU-CAR-02)
// ==============================================================================

/**
 * DTO para modificar la cantidad de un ítem ya existente en el carrito
 * (RF-CAR-02-07 / HU-CAR-02: sumar, restar o reemplazar cantidad).
 * Si la nueva cantidad es 0, el servicio interpretará la operación como
 * eliminación de la línea (comportamiento definido en la capa de servicio).
 */
export const actualizarItemSchema = z.object({
  cantidad: z
    .number({ error: 'La cantidad debe ser un número entero' })
    .int('La cantidad debe ser un número entero')
    .min(0, 'La cantidad no puede ser negativa')
    .max(999, 'La cantidad máxima por línea es 999'),
});

export type ActualizarItemDTO = z.infer<typeof actualizarItemSchema>;
