// ==============================================================================
// M01 - FAMILIA CROMÁTICA DERIVADA DEL HEXADECIMAL (RF-CAT-05-03)
// Mientras las familias no se declaren de forma administrable, se derivan del
// tono del hexadecimal. Los identificadores coinciden con los filtros de la
// carta y la paleta públicas.
// ==============================================================================

export type FamiliaCromatica = 'rojos' | 'amarillos' | 'verdes' | 'azules' | 'grises';

/** Por debajo de esta croma (0..1) el color se percibe neutro: blancos, grises y negros. */
const CROMA_NEUTRA = 0.12;

/** RF-CAT-05-03: familia a partir del tono (HSL) de un `#RRGGBB`. */
export function familiaCromatica(hexadecimal: string): FamiliaCromatica {
  const r = parseInt(hexadecimal.slice(1, 3), 16) / 255;
  const g = parseInt(hexadecimal.slice(3, 5), 16) / 255;
  const b = parseInt(hexadecimal.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const croma = max - Math.min(r, g, b);
  if (croma < CROMA_NEUTRA) return 'grises';

  const sector = max === r ? ((g - b) / croma) % 6 : max === g ? (b - r) / croma + 2 : (r - g) / croma + 4;
  const tono = (sector * 60 + 360) % 360;
  if (tono < 30 || tono >= 285) return 'rojos';
  if (tono < 75) return 'amarillos';
  if (tono < 165) return 'verdes';
  return 'azules';
}
