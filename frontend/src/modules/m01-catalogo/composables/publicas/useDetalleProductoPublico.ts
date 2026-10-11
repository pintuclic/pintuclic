import { computed, onMounted, ref, watch, type Ref } from 'vue';
import { CatalogoPublicoService } from '../../services/publicas/catalogo-publico.service';
import { useProductosComplementarios } from './useProductosComplementarios';
import type { CatalogoPublicoGateway, CategoriaPublica, FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

export function useDetalleProductoPublico(idProducto: Ref<number>, servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
  const categorias = ref<CategoriaPublica[]>([]);
  const producto = ref<FichaProductoPublico | null>(null);
  const varianteSeleccionadaId = ref<number | null>(null);
  const cargando = ref(true);
  const error = ref<string | null>(null);
  const varianteSeleccionada = computed(() => producto.value?.variantes.find((item) => item.id_variante === varianteSeleccionadaId.value) ?? producto.value?.variantes[0] ?? null);
  // HU-CAT-08 se carga aparte: un fallo de complementarios no impide mostrar la ficha.
  const { complementarios } = useProductosComplementarios(idProducto, servicio);
  let solicitud = 0;

  async function cargar(): Promise<void> {
    const actual = ++solicitud;
    cargando.value = true;
    error.value = null;
    try {
      const [ficha, categoriasPublicas] = await Promise.all([
        servicio.obtenerFicha(idProducto.value),
        servicio.listarCategorias(),
      ]);
      // Al cambiar rápido de producto, una respuesta antigua no reemplaza la ficha actual.
      if (actual !== solicitud) return;
      producto.value = ficha;
      categorias.value = categoriasPublicas;
      varianteSeleccionadaId.value = ficha.variantes[0]?.id_variante ?? null;
    } catch {
      if (actual !== solicitud) return;
      producto.value = null;
      error.value = 'Este producto no está disponible en el catálogo público.';
    } finally {
      if (actual === solicitud) cargando.value = false;
    }
  }

  onMounted(() => { void cargar(); });
  watch(idProducto, () => { void cargar(); });

  return { cargar, cargando, categorias, complementarios, error, producto, varianteSeleccionada, varianteSeleccionadaId };
}
