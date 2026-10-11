import { onMounted, ref, watch, type Ref } from 'vue';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';
import type { CatalogoPublicoGateway, ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

/** Máximo que muestra la ficha (RF-CAT-08-02: hasta 4). */
export const MAX_COMPLEMENTARIOS = 4;

/**
 * HU-CAT-08: productos que se muestran en la ficha. La selección es del endpoint
 * oficial (categoría complementaria del producto y, si no hay, patrocinados); aquí
 * solo se carga, se enriquece y se depura sin inventar relaciones:
 *  - sin el producto actual ni repetidos, y como máximo 4;
 *  - sin los que no tienen ficha pública o ninguna variante activa. Se usa la ficha
 *    que el enriquecimiento ya trae, sin consultas adicionales.
 * Un fallo deja la lista vacía (la sección se oculta) y nunca afecta a la ficha.
 */
export function useProductosComplementarios(
  idProducto: Ref<number>,
  servicio: CatalogoPublicoGateway = CatalogoPublicoService,
) {
  const complementarios = ref<ProductoDestacadoPublico[]>([]);
  const cargando = ref(false);
  let solicitud = 0;

  async function cargar(): Promise<void> {
    const actual = ++solicitud;
    const id = idProducto.value;
    complementarios.value = [];
    cargando.value = true;
    try {
      const vistos = new Set<number>([id]);
      const resumenes = (await servicio.listarComplementarios(id))
        .filter((p) => !vistos.has(p.id_producto) && vistos.add(p.id_producto))
        .slice(0, MAX_COMPLEMENTARIOS);
      const enriquecidos = await enriquecerProductosPublicos(resumenes, servicio);
      // Al cambiar rápido de producto, una respuesta antigua no sobrescribe la actual.
      if (actual !== solicitud) return;
      complementarios.value = enriquecidos.filter((p) => (p.detalle?.variantes.length ?? 0) > 0);
    } catch {
      if (actual === solicitud) complementarios.value = [];
    } finally {
      if (actual === solicitud) cargando.value = false;
    }
  }

  onMounted(() => { void cargar(); });
  watch(idProducto, () => { void cargar(); });

  return { complementarios, cargando, cargar };
}
