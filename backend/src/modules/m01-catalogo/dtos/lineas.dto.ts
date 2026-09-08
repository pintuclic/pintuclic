import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE LÍNEAS COMERCIALES (Zod)
// Validación de entradas HTTP para HU-CAT-11.
// ==============================================================================

const nombreLineaSchema = z
  .string()
  .trim()
  .min(1, 'El nombre de la línea es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

const gamaComercialSchema = z.string().trim().max(100).optional();

/** RF-CAT-11-01: exige nombre y marca; la gama comercial es un dato descriptivo opcional. */
export const CrearLineaDto = z.object({
  nombre: nombreLineaSchema,
  id_marca: z.number().int().positive('Debe indicar la marca a la que pertenece la línea'),
  gama_comercial: gamaComercialSchema,
});
export type CrearLineaDto = z.infer<typeof CrearLineaDto>;

export const ActualizarLineaDto = z
  .object({
    nombre: nombreLineaSchema.optional(),
    gama_comercial: gamaComercialSchema,
  })
  .refine((data) => data.nombre !== undefined || data.gama_comercial !== undefined, {
    message: 'Debe indicar al menos un dato a actualizar',
  });
export type ActualizarLineaDto = z.infer<typeof ActualizarLineaDto>;

/**
 * RF-CAT-11-03: primero se informa el impacto sin `confirmar` (productos y reglas
 * comerciales de M06 que dependen de la línea), y solo se desactiva al confirmar.
 */
export const DesactivarLineaDto = z.object({
  confirmar: z.boolean().optional().default(false),
});
export type DesactivarLineaDto = z.infer<typeof DesactivarLineaDto>;
