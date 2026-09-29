import { computed, type ComputedRef } from 'vue';
import type { ColorPaletaPublica, EsquemaColorPublico } from '../../interfaces/publicas/catalogo-publico.interface';

interface HslColor {
  readonly h: number;
  readonly s: number;
  readonly l: number;
}

interface ColorConHsl {
  readonly color: ColorPaletaPublica;
  readonly hsl: HslColor;
}

const HEX_VALIDO = /^#[0-9a-f]{6}$/i;

function normalizarHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

function distanciaHue(primero: number, segundo: number): number {
  const diferencia = Math.abs(normalizarHue(primero) - normalizarHue(segundo));
  return Math.min(diferencia, 360 - diferencia);
}

function limitarPorcentaje(valor: number): number {
  return Math.min(100, Math.max(0, valor));
}

function hexAHsl(hex: string | null): HslColor | null {
  if (!hex || !HEX_VALIDO.test(hex)) return null;

  const rojo = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const verde = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const azul = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const maximo = Math.max(rojo, verde, azul);
  const minimo = Math.min(rojo, verde, azul);
  const luminosidad = (maximo + minimo) / 2;

  if (maximo === minimo) return { h: 0, s: 0, l: Math.round(luminosidad * 100) };

  const delta = maximo - minimo;
  const saturacion = luminosidad > 0.5 ? delta / (2 - maximo - minimo) : delta / (maximo + minimo);
  let hue = 0;

  if (maximo === rojo) hue = (verde - azul) / delta + (verde < azul ? 6 : 0);
  if (maximo === verde) hue = (azul - rojo) / delta + 2;
  if (maximo === azul) hue = (rojo - verde) / delta + 4;

  return {
    h: Math.round(hue * 60),
    s: Math.round(saturacion * 100),
    l: Math.round(luminosidad * 100),
  };
}

function distanciaColor(candidato: HslColor, objetivo: HslColor, pesos = { h: 4, s: 0.4, l: 0.8 }): number {
  return distanciaHue(candidato.h, objetivo.h) * pesos.h + Math.abs(candidato.s - objetivo.s) * pesos.s + Math.abs(candidato.l - objetivo.l) * pesos.l;
}

function prepararColoresReales(colores: readonly ColorPaletaPublica[], colorActivoId: number): ColorConHsl[] {
  return colores
    .filter((color) => color.id_color !== colorActivoId)
    .map((color) => ({ color, hsl: hexAHsl(color.muestra_hex) }))
    .filter((item): item is ColorConHsl => item.hsl !== null);
}

function tomarCercanos(
  disponibles: readonly ColorConHsl[],
  objetivos: readonly HslColor[],
  maximo: number,
  usadosIniciales: readonly number[] = []
): ColorPaletaPublica[] {
  const usados = new Set(usadosIniciales);
  const resultado: ColorPaletaPublica[] = [];

  objetivos.forEach((objetivo) => {
    const candidato = disponibles
      .filter((item) => !usados.has(item.color.id_color))
      .map((item) => ({ item, distancia: distanciaColor(item.hsl, objetivo) }))
      .sort((primero, segundo) => primero.distancia - segundo.distancia)[0];

    if (candidato) {
      usados.add(candidato.item.color.id_color);
      resultado.push(candidato.item.color);
    }
  });

  if (resultado.length >= maximo) return resultado.slice(0, maximo);

  const relleno = disponibles
    .filter((item) => !usados.has(item.color.id_color))
    .map((item) => ({
      item,
      distancia: Math.min(...objetivos.map((objetivo) => distanciaColor(item.hsl, objetivo))),
    }))
    .sort((primero, segundo) => primero.distancia - segundo.distancia)
    .slice(0, maximo - resultado.length)
    .map(({ item }) => item.color);

  return [...resultado, ...relleno];
}

function tomarMonocromaticos(disponibles: readonly ColorConHsl[], base: ColorPaletaPublica, hslBase: HslColor): ColorPaletaPublica[] {
  const mismaFamilia = disponibles.filter((item) => base.familia && item.color.familia === base.familia);
  const candidatos = mismaFamilia.length >= 2 ? mismaFamilia : disponibles;
  const objetivos = [
    { ...hslBase, s: limitarPorcentaje(hslBase.s - 10), l: limitarPorcentaje(hslBase.l + 22) },
    { ...hslBase, s: limitarPorcentaje(hslBase.s - 5), l: limitarPorcentaje(hslBase.l + 10) },
    { ...hslBase, s: limitarPorcentaje(hslBase.s + 5), l: limitarPorcentaje(hslBase.l - 12) },
    { ...hslBase, s: limitarPorcentaje(hslBase.s + 10), l: limitarPorcentaje(hslBase.l - 24) },
  ];

  return tomarCercanos(candidatos, objetivos, 4, [base.id_color]);
}

function esquemasDesdeColoresReales(
  todos: readonly ColorPaletaPublica[],
  base: ColorPaletaPublica,
  hslBase: HslColor
): EsquemaColorPublico[] {
  const disponibles = prepararColoresReales(todos, base.id_color);
  if (!disponibles.length) return [];

  const complementario = tomarCercanos(disponibles, [{ ...hslBase, h: hslBase.h + 180 }], 1, [base.id_color]);
  const analogos = tomarCercanos(
    disponibles,
    [
      { ...hslBase, h: hslBase.h - 30 },
      { ...hslBase, h: hslBase.h - 15 },
      { ...hslBase, h: hslBase.h + 15 },
      { ...hslBase, h: hslBase.h + 30 },
    ],
    4,
    [base.id_color]
  );
  const triadicos = tomarCercanos(
    disponibles,
    [
      { ...hslBase, h: hslBase.h + 120 },
      { ...hslBase, h: hslBase.h + 240 },
    ],
    2,
    [base.id_color]
  );
  const monocromaticos = tomarMonocromaticos(disponibles, base, hslBase);

  return [
    {
      nombre: 'Complementario',
      descripcion: 'Color real de la carta más cercano al contraste opuesto del color seleccionado.',
      colores: complementario.length ? [base, ...complementario] : [base],
    },
    {
      nombre: 'Análogos',
      descripcion: 'Colores reales cercanos al tono activo dentro del círculo cromático.',
      colores: analogos,
    },
    {
      nombre: 'Triádico',
      descripcion: 'Colores reales cercanos a los tonos separados por 120°.',
      colores: [base, ...triadicos],
    },
    {
      nombre: 'Monocromático',
      descripcion: 'Colores reales similares al tono activo con variaciones de claridad.',
      colores: [base, ...monocromaticos].slice(0, 5),
    },
  ].filter((esquema) => esquema.colores.length > 0);
}

export function useCombinacionesPaleta(
  colores: ComputedRef<readonly ColorPaletaPublica[]>,
  seleccionado: ComputedRef<ColorPaletaPublica | null>
) {
  const esquemas = computed<EsquemaColorPublico[]>(() => {
    const actual = seleccionado.value;
    if (!actual) return [];

    const hsl = hexAHsl(actual.muestra_hex);
    if (!hsl) return [];

    return esquemasDesdeColoresReales(colores.value, actual, hsl);
  });

  return { esquemas };
}

export const combinacionesPaletaDebug = { hexAHsl, distanciaHue };
