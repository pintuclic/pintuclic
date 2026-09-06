import { z } from 'zod';

// ==============================================================================
// M18 - DTOs DE ENVÍO Y DISPARO DE NOTIFICACIONES (HU-NOT-01, HU-NOT-02)
// Validación y sanitización de peticiones con Zod
// ==============================================================================

/**
 * Catálogo inmutable de eventos de negocio que disparan notificaciones (RF-NOT-01-02).
 * Única fuente de verdad (SSOT) para validaciones Zod y contratos de dominio.
 */
export const TIPOS_EVENTOS_NOTIFICACION = [
  'REGISTRO_CLIENTE',
  'RECUPERACION_PASSWORD',
  'SOLICITUD_EMPRESA_RECIBIDA',
  'SOLICITUD_EMPRESA_DECISION',
  'CAMBIO_ESTADO_ORDEN',
  'DEMORA_ORDEN_STOCK',
  'COTIZACION_RESPONDIDA',
  'COTIZACION_RECHAZADA',
  'COTIZACION_PROXIMA_VENCER',
  'PRUEBA_SISTEMA',
] as const;

/**
 * Estados inmutables del ciclo de vida de un envío en la bitácora (RF-NOT-01-04).
 * Única fuente de verdad (SSOT) para validaciones Zod y contratos de dominio.
 */
export const ESTADOS_ENVIO_NOTIFICACION = [
  'pendiente',
  'enviado',
  'reintentando',
  'fallido',
] as const;

/**
 * Esquema para disparar una notificación a partir de un evento de negocio.
 */
export const DispararEventoSchema = z.object({
  evento: z.enum(TIPOS_EVENTOS_NOTIFICACION),
  destinatario: z
    .string()
    .trim()
    .min(1, 'El correo destinatario es obligatorio')
    .email('Formato de correo electrónico inválido')
    .max(150, 'El correo no puede exceder 150 caracteres'),
  idUsuario: z
    .number()
    .int('El idUsuario debe ser un número entero')
    .positive('El idUsuario debe ser positivo')
    .optional(),
  variables: z
    .record(z.string(), z.union([z.string(), z.number()]))
    .optional()
    .default({}),
});

export type DispararEventoDto = z.infer<typeof DispararEventoSchema>;

/**
 * Esquema para filtrar consultas en la bitácora de envíos (HU-NOT-01, HU-NOT-04).
 */
export const FiltrosBitacoraSchema = z.object({
  estado: z.enum(ESTADOS_ENVIO_NOTIFICACION).optional(),
  evento: z.string().trim().optional(),
  destinatario: z.string().trim().optional(),
  limite: z.coerce.number().int().min(1).max(100).optional().default(20),
  pagina: z.coerce.number().int().min(1).optional().default(1),
});

export type FiltrosBitacoraDto = z.infer<typeof FiltrosBitacoraSchema>;

