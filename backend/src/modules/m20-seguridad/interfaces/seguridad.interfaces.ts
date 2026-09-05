import { z } from 'zod';
import { EnumEstadoUsuario, Sesion } from '../../../core/db/types';

// ==============================================================================
// M20 - SEGURIDAD, AUDITORÍA Y PROTECCIÓN DE DATOS
// Contratos e interfaces públicas del módulo.
// ==============================================================================

/**
 * Tipo de sesión emitida. Determina la ventana de inactividad aplicable (RF-SEG-02-02).
 */
export type TipoSesion = 'admin' | 'cliente';

/**
 * Ventanas de inactividad configurables por el administrador (RF-SEG-02-02, RF-SEG-02-07).
 * Valores expresados en segundos.
 */
export interface PoliticaSesion {
  readonly inactividadAdminSegundos: number;
  readonly inactividadClienteSegundos: number;
}

/**
 * Motivos normalizados de denegación emitidos por el validador central (RNF-SEG-03-01).
 * Nunca se exponen al navegador tal cual: la respuesta al cliente es uniforme (RF-SEG-03-05).
 */
export type MotivoDenegacion =
  | 'SESION_AUSENTE'
  | 'SESION_INVALIDA'
  | 'CUENTA_NO_ACTIVA'
  | 'PERMISO_AUSENTE'
  | 'TITULARIDAD_AJENA';

/**
 * Resultado del validador central de autorización (RF-SEG-03-01).
 */
export type ResultadoAutorizacion =
  | { readonly autorizado: true }
  | { readonly autorizado: false; readonly motivo: MotivoDenegacion };

/**
 * Identidad del usuario resuelta EN VIVO contra la base de datos en cada petición.
 * Es la pieza que permite rechazar cuentas desactivadas o permisos retirados sin
 * esperar a que el usuario vuelva a autenticarse (CA-SEG-02-04, CA-SEG-02-05, CA-SEG-03-04).
 */
export interface IdentidadVigente {
  readonly id_usuario: number;
  readonly estado: EnumEstadoUsuario;
  readonly id_rol: number | null;
  readonly permisos: readonly string[];
}

/**
 * Sesión recién emitida, tal como se entrega al cliente (HU-SEG-02).
 */
export interface SesionEmitida {
  readonly idSesion: string;
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiraEnSegundos: number;
  readonly expiraEn: string;
  readonly tipoSesion: TipoSesion;
}

/**
 * Motivo por el que una sesión persistida dejó de ser válida.
 * Se registra internamente; al navegador siempre viaja la misma respuesta.
 */
export type MotivoSesionInvalida =
  | 'SESION_DESCONOCIDA'
  | 'SESION_CERRADA'
  | 'SESION_REVOCADA'
  | 'SESION_CADUCADA';

/**
 * Resultado de comprobar la sesión contra la tabla `sesion` en cada petición.
 */
export type ResultadoValidacionSesion =
  | { readonly valida: true; readonly sesion: Sesion }
  | { readonly valida: false; readonly motivo: MotivoSesionInvalida };

/**
 * Registro técnico de un acceso denegado (RF-SEG-03-07, CA-SEG-03-05).
 *
 * NOTA DE ALCANCE: la persistencia definitiva de este evento corresponde a la tabla
 * de auditoría de HU-SEG-04, que el equipo dejó EN PAUSA. Mientras tanto el evento
 * se emite al registro técnico interno del servidor, sin datos sensibles (RF-SEG-01-03).
 */
export interface EventoAccesoDenegado {
  readonly idUsuario: number | null;
  readonly operacion: string;
  readonly motivo: MotivoDenegacion;
  readonly fecha: string;
}

// ==============================================================================
// ESQUEMAS DE VALIDACIÓN (Zod) - DTOs de entrada
// ==============================================================================

/**
 * Política de contraseñas aplicada antes de derivar el hash (HU-SEG-01).
 * La derivación se realiza siempre con BCrypt de costo 12 en `core/utils/crypto.ts`.
 */
export const contrasenaSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede superar los 128 caracteres')
  .regex(/[a-z]/, 'La contraseña debe incluir al menos una letra minúscula')
  .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula')
  .regex(/[0-9]/, 'La contraseña debe incluir al menos un número');

/**
 * DTO de cambio de contraseña. Exige la contraseña vigente para evitar el
 * secuestro de una sesión abierta.
 */
export const cambioContrasenaSchema = z
  .object({
    contrasenaActual: z.string().min(1, 'Debe indicar su contraseña actual'),
    contrasenaNueva: contrasenaSchema,
  })
  .refine((datos) => datos.contrasenaActual !== datos.contrasenaNueva, {
    message: 'La contraseña nueva debe ser distinta de la actual',
    path: ['contrasenaNueva'],
  });

export type CambioContrasenaDTO = z.infer<typeof cambioContrasenaSchema>;

/** Resultado de un cambio de contraseña, con las sesiones que se invalidaron. */
export interface ResultadoCambioContrasena {
  readonly actualizada: true;
  readonly sesionesCerradas: number;
}

/**
 * DTO de actualización de la política de vigencia de sesión (RF-SEG-02-07).
 */
export const politicaSesionSchema = z.object({
  inactividadAdminSegundos: z.number().int().positive().max(86_400),
  inactividadClienteSegundos: z.number().int().positive().max(7_776_000),
});

export type PoliticaSesionDTO = z.infer<typeof politicaSesionSchema>;

/**
 * DTO de apertura de sesión (credenciales).
 *
 * El flujo de login de cara al usuario pertenece a M04; M20 solo aporta la verificación
 * de credenciales y la emisión de la sesión.
 */
export const aperturaSesionSchema = z.object({
  correo: z.string().email('Debe indicar un correo válido'),
  contrasena: z.string().min(1, 'Debe indicar su contraseña'),
});

export type AperturaSesionDTO = z.infer<typeof aperturaSesionSchema>;
