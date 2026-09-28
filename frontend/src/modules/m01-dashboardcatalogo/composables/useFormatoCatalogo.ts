/**
 * ==============================================================================
 * M01 - FORMATEADORES DEL CATÁLOGO (sin estado)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useFormatoCatalogo.ts
 *
 * Helpers puros de presentación (números, fechas, porcentajes) en configuración
 * regional es-CO. No dependen del store, por lo que cualquier componente hoja
 * (tablas, tarjetas) puede usarlos sin acoplarse a la carga de datos.
 * ==============================================================================
 */

const nf = new Intl.NumberFormat('es-CO');
const fFechaLarga = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });
const fFechaHora = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/** 1392 -> "1.392" */
export function formatearNumero(valor: number): string {
  return nf.format(valor);
}

/** "2025-05-27T10:24:00-05:00" -> "27 de mayo de 2025" */
export function formatearFecha(iso: string): string {
  return fFechaLarga.format(new Date(iso));
}

/** "2025-05-27T10:24:00-05:00" -> "27 may 2025, 10:24" */
export function formatearFechaHora(iso: string): string {
  return fFechaHora.format(new Date(iso));
}

/** 12 -> "+12%" | -18 -> "-18%" | 0 -> "0%" */
export function formatearVariacion(puntos: number): string {
  const signo = puntos > 0 ? '+' : '';
  return `${signo}${nf.format(puntos)}%`;
}

/** 79 -> "79%" */
export function formatearPorcentaje(valor: number): string {
  return `${nf.format(valor)}%`;
}

export function useFormatoCatalogo() {
  return {
    formatearNumero,
    formatearFecha,
    formatearFechaHora,
    formatearVariacion,
    formatearPorcentaje,
  };
}
