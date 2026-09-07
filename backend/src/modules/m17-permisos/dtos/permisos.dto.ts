import { z } from 'zod';

// ==============================================================================
// M17 - DTOs DE PERMISOS (Zod v4)
// Validacion de entradas HTTP para asignacion/revocacion de permisos.
// ==============================================================================

/**
 * DTO de asignacion de permisos a un empleado (RF-ADM-02-02).
 * La logica de cascada es responsabilidad del servicio, no del DTO.
 */
export const AsignarPermisosDto = z.object({
  permisos: z
    .array(
      z.string().min(1, 'El nombre del permiso no puede estar vacio').trim()
    )
    .min(1, 'Debe indicar al menos un permiso a asignar')
    .max(50, 'No se pueden asignar mas de 50 permisos en una sola solicitud'),
});

export type AsignarPermisosDto = z.infer<typeof AsignarPermisosDto>;

/**
 * DTO de revocacion de permisos (RF-ADM-02-07).
 * confirmacion_cascada debe ser true para continuar.
 */
export const RevocarPermisosDto = z.object({
  permisos: z
    .array(
      z.string().min(1).trim()
    )
    .min(1, 'Debe indicar al menos un permiso a revocar'),

  confirmacion_cascada: z
    .boolean()
    .refine((val) => val === true, {
      message: 'Debe aceptar la revocacion en cascada para continuar',
    }),
});

export type RevocarPermisosDto = z.infer<typeof RevocarPermisosDto>;

/**
 * DTO de reemplazo completo de permisos de un empleado (PUT /permisos).
 */
export const ReemplazarPermisosDto = z.object({
  permisos: z
    .array(
      z.string().min(1).trim()
    )
    .max(50, 'No se pueden asignar mas de 50 permisos'),
});

export type ReemplazarPermisosDto = z.infer<typeof ReemplazarPermisosDto>;
