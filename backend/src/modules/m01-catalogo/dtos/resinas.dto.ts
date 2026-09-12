import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE TIPO DE RESINA (Zod)
// Catálogo administrable de tipos de resina (RF-CAT-02-04).
// ==============================================================================

const nombreResinaSchema = z
  .string()
  .trim()
  .min(1, 'El nombre del tipo de resina es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

export const CrearTipoResinaDto = z.object({ nombre: nombreResinaSchema });
export type CrearTipoResinaDto = z.infer<typeof CrearTipoResinaDto>;

export const ActualizarTipoResinaDto = z.object({ nombre: nombreResinaSchema });
export type ActualizarTipoResinaDto = z.infer<typeof ActualizarTipoResinaDto>;
