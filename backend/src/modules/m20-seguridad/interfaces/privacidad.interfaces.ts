import { EnumEstadoSolicitudSupresion } from '../../../core/db/types';

// ==============================================================================
// M20 - PROTECCIÓN DE DATOS PERSONALES (HU-SEG-05)
// Contratos de dominio. Solo tipos de compilación, 0 runtime.
// ==============================================================================

/**
 * Aviso de privacidad tal como se entrega al navegador (RF-SEG-05-03).
 */
export interface AvisoPrivacidadPublico {
  readonly id_aviso_privacidad: number;
  readonly version: string;
  readonly descripcion: string;
  readonly es_vigente: boolean;
}

/**
 * Estado del consentimiento de un usuario frente al aviso vigente.
 *
 * `debeAceptar` es la respuesta a CA-SEG-05-06: cuando el aviso cambia de versión,
 * el usuario todavía no ha aceptado la nueva y el frontend debe informárselo.
 */
export interface EstadoConsentimiento {
  readonly avisoVigente: AvisoPrivacidadPublico | null;
  readonly aceptado: boolean;
  readonly debeAceptar: boolean;
  readonly fechaAceptacion: string | null;
  readonly versionAceptada: string | null;
  readonly historial: readonly ConsentimientoRegistrado[];
}

/**
 * Una aceptación concreta, con la versión exacta que el titular consintió.
 * El histórico es inmutable: nunca se sobrescribe una aceptación anterior.
 */
export interface ConsentimientoRegistrado {
  readonly version: string;
  readonly fecha: string;
}

/**
 * Solicitud de supresión de datos personales (Habeas Data, RF-SEG-05-06).
 */
export interface SolicitudSupresionPublica {
  readonly id_solicitud_supresion: number;
  readonly estado: EnumEstadoSolicitudSupresion;
  readonly fecha_solicitud: string;
  readonly fecha_resolucion: string | null;
}

/**
 * Resultado de registrar una solicitud de supresión.
 *
 * `conservaInformacionComercial` traduce al usuario la bifurcación
 * "¿tiene órdenes de ventas asociadas?" del diagrama: si las tiene, la ley obliga a
 * conservar esa información y solo puede desvincularse de su identidad (RF-SEG-05-07).
 */
export interface ResultadoSolicitudSupresion {
  readonly solicitud: SolicitudSupresionPublica;
  readonly yaExistia: boolean;
  readonly conservaInformacionComercial: boolean;
  readonly ordenesAsociadas: number;
}

/**
 * Motivo por el que no puede registrarse un consentimiento.
 */
export type MotivoConsentimientoRechazado = 'SIN_AVISO_VIGENTE' | 'VERSION_NO_VIGENTE';
