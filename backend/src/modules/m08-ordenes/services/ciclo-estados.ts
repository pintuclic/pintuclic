import { EnumEstadoOrden } from '../../../core/db/types';

// ==============================================================================
// M08 - CICLO DE ESTADOS DE LA ORDEN (HU-ORD-03, definiciones D01 y D02 de la épica #28)
// Única fuente de las transiciones que el personal puede registrar. Al ser `Record`
// exhaustivos, TypeScript obliga a revisar este archivo si cambia `EnumEstadoOrden`.
// ==============================================================================

/**
 * Transiciones manuales permitidas desde cada estado.
 *
 * - `revision_disponibilidad` → `en_preparacion`: D01 prevé que sea automática al confirmar
 *   la última línea disponible (M09). Mientras no exista esa verificación, la registra el personal.
 * - `en_preparacion` → `preparada`: actor y condiciones pendientes del análisis (P1).
 * - `preparada` → `en_preparacion`: única vuelta atrás permitida, con motivo (D01).
 * - `preparada` → `despachado` (domicilio) o `entregado` (recogida en una sola acción, D02).
 *   El sistema aún no guarda el modo de entrega (copia histórica pendiente), así que
 *   ambas salidas quedan disponibles.
 * - `despachado` → `entregado`: opcional; Despachado ya es cierre normal a domicilio (D02).
 *
 * `cancelado` y `devuelto` no se alcanzan todavía: dependen de la política de M11 y del
 * registro del dinero por devolver (CA-ORD-03-05).
 */
export const TRANSICIONES: Readonly<Record<EnumEstadoOrden, readonly EnumEstadoOrden[]>> = {
  orden_confirmada: ['revision_disponibilidad'],
  revision_disponibilidad: ['en_preparacion'],
  en_preparacion: ['preparada'],
  preparada: ['en_preparacion', 'despachado', 'entregado'],
  despachado: ['entregado'],
  entregado: [],
  cancelado: [],
  devuelto: [],
};

/** Estados cuyo flujo aún no está habilitado (política de cancelación y devolución de M11). */
export const ESTADOS_NO_HABILITADOS: readonly EnumEstadoOrden[] = ['cancelado', 'devuelto'];

/** Nombre del estado tal como lo ve una persona (correo de M18 y mensajes de error). */
export const ETIQUETA_ESTADO: Readonly<Record<EnumEstadoOrden, string>> = {
  orden_confirmada: 'Orden confirmada',
  revision_disponibilidad: 'Revisión de disponibilidad',
  en_preparacion: 'En preparación',
  preparada: 'Preparada',
  despachado: 'Despachado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  devuelto: 'Devuelto',
};

/**
 * Estados que avisan al cliente por correo al alcanzarse. D05 limita el correo al
 * nacimiento de la orden, al despacho y a la cancelación; esta entrega solo registra
 * el despacho.
 */
export const ESTADOS_QUE_NOTIFICAN: readonly EnumEstadoOrden[] = ['despachado'];

export function transicionesPermitidas(estado: EnumEstadoOrden): readonly EnumEstadoOrden[] {
  return TRANSICIONES[estado];
}

export function esTransicionPermitida(desde: EnumEstadoOrden, hacia: EnumEstadoOrden): boolean {
  return TRANSICIONES[desde].includes(hacia);
}

/** Volver de Preparada a En preparación exige motivo (D01). */
export function requiereMotivo(desde: EnumEstadoOrden, hacia: EnumEstadoOrden): boolean {
  return desde === 'preparada' && hacia === 'en_preparacion';
}
