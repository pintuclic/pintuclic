import { EnumEstadoOrden, EnumModoEntrega } from '../../../core/db/types';

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
 *   Cuál de las dos aplica lo decide el modo de entrega de la orden (ver `transicionesPermitidas`).
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

/**
 * Salida que el modo de entrega excluye desde Preparada (D02, RF-ORD-03-06): la recogida
 * se cierra en Entregado sin despacho, y el envío a domicilio pasa por Despachado.
 */
const EXCLUIDA_POR_MODO: Readonly<Record<EnumModoEntrega, EnumEstadoOrden>> = {
  recogida: 'despachado',
  domicilio: 'entregado',
};

/**
 * Estados a los que puede pasar una orden. Desde Preparada depende del modo de entrega;
 * las órdenes anteriores a la copia histórica (`modo` null) conservan las dos salidas.
 */
export function transicionesPermitidas(
  estado: EnumEstadoOrden,
  modo: EnumModoEntrega | null = null
): readonly EnumEstadoOrden[] {
  const posibles = TRANSICIONES[estado];
  if (estado !== 'preparada' || modo === null) {
    return posibles;
  }
  return posibles.filter((destino) => destino !== EXCLUIDA_POR_MODO[modo]);
}

export function esTransicionPermitida(
  desde: EnumEstadoOrden,
  hacia: EnumEstadoOrden,
  modo: EnumModoEntrega | null = null
): boolean {
  return transicionesPermitidas(desde, modo).includes(hacia);
}

/** Volver de Preparada a En preparación exige motivo (D01). */
export function requiereMotivo(desde: EnumEstadoOrden, hacia: EnumEstadoOrden): boolean {
  return desde === 'preparada' && hacia === 'en_preparacion';
}
