import { z } from 'zod';

// ==============================================================================
// M04 - DTOs de Aprobación y Revisión Administrativa (HU-CUE-09)
// ==============================================================================

/**
 * DTO para dictaminar una solicitud de empresa (aprobar o rechazar).
 * Si la decisión es rechazar, el motivo es obligatorio (RF-CUE-09-05).
 */
export const dictamenSolicitudEmpresaSchema = z
  .object({
    decision: z.enum(['aprobar', 'rechazar']),
    motivoRechazo: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.decision === 'rechazar') {
        return Boolean(data.motivoRechazo && data.motivoRechazo.length > 0);
      }
      return true;
    },
    {
      message: 'Debe especificar el motivo del rechazo para notificar a la empresa',
      path: ['motivoRechazo'],
    }
  );

export type DictamenSolicitudEmpresaDTO = z.infer<typeof dictamenSolicitudEmpresaSchema>;

/**
 * DTO para registrar una solicitud de actualización de NIT con soporte documental (RF-CUE-09-07).
 */
export const solicitudActualizacionNitSchema = z.object({
  nit_nuevo: z
    .string()
    .trim()
    .min(5, 'El nuevo NIT debe tener al menos 5 caracteres')
    .max(30)
    .regex(/^[0-9\-kK]+$/, 'El NIT debe contener dígitos y guion de verificación'),
  documento_adjunto_url: z
    .string()
    .trim()
    .min(1, 'Debe adjuntar el documento o RUT de soporte'),
});

export type SolicitudActualizacionNitDTO = z.infer<typeof solicitudActualizacionNitSchema>;
