/** Galón estándar en Pintu Clic, en litros (RF-CAT-10-03). */
export const LITROS_POR_GALON = 3.785;

/** Manos que asume toda recomendación de la tienda (calculadora y ficha). */
export const MANOS_RECOMENDADAS = 2;

/**
 * Margen relativo para los volúmenes guardados con pocos decimales: el cuarto de galón se
 * guarda como 0,946 L (real 0,94625 L), así que 1 galón daba 4,001 cuartos y se redondeaba a 5.
 * Un 0,1 % equivale a unos mililitros: no cambia la recomendación real.
 */
const MARGEN_VOLUMEN = 0.001;

/** Volumen de una presentación en litros; un valor ausente o inválido se trata como un galón. */
export function litrosDePresentacion(volumen: string | number | null | undefined): number {
  const litros = Number(volumen);
  return Number.isFinite(litros) && litros > 0 ? litros : LITROS_POR_GALON;
}

/** ¿La presentación es un galón (para mostrar el resultado en galones)? */
export function esGalon(volumen: string | number | null | undefined): boolean {
  return Math.abs(litrosDePresentacion(volumen) - LITROS_POR_GALON) < 0.01;
}

/**
 * Galones EXACTOS que necesita una superficie: área × manos ÷ rendimiento (m² por galón y mano).
 * No se redondea aquí: redondear antes de convertir a otra presentación inflaba la compra
 * (25 m² con 45 m²/gal recomendaba 9 cuartos en vez de 5).
 */
export function galonesNecesarios(areaM2: number, rendimientoM2PorGalon: number, manos = MANOS_RECOMENDADAS): number {
  if (!Number.isFinite(areaM2) || areaM2 <= 0 || !Number.isFinite(rendimientoM2PorGalon) || rendimientoM2PorGalon <= 0) return 0;
  return (areaM2 * manos) / rendimientoM2PorGalon;
}

/**
 * Unidades de una presentación que cubren los galones necesarios (exactos, sin redondear).
 * Ej.: 1,11 galones → 2 galones, 5 cuartos de galón (0,946 L) o 5 litros.
 */
export function unidadesParaGalones(galones: number, volumen: string | number | null | undefined): number {
  if (!Number.isFinite(galones) || galones <= 0) return 0;
  const unidades = (galones * LITROS_POR_GALON) / litrosDePresentacion(volumen);
  return Math.max(1, Math.ceil(unidades * (1 - MARGEN_VOLUMEN)));
}
