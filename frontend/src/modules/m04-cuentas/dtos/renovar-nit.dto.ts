import { z } from 'zod';

export const renovarNitSchema = z.object({
  nitNuevo: z
    .string()
    .trim()
    .min(5, 'El nuevo NIT o RUT debe tener al menos 5 caracteres')
    .max(30, 'El NIT no puede exceder 30 caracteres')
    .regex(/^[0-9-kK]+$/, 'El NIT debe contener dígitos y guion de verificación'),
  documentoAdjuntoUrl: z
    .string()
    .trim()
    .min(3, 'Debe adjuntar el documento de soporte (RUT/Cámara de Comercio)'),
});

export type RenovarNitDTO = z.infer<typeof renovarNitSchema>;
