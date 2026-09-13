import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE MARCAS (Zod)
// Validación de entradas HTTP para HU-CAT-04.
// ==============================================================================

const nombreMarcaSchema = z
  .string()
  .trim()
  .min(1, 'El nombre de la marca es obligatorio')
  .max(100, 'El nombre no puede superar los 100 caracteres');

/**
 * RF-CAT-04-02: formatos y peso máximo del logotipo.
 *
 * SUPUESTO PENDIENTE DE CONFIRMAR: el "Anexo B de la Tanda 2" que define el
 * límite oficial no está disponible en el repositorio. Se usa 5MB (aprobado
 * por el Product Owner) y los formatos raster estándar de la web como
 * placeholder hasta que ese documento aparezca.
 */
const FORMATOS_LOGOTIPO_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
const PESO_MAXIMO_LOGOTIPO_BYTES = 5 * 1024 * 1024;

const DATA_URL_REGEX = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/;

/** No hay subida multipart en el proyecto: el logotipo viaja como data URL base64 dentro del JSON. */
const logotipoSchema = z
  .string()
  .min(1, 'Debe adjuntar el logotipo de la marca')
  .transform((valor, ctx) => {
    const match = DATA_URL_REGEX.exec(valor);
    const mimeType = match?.[1];
    const base64Data = match?.[2];
    if (!mimeType || !base64Data) {
      ctx.addIssue({
        code: 'custom',
        message: `El logotipo debe ser una imagen en base64 (data URL) de formato ${FORMATOS_LOGOTIPO_PERMITIDOS.join(', ')}`,
      });
      return z.NEVER;
    }

    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.byteLength > PESO_MAXIMO_LOGOTIPO_BYTES) {
      ctx.addIssue({
        code: 'custom',
        message: `El logotipo no puede pesar más de ${PESO_MAXIMO_LOGOTIPO_BYTES / (1024 * 1024)}MB`,
      });
      return z.NEVER;
    }

    return { buffer, mimeType };
  });

export const CrearMarcaDto = z.object({
  nombre: nombreMarcaSchema,
  logotipo: logotipoSchema,
});
export type CrearMarcaDto = z.infer<typeof CrearMarcaDto>;

export const ActualizarMarcaDto = z
  .object({
    nombre: nombreMarcaSchema.optional(),
    logotipo: logotipoSchema.optional(),
  })
  .refine((data) => data.nombre !== undefined || data.logotipo !== undefined, {
    message: 'Debe indicar al menos un dato a actualizar',
  });
export type ActualizarMarcaDto = z.infer<typeof ActualizarMarcaDto>;
