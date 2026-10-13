import type { VariantePublica } from '../../interfaces/publicas/catalogo-publico.interface';

/** Rango de precio activo en el catálogo (límites opcionales, en pesos). */
export interface RangoPrecioVariante {
  readonly min?: number;
  readonly max?: number;
}

const dentroDelRango = (precio: number, rango?: RangoPrecioVariante | null): boolean =>
  !rango || ((rango.min === undefined || precio >= rango.min) && (rango.max === undefined || precio <= rango.max));

/**
 * Misma selección para el precio de la tarjeta y su compra rápida.
 * Con un rango de precio activo se elige una variante DENTRO del rango: el filtro devuelve el
 * producto porque alguna variante lo cumple, y mostrar otra (más barata, fuera del rango)
 * hacía parecer que el filtro no funcionaba y agregaba al carrito una variante de otro precio.
 */
export function seleccionarVarianteCompraRapida(
  variantes: readonly VariantePublica[],
  idColor?: number | null,
  rango?: RangoPrecioVariante | null,
): VariantePublica | undefined {
  const delColor = idColor == null ? [] : variantes.filter((v) => v.id_color === idColor);
  const conPrecio = (delColor.length ? delColor : variantes).filter((variante) => Number.isFinite(variante.precio_vigente));
  const enRango = conPrecio.filter((variante) => dentroDelRango(variante.precio_vigente, rango));
  const base = enRango.length ? enRango : conPrecio;
  const disponibles = base.filter((variante) => variante.existencia_referencial > 0);
  const candidatas = disponibles.length ? disponibles : base;
  return candidatas.reduce<VariantePublica | undefined>((menor, variante) =>
    !menor || variante.precio_vigente < menor.precio_vigente ? variante : menor, undefined);
}
