import { z } from 'zod';

// ==============================================================================
// M17 - DTOs DE PARÁMETROS DEL SISTEMA (Zod v4)
// Validacion de entradas HTTP para lectura y actualizacion de configuracion.
// ==============================================================================

/**
 * DTO de actualizacion de un parametro del sistema (RF-ADM-06).
 * Los rangos admitidos por clave se validan en el servicio, no aqui.
 */
export const ActualizarParametroDto = z.object({
  clave: z
    .string()
    .min(1, 'La clave del parametro no puede estar vacia')
    .max(100)
    .trim(),

  valor: z.union([
    z.string().max(500),
    z.number(),
    z.boolean(),
  ]),
});

export type ActualizarParametroDto = z.infer<typeof ActualizarParametroDto>;
