import { z } from 'zod';

// ==============================================================================
// M20 - PROTECCIÓN DE DATOS PERSONALES (HU-SEG-05)
// Esquemas de Validación (Zod) y DTOs de Entrada HTTP
// ==============================================================================

/**
 * DTO de aceptación del aviso de privacidad (RF-SEG-05-01, RF-SEG-05-02).
 *
 * Se exige la versión explícitamente y no se infiere de la vigente: si el aviso
 * cambia entre que el usuario lo lee y lo acepta, debe fallar en vez de registrar
 * un consentimiento sobre un texto que el titular nunca vio.
 */
export const registroConsentimientoSchema = z.object({
  version: z
    .string()
    .min(1, 'Debe indicar la versión del aviso de privacidad que acepta')
    .max(50, 'La versión no puede superar los 50 caracteres'),
  aceptado: z.literal(true, {
    message: 'Debe aceptar el tratamiento de datos personales para continuar',
  }),
});

export type RegistroConsentimientoDTO = z.infer<typeof registroConsentimientoSchema>;

/**
 * DTO de resolución administrativa de una solicitud de supresión (RF-SEG-05-06).
 * `pendiente` no se admite: resolver es sacar la solicitud de ese estado.
 */
export const resolucionSupresionSchema = z.object({
  estado: z.enum(['en_proceso', 'aprobada', 'rechazada'], {
    message: 'El estado debe ser en_proceso, aprobada o rechazada',
  }),
});

export type ResolucionSupresionDTO = z.infer<typeof resolucionSupresionSchema>;

/**
 * Identificador de solicitud recibido por la URL.
 */
export const idSolicitudParamSchema = z.object({
  id: z.coerce.number().int().positive('El identificador de solicitud no es válido'),
});

export type IdSolicitudParamDTO = z.infer<typeof idSolicitudParamSchema>;
