/**
 * ==============================================================================
 * UTILIDADES GLOBALES DE MONEDA - PINTUCLIC DESIGN SYSTEM
 * Ubicación: src/core/utils/moneda.ts
 * ==============================================================================
 * Centralización del formateo oficial de precios y valores monetarios
 * en Pesos Colombianos (COP) para toda la aplicación.
 */

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const formatoNumeroCOP = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

/**
 * Formatea un valor numérico como moneda completa con símbolo según configuración regional.
 * Ejemplo: 154900 -> "$ 154.900"
 */
export function formatearCOP(valor: number): string {
  return formatoCOP.format(valor);
}

/**
 * Formatea un valor numérico con prefijo de signo de pesos y separador de miles.
 * Ejemplo: 154900 -> "$154.900"
 */
export function formatearPrecio(valor: number): string {
  return `$${formatoNumeroCOP.format(valor)}`;
}

/**
 * Formatea un valor numérico con sufijo COP explícito para presentación en tarjetas de catálogo.
 * Ejemplo: 154900 -> "$154.900 COP"
 */
export function formatearPrecioConSufijo(valor: number): string {
  return `$${formatoNumeroCOP.format(valor)} COP`;
}
