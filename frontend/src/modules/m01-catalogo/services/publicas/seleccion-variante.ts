import type { VariantePublica } from '../../interfaces/publicas/catalogo-publico.interface';

/** Misma selección para el precio de la tarjeta y su compra rápida. */
export function seleccionarVarianteCompraRapida(variantes: readonly VariantePublica[], idColor?: number | null): VariantePublica | undefined {
  const delColor = idColor == null ? [] : variantes.filter((v) => v.id_color === idColor);
  const conPrecio = (delColor.length ? delColor : variantes).filter((variante) => Number.isFinite(variante.precio_vigente));
  const disponibles = conPrecio.filter((variante) => variante.existencia_referencial > 0);
  const candidatas = disponibles.length ? disponibles : conPrecio;
  return candidatas.reduce<VariantePublica | undefined>((menor, variante) =>
    !menor || variante.precio_vigente < menor.precio_vigente ? variante : menor, undefined);
}
