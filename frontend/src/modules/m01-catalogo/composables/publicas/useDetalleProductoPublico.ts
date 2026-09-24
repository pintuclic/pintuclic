import { computed, onMounted, ref, watch, type Ref } from 'vue';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';
import type { CatalogoPublicoGateway, CategoriaPublica, FichaProductoPublico, ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

export function useDetalleProductoPublico(idProducto: Ref<number>, servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
  const categorias = ref<CategoriaPublica[]>([]);
  const producto = ref<FichaProductoPublico | null>(null);
  const complementarios = ref<ProductoDestacadoPublico[]>([]);
  const varianteSeleccionadaId = ref<number | null>(null);
  const cargando = ref(true);
  const error = ref<string | null>(null);
  const varianteSeleccionada = computed(() => producto.value?.variantes.find((item) => item.id_variante === varianteSeleccionadaId.value) ?? producto.value?.variantes[0] ?? null);

  async function cargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const [ficha, categoriasPublicas, resumenes] = await Promise.all([
        servicio.obtenerFicha(idProducto.value),
        servicio.listarCategorias(),
        servicio.listarComplementarios(idProducto.value),
      ]);
      producto.value = ficha;
      categorias.value = categoriasPublicas;
      varianteSeleccionadaId.value = ficha.variantes[0]?.id_variante ?? null;
      complementarios.value = await enriquecerProductosPublicos(resumenes, servicio);
    } catch {
      producto.value = null;
      error.value = 'Este producto no está disponible en el catálogo público.';
    } finally {
      cargando.value = false;
    }
  }

  onMounted(() => { void cargar(); });
  watch(idProducto, () => { void cargar(); });

  return { cargar, cargando, categorias, complementarios, error, producto, varianteSeleccionada, varianteSeleccionadaId };
}
