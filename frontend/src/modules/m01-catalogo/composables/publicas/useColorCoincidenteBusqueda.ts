import type { VariantePublica } from '../../interfaces/publicas/catalogo-publico.interface';

/**
 * ==============================================================================
 * M01/M02 - COLOR COINCIDENTE CON LA BÚSQUEDA (useColorCoincidenteBusqueda)
 * Ubicación: src/modules/m01-catalogo/composables/publicas/useColorCoincidenteBusqueda.ts
 *
 * La API de búsqueda (`/busqueda/productos`) no informa qué color coincidió, pero
 * busca sobre el nombre del color de las variantes (unaccent + lower). Aquí se
 * replica esa coincidencia con las variantes ya cargadas en la ficha pública para
 * que la tarjeta muestre el HEX real de la variante buscada.
 * ==============================================================================
 */

const HEX_VALIDO = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Minúsculas, sin tildes y con espacios simples, como `unaccent(lower(...))`. */
export function normalizarTextoBusqueda(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Menor rango = coincidencia más precisa con el nombre del color. */
function rangoCoincidencia(nombre: string, familia: string, termino: string, palabras: string[]): number | null {
  if (nombre === termino) return 0;
  if (nombre.startsWith(termino)) return 1;
  if (nombre.includes(termino)) return 2;
  const texto = `${nombre} ${familia}`;
  return palabras.every((palabra) => texto.includes(palabra)) ? 3 : null;
}

/**
 * Devuelve el HEX de la variante cuyo color coincide con el término buscado, o
 * `null` si ninguna coincide o no tiene muestra válida (la tarjeta usa entonces su
 * comportamiento predeterminado). Con varias coincidencias el resultado es
 * determinista: mejor rango y, a igualdad, menor `id_color` e `id_variante`.
 */
export function obtenerMuestraColorCoincidente(
  variantes: readonly VariantePublica[],
  terminoBuscado: string,
): string | null {
  const termino = normalizarTextoBusqueda(terminoBuscado);
  if (!termino) return null;
  const palabras = termino.split(' ');

  let mejor: { rango: number; variante: VariantePublica } | null = null;
  for (const variante of variantes) {
    if (!variante.color || !variante.muestra_hex || !HEX_VALIDO.test(variante.muestra_hex)) continue;

    const rango = rangoCoincidencia(
      normalizarTextoBusqueda(variante.color),
      normalizarTextoBusqueda(variante.familia_color ?? ''),
      termino,
      palabras,
    );
    if (rango === null) continue;

    const esMejor =
      !mejor ||
      rango < mejor.rango ||
      (rango === mejor.rango &&
        ((variante.id_color ?? Infinity) < (mejor.variante.id_color ?? Infinity) ||
          (variante.id_color === mejor.variante.id_color && variante.id_variante < mejor.variante.id_variante)));
    if (esMejor) mejor = { rango, variante };
  }

  return mejor?.variante.muestra_hex ?? null;
}
