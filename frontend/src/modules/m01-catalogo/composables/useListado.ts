import { computed, ref, shallowRef, watch } from 'vue';
import { mensajeError } from '../services/http';

/**
 * ==============================================================================
 * M01 - LISTADO REUTILIZABLE (carga + error + búsqueda + paginación en cliente)
 * Ubicación: src/modules/m01-catalogo/composables/useListado.ts
 *
 * El backend administrativo devuelve listas completas (sin paginar), así que la
 * búsqueda local y la paginación se resuelven aquí, una sola vez para todas las
 * vistas. Si la petición falla se expone `error`; NUNCA se inventan datos.
 * ==============================================================================
 */
export function useListado<T>(
  cargar: () => Promise<T[]>,
  opciones: {
    /** Texto contra el que se busca (en minúsculas); omitirlo desactiva la búsqueda local. */
    texto?: (item: T) => string;
    /** Filtro adicional de la vista (estado, familia, marca…). */
    filtro?: (item: T) => boolean;
    porPagina?: number;
  } = {},
) {
  const items = shallowRef<T[]>([]);
  const cargando = ref(false);
  const error = ref<string | null>(null);
  const busqueda = ref('');
  const pagina = ref(1);
  const porPagina = opciones.porPagina ?? 10;

  const filtrados = computed(() => {
    const q = busqueda.value.trim().toLowerCase();
    return items.value.filter((item) =>
      (!q || !opciones.texto || opciones.texto(item).toLowerCase().includes(q)) &&
      (!opciones.filtro || opciones.filtro(item)),
    );
  });

  const visibles = computed(() => filtrados.value.slice((pagina.value - 1) * porPagina, pagina.value * porPagina));
  const total = computed(() => filtrados.value.length);

  watch(busqueda, () => { pagina.value = 1; });
  // Si el filtro reduce el total, no dejar al usuario en una página vacía.
  watch(total, (t) => {
    const ultima = Math.max(1, Math.ceil(t / porPagina));
    if (pagina.value > ultima) pagina.value = ultima;
  });

  async function recargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      items.value = await cargar();
    } catch (e) {
      items.value = [];
      error.value = mensajeError(e);
    } finally {
      cargando.value = false;
    }
  }

  return { items, visibles, filtrados, total, cargando, error, busqueda, pagina, porPagina, recargar };
}
