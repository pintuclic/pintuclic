import { hexARgb } from '../dtos/color-formulario.dto';
import type { Cielab } from '../interfaces';

/**
 * ==============================================================================
 * M01 - PUENTE HEX ⇄ CIELAB (useColorCielab)
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/useColorCielab.ts
 *
 * El backend almacena y valida el valor cromático en CIELAB (RF-CAT-05-02,
 * `CrearColorDto.cielab`), mientras que la UI trabaja en HEX porque un
 * color-picker es la captura correcta para el usuario. Este módulo implementa
 * la conversión estándar en ambos sentidos:
 *
 *   sRGB → (gamma inversa) → RGB lineal → XYZ (matriz sRGB/D65) → L*a*b*
 *   L*a*b* → XYZ → RGB lineal → (gamma) → sRGB
 *
 * Blanco de referencia D65 con observador 2°. Sin dependencias de Vue: son
 * funciones puras reutilizables desde stores, DTOs y vistas.
 * ==============================================================================
 */

type Rgb = { r: number; g: number; b: number };

/** Blanco de referencia D65 (observador 2°), escala 0-100. */
const BLANCO_D65 = { x: 95.047, y: 100.0, z: 108.883 } as const;

/** Constantes de la función f(t) de CIELAB: δ = 6/29. */
const EPSILON = 216 / 24389; // (6/29)^3
const KAPPA = 24389 / 27; // (29/3)^3

const limitar = (valor: number, minimo: number, maximo: number): number =>
  Math.min(maximo, Math.max(minimo, valor));

/** Redondea a `decimales` evitando el "-0". */
const redondear = (valor: number, decimales: number): number => {
  const factor = 10 ** decimales;
  const resultado = Math.round(valor * factor) / factor;
  return Object.is(resultado, -0) ? 0 : resultado;
};

/** Gamma inversa sRGB: canal 0-255 → componente lineal 0-1. */
function canalALineal(canal: number): number {
  const v = limitar(canal, 0, 255) / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** Gamma sRGB: componente lineal 0-1 → canal 0-255. */
function linealACanal(lineal: number): number {
  const v = limitar(lineal, 0, 1);
  const comprimido = v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
  return Math.round(limitar(comprimido, 0, 1) * 255);
}

const f = (t: number): number => (t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116);

const fInversa = (t: number): number => {
  const cubo = t ** 3;
  return cubo > EPSILON ? cubo : (116 * t - 16) / KAPPA;
};

/** sRGB (0-255 por canal) → CIELAB (D65). */
export function rgbACielab({ r, g, b }: Rgb): Cielab {
  const rl = canalALineal(r);
  const gl = canalALineal(g);
  const bl = canalALineal(b);

  // Matriz sRGB → XYZ (D65), escalada a 0-100.
  const x = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) * 100;
  const y = (0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl) * 100;
  const z = (0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl) * 100;

  const fx = f(x / BLANCO_D65.x);
  const fy = f(y / BLANCO_D65.y);
  const fz = f(z / BLANCO_D65.z);

  return {
    l: redondear(limitar(116 * fy - 16, 0, 100), 2),
    a: redondear(limitar(500 * (fx - fy), -128, 128), 2),
    b: redondear(limitar(200 * (fy - fz), -128, 128), 2),
  };
}

/** CIELAB (D65) → sRGB (0-255 por canal, recortado al gamut). */
export function cielabARgb({ l, a, b }: Cielab): Rgb {
  const fy = (limitar(l, 0, 100) + 16) / 116;
  const fx = fy + limitar(a, -128, 128) / 500;
  const fz = fy - limitar(b, -128, 128) / 200;

  const x = (fInversa(fx) * BLANCO_D65.x) / 100;
  const y = (fInversa(fy) * BLANCO_D65.y) / 100;
  const z = (fInversa(fz) * BLANCO_D65.z) / 100;

  // Matriz XYZ → sRGB (D65).
  const rl = 3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  const gl = -0.969266 * x + 1.8760108 * y + 0.041556 * z;
  const bl = 0.0556434 * x - 0.2040259 * y + 1.0572252 * z;

  return { r: linealACanal(rl), g: linealACanal(gl), b: linealACanal(bl) };
}

/** sRGB → HEX en mayúsculas (#RRGGBB). */
export function rgbAHex({ r, g, b }: Rgb): string {
  return (
    '#' +
    [r, g, b]
      .map((canal) => limitar(Math.round(canal), 0, 255).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/** HEX (#RGB o #RRGGBB) → CIELAB; `null` si el HEX no es válido. */
export function hexACielab(hex: string): Cielab | null {
  const rgb = hexARgb(hex);
  return rgb ? rgbACielab(rgb) : null;
}

/** CIELAB → HEX, para pintar la muestra a partir del valor almacenado. */
export function cielabAHex(cielab: Cielab): string {
  return rgbAHex(cielabARgb(cielab));
}

/** Fachada de composable para usarla desde vistas y componentes. */
export function useColorCielab() {
  return { rgbACielab, cielabARgb, rgbAHex, hexACielab, cielabAHex };
}
