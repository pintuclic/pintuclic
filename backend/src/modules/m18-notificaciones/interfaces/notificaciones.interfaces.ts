// ==============================================================================
// M18 - NOTIFICACIONES Y COMUNICACIONES
// Contratos de dominio TypeScript estáticos (0 bytes en runtime, Directiva 10)
// ==============================================================================

import type { TIPOS_EVENTOS_NOTIFICACION, ESTADOS_ENVIO_NOTIFICACION } from '../dtos/envio.dto';

/**
 * Catálogo de tipos de eventos de negocio que disparan notificaciones (RF-NOT-01-02).
 * Derivado estáticamente de la tupla inmutable SSOT en DTOs (Directiva 10: 0 bytes en runtime).
 */
export type TipoEventoNotificacion = (typeof TIPOS_EVENTOS_NOTIFICACION)[number];

/**
 * Estados del ciclo de vida de un envío en la bitácora (RF-NOT-01-04).
 * Derivado estáticamente de la tupla inmutable SSOT en DTOs (Directiva 10: 0 bytes en runtime).
 */
export type EstadoEnvioNotificacion = (typeof ESTADOS_ENVIO_NOTIFICACION)[number];


/**
 * Plantilla de comunicación transaccional administrable (HU-NOT-03).
 */
export interface IPlantillaNotificacion {
  readonly codigo: string;
  readonly nombre: string;
  readonly descripcion: string;
  asunto: string;
  cuerpoHtml: string;
  cuerpoTexto: string;
  readonly variablesDisponibles: readonly string[];
  readonly variablesObligatorias: readonly string[];
  fechaActualizacion: string;
  actualizadoPor?: string | null | undefined;
}

/**
 * Registro individual de envío para trazabilidad y auditoría (RF-NOT-01-04, HU-SEG-06).
 */
export interface IRegistroEnvio {
  readonly id: string;
  readonly idUsuario?: number | null | undefined;
  readonly destinatario: string;
  readonly evento: TipoEventoNotificacion;
  readonly codigoPlantilla: string;
  readonly asunto: string;
  estado: EstadoEnvioNotificacion;
  intentos: number;
  readonly maxIntentos: number;
  error?: string | null | undefined;
  metadata?: Readonly<Record<string, unknown>> | undefined;
  readonly fechaCreacion: string;
  fechaUltimoIntento: string;
}

/**
 * Resultado estructurado tras procesar un evento de notificación (HU-NOT-01).
 */
export interface IResultadoEnvio {
  readonly exitoso: boolean;
  readonly idEnvio: string;
  readonly intentos: number;
  readonly mensaje: string;
  readonly error?: string | null | undefined;
}

/**
 * Resultado de la previsualización de una plantilla con variables de prueba (RF-NOT-03-03).
 */
export interface IPrevisualizacionPlantilla {
  readonly codigo: string;
  readonly asunto: string;
  readonly cuerpoHtml: string;
  readonly cuerpoTexto: string;
  readonly variablesAplicadas: Readonly<Record<string, string | number>>;
}

/**
 * Métricas y estadísticas de entregabilidad de notificaciones (HU-NOT-04).
 */
export interface IEstadisticasEntregabilidad {
  readonly totalEnvios: number;
  readonly enviadosExitosos: number;
  readonly fallidosDefinitivos: number;
  readonly reintentosTotales: number;
  readonly tasaEntregabilidad: number; // Porcentaje 0 - 100
}

/**
 * Payloads específicos para eventos emitidos por otros módulos (M08, M21, M04).
 */
export interface EventoCambioEstadoOrdenPayload {
  readonly idUsuario?: number | undefined;
  readonly destinatario: string;
  readonly nombreCliente: string;
  readonly numeroOrden: string;
  readonly nuevoEstado: string;
  readonly fechaCambio: string;
  readonly comentarios?: string | undefined;
}

export interface EventoDemoraStockPayload {
  readonly idUsuario?: number | undefined;
  readonly destinatario: string;
  readonly nombreCliente: string;
  readonly numeroOrden: string;
  readonly tiempoEstimadoDias: number;
  readonly motivoDemora?: string | undefined;
}

export interface EventoCotizacionPayload {
  readonly idUsuario?: number | undefined;
  readonly destinatario: string;
  readonly nombreCliente: string;
  readonly numeroCotizacion: string;
  readonly estadoCotizacion: 'respondida' | 'rechazada' | 'proxima_a_caducar';
  readonly fechaVigencia?: string | undefined;
  readonly observaciones?: string | undefined;
}
