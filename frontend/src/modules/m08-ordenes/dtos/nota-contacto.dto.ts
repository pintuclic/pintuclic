import { z } from 'zod';

/**
 * ==============================================================================
 * M08 - VALIDACIÓN DE NOTAS INTERNAS Y CONTACTOS (HU-ORD-10, CA-ORD-09-03)
 * Ubicación: src/modules/m08-ordenes/dtos/nota-contacto.dto.ts
 *
 * Espejan los DTO del backend (`CrearNotaDto` y `RegistrarContactoDto`) para avisar
 * al personal antes de enviar, no para sustituir su validación: la autoridad sigue
 * siendo el servidor.
 *
 * Viven aquí y no dentro del `.vue` porque la Directiva 12 prohíbe declarar esquemas
 * Zod inline en componentes o vistas.
 * ==============================================================================
 */

/** Una nota no se puede editar ni borrar después (CA-ORD-10-03): conviene revisarla antes. */
export const NotaInternaDto = z.object({
  texto: z
    .string()
    .trim()
    .min(1, 'Escribe el texto de la nota.')
    .max(2000, 'La nota no puede superar 2000 caracteres.'),
});
export type NotaInternaDto = z.infer<typeof NotaInternaDto>;

export const MEDIOS_CONTACTO = ['correo', 'telefono'] as const;

export const ContactoDto = z.object({
  // El frontend usa Zod 3, donde el mensaje se personaliza con `errorMap`; el backend
  // va por Zod 4 y allí la opción se llama `error`.
  medio: z.enum(MEDIOS_CONTACTO, {
    errorMap: () => ({ message: 'Elige el medio por el que contactaste al cliente.' }),
  }),
  detalle: z
    .string()
    .trim()
    .max(1000, 'El detalle no puede superar 1000 caracteres.')
    .optional()
    .default(''),
});
export type ContactoDto = z.infer<typeof ContactoDto>;

/** Etiqueta de cada medio para la interfaz. */
export const ETIQUETA_MEDIO: Record<(typeof MEDIOS_CONTACTO)[number], string> = {
  correo: 'Correo electrónico',
  telefono: 'Teléfono',
};

/** Límites que la interfaz muestra al escribir. */
export const LIMITE_NOTA = 2000;
export const LIMITE_DETALLE = 1000;
