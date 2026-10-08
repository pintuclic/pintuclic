import { z } from 'zod';

// ==============================================================================
// M05 - DTO: Parámetro de ruta :idLinea (HU-CAR-02)
// ==============================================================================

/** Máximo de una columna INT de PostgreSQL (SERIAL de `linea_carrito`). */
const ID_MAXIMO = 2_147_483_647;

/**
 * Identificador de línea en la URL. Solo dígitos, sin signo, sin ceros a la izquierda ni
 * notación científica, y dentro del rango INT. El controlador responde a un valor ilegible
 * como recurso inexistente (404), igual que M08 (RF-SEG-03-05).
 */
export const idLineaParamSchema = z.object({
  idLinea: z
    .string()
    .regex(/^[1-9]\d{0,9}$/, 'El identificador de línea debe ser un entero positivo')
    .transform(Number)
    .refine((id) => id <= ID_MAXIMO, 'El identificador de línea está fuera de rango'),
});

export type IdLineaParamDTO = z.infer<typeof idLineaParamSchema>;
