import { computed, onMounted, ref, watch, type Ref } from 'vue';
import { CatalogoPublicoService } from '../../services/publicas/catalogo-publico.service';
import { useProductosComplementarios } from './useProductosComplementarios';
import type { CatalogoPublicoGateway, FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

export function useDetalleProductoPublico(idProducto: Ref<number>, servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
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
      // Solo la ficha: las categorías ya no se piden aquí, así un fallo de ese servicio no
      // muestra el producto como «no disponible» (el menú vive en el encabezado).
      const ficha = await servicio.obtenerFicha(idProducto.value);
      // Al cambiar rápido de producto, una respuesta antigua no reemplaza la ficha actual.
      if (actual !== solicitud) return;
      producto.value = ficha;
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

  return { cargar, cargando, complementarios, error, producto, varianteSeleccionada, varianteSeleccionadaId };
}
