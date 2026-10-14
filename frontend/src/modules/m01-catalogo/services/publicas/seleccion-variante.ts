import type { VariantePublica } from '../../interfaces/publicas/catalogo-publico.interface';

/** Filtros activos del catálogo que la variante mostrada debe cumplir (todos opcionales). */
export interface FiltrosVariante {
  /** Precio mínimo y máximo, en pesos. */
  readonly min?: number;
  readonly max?: number;
  /** Ids de presentación seleccionados (OR dentro del grupo). */
  readonly presentaciones?: readonly number[];
  /** Ids de color seleccionados (OR dentro del grupo). */
  readonly colores?: readonly number[];
}

type Condicion = (variante: VariantePublica) => boolean;

/** Condiciones activas, en orden de prioridad: color, presentación y precio. */
function condiciones(filtros?: FiltrosVariante | null): Condicion[] {
  if (!filtros) return [];
  const lista: Condicion[] = [];
  if (filtros.colores?.length) lista.push((v) => v.id_color != null && filtros.colores!.includes(v.id_color));
  if (filtros.presentaciones?.length) lista.push((v) => filtros.presentaciones!.includes(v.id_presentacion));
  if (filtros.min !== undefined || filtros.max !== undefined) {
    lista.push((v) => (filtros.min === undefined || v.precio_vigente >= filtros.min) && (filtros.max === undefined || v.precio_vigente <= filtros.max));
  }
  return lista;
}

/** true si la variante cumple todos los filtros activos (o no hay filtros). */
export function cumpleTodosLosFiltros(variante: VariantePublica, filtros?: FiltrosVariante | null): boolean {
  return condiciones(filtros).every((condicion) => condicion(variante));
}

/**
 * Variantes que cumplen el máximo posible de filtros. Se intenta con todos; si ninguna variante
 * los cumple a la vez (la búsqueda puede devolver un producto que cumple cada filtro con una
 * variante distinta), se van soltando los de menor prioridad: primero el precio, luego la
 * presentación. Así la tarjeta muestra la variante más cercana a lo filtrado, y lo avisa
 * (`cumpleTodosLosFiltros`) en lugar de presentarla como si cumpliera todo.
 */
function cumplenFiltros(variantes: readonly VariantePublica[], filtros?: FiltrosVariante | null): readonly VariantePublica[] {
  const activas = condiciones(filtros);
  for (let cuantas = activas.length; cuantas > 0; cuantas--) {
    const subconjunto = activas.slice(0, cuantas);
    const coinciden = variantes.filter((v) => subconjunto.every((condicion) => condicion(v)));
    if (coinciden.length) return coinciden;
  }
  return variantes;
}

/**
 * Misma selección para el precio de la tarjeta y su compra rápida.
 * Con filtros activos (color, presentación o precio) se elige una variante que los cumpla: el
 * filtro devuelve el producto porque alguna variante lo cumple, y mostrar otra (de otro color,
 * otra presentación u otro precio) hacía parecer que el filtro no funcionaba y agregaba al
 * carrito una variante distinta de la filtrada.
 */
export function seleccionarVarianteCompraRapida(
  variantes: readonly VariantePublica[],
  idColor?: number | null,
  filtros?: FiltrosVariante | null,
): VariantePublica | undefined {
  const delColor = idColor == null ? [] : variantes.filter((v) => v.id_color === idColor);
  const conPrecio = (delColor.length ? delColor : variantes).filter((variante) => Number.isFinite(variante.precio_vigente));
  const base = cumplenFiltros(conPrecio, filtros);
  const disponibles = base.filter((variante) => variante.existencia_referencial > 0);
  const candidatas = disponibles.length ? disponibles : base;
  return candidatas.reduce<VariantePublica | undefined>((menor, variante) =>
    !menor || variante.precio_vigente < menor.precio_vigente ? variante : menor, undefined);
}
