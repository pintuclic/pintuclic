import { z } from 'zod';

// ==============================================================================
// M05 - DTO: Agregar ítem al carrito (HU-CAR-01 / HU-CAR-02)
// Valida id_variante y cantidad antes de ejecutar la lógica de negocio
// ==============================================================================

/**
 * DTO para agregar una variante al carrito (RF-CAR-01-01 / RF-CAR-02-0X).
 * Si la variante ya existe en el carrito, el servicio acumulará la cantidad
 * en vez de crear una línea duplicada (constraint uq_carrito_variante).
 */
export const agregarItemSchema = z.object({
  id_variante: z
    .number({ error: 'El identificador de variante debe ser un número entero positivo' })
    .int('El identificador de variante debe ser un número entero')
    .positive('El identificador de variante debe ser mayor a 0'),

  cantidad: z
    .number({ error: 'La cantidad debe ser un número entero' })
    .int('La cantidad debe ser un número entero')
    .min(1, 'La cantidad mínima por línea es 1')
    .max(999, 'La cantidad máxima por línea es 999'),
});

export type AgregarItemDTO = z.infer<typeof agregarItemSchema>;
