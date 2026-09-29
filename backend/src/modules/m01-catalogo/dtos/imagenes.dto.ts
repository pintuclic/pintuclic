import { z } from 'zod';

// ==============================================================================
// M01 - DTOs DE IMÁGENES (Zod) — HU-CAT-07
// La imagen viaja como data URL base64 dentro del JSON (mismo enfoque que el
// logotipo de marca; sin subida multipart ni dependencias nuevas).
// ==============================================================================

const FORMATOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'] as const;
const PESO_MAXIMO_BYTES = 5 * 1024 * 1024;
const DATA_URL_REGEX = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+=*)$/;

const imagenSchema = z
  .string()
  .min(1, 'Debe adjuntar la imagen')
  .transform((valor, ctx) => {
    const match = DATA_URL_REGEX.exec(valor);
    const mimeType = match?.[1];
    const base64Data = match?.[2];
    if (!mimeType || !base64Data) {
      ctx.addIssue({
        code: 'custom',
        message: `La imagen debe ser base64 (data URL) de formato ${FORMATOS_PERMITIDOS.join(', ')}`,
      });
      return z.NEVER;
    }
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.byteLength > PESO_MAXIMO_BYTES) {
      ctx.addIssue({ code: 'custom', message: `La imagen no puede pesar más de ${PESO_MAXIMO_BYTES / (1024 * 1024)}MB` });
      return z.NEVER;
    }
    return { buffer, mimeType };
  });

const idPositivo = z.number().int().positive();
const ordenSchema = z.number().int().min(0, 'El orden no puede ser negativo');

export const CrearImagenDto = z.object({
  imagen: imagenSchema,
  id_variante: idPositivo.optional(),
  id_color: idPositivo.optional(),
  orden: ordenSchema.optional(),
  es_principal: z.boolean().optional(),
});
export type CrearImagenDto = z.infer<typeof CrearImagenDto>;

export const ActualizarImagenDto = z
  .object({
    imagen: imagenSchema.optional(),
    id_variante: idPositivo.nullable().optional(),
    id_color: idPositivo.nullable().optional(),
    orden: ordenSchema.optional(),
    es_principal: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.imagen !== undefined ||
      d.id_variante !== undefined ||
      d.id_color !== undefined ||
      d.orden !== undefined ||
      d.es_principal !== undefined,
    { message: 'Debe indicar al menos un dato a actualizar' }
  );
export type ActualizarImagenDto = z.infer<typeof ActualizarImagenDto>;
