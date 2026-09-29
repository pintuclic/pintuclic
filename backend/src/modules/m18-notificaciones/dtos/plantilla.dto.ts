import { z } from 'zod';

// ==============================================================================
// M18 - DTOs DE PLANTILLAS DE COMUNICACIÓN (HU-NOT-03)
// Validación y sanitización de peticiones con Zod
// ==============================================================================

/**
 * Esquema de validación para actualizar el contenido de una plantilla (RF-NOT-03-01).
 */
export const ActualizarPlantillaSchema = z.object({
  asunto: z
    .string()
    .trim()
    .min(3, 'El asunto debe tener al menos 3 caracteres')
    .max(200, 'El asunto no puede exceder 200 caracteres'),
  cuerpoHtml: z
    .string()
    .trim()
    .min(10, 'El cuerpo HTML debe tener al menos 10 caracteres'),
  cuerpoTexto: z
    .string()
    .trim()
    .optional(),
});

export type ActualizarPlantillaDto = z.infer<typeof ActualizarPlantillaSchema>;

/**
 * Esquema para solicitar la previsualización de una plantilla (RF-NOT-03-03).
 */
export const PrevisualizarPlantillaSchema = z.object({
  asunto: z.string().trim().optional(),
  cuerpoHtml: z.string().trim().optional(),
  cuerpoTexto: z.string().trim().optional(),
  variables: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .optional()
    .default({}),
});

export type PrevisualizarPlantillaDto = z.infer<typeof PrevisualizarPlantillaSchema>;

/**
 * Parámetro de ruta para identificar una plantilla por su código identificador.
 */
export const PlantillaParamSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, 'Código de plantilla inválido')
    .regex(/^[a-z0-9_-]+$/, 'El código solo admite letras minúsculas, números, guiones y guiones bajos'),
});

export type PlantillaParamDto = z.infer<typeof PlantillaParamSchema>;
