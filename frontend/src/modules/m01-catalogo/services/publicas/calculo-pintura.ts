/** Galón estándar en Pintu Clic, en litros (RF-CAT-10-03). */
export const LITROS_POR_GALON = 3.785;

/** Manos que asume toda recomendación de la tienda (calculadora y ficha). */
export const MANOS_RECOMENDADAS = 2;

/** Volumen de una presentación en litros; un valor ausente o inválido se trata como un galón. */
export function litrosDePresentacion(volumen: string | number | null | undefined): number {
  const litros = Number(volumen);
  return Number.isFinite(litros) && litros > 0 ? litros : LITROS_POR_GALON;
}

/**
 * Unidades de una presentación que cubren los galones recomendados.
 * Ej.: 5 galones en cuartos de galón (0,946 L) → 21 unidades.
 */
export function unidadesParaGalones(galones: number, volumen: string | number | null | undefined): number {
  if (!Number.isFinite(galones) || galones <= 0) return 0;
  // Se redondea a 6 decimales antes del techo para que 3,785 / 3,785 no dé 1,0000001.
  const unidades = (galones * LITROS_POR_GALON) / litrosDePresentacion(volumen);
  return Math.max(1, Math.ceil(Math.round(unidades * 1e6) / 1e6));
}
