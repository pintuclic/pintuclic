import { computed, ref, watch } from 'vue';
import { OrdenesService } from '../services/ordenes.service';
import { clasificarErrorCarga, type TipoErrorCarga } from './clasificarErrorCarga';
import { FILTROS } from '../dtos/estado-pedido.dto';
import type { PedidosCliente, ResumenPedido } from '../interfaces/ordenes.interface';

/**
 * ==============================================================================
 * M08 - LÓGICA DE LA SECCIÓN «MIS PEDIDOS» (HU-ORD-07)
 * Ubicación: src/modules/m08-ordenes/composables/useMisPedidos.ts
 *
 * El backend devuelve los pedidos YA separados en `en_curso` y `finalizados`, así
 * que aquí no se clasifica: solo se busca, se filtra y se pagina.
 *
 * ⚠️ El filtrado y la paginación se resuelven EN CLIENTE porque el endpoint no
 * admite ni filtros ni paginación: devuelve todos los pedidos del cliente de una
 * vez. La búsqueda, en cambio, SÍ va al servidor, porque busca también dentro de
 * los productos de cada pedido y eso el cliente no puede hacerlo.
 *
 * Si la consulta falla NUNCA se muestran datos de ejemplo: la lista queda vacía,
 * `tipoError` indica el motivo y la vista ofrece reintentar. Mientras hay error,
 * `sinPedidos` y `sinResultados` son falsos para no afirmar «no tienes pedidos».
 * ==============================================================================
 */

const VACIO: PedidosCliente = { en_curso: [], finalizados: [] };

export function useMisPedidos(opciones: { porPagina?: number } = {}) {
  const porPagina = opciones.porPagina ?? 5;

  const pedidos = ref<PedidosCliente>(VACIO);
  const cargando = ref(false);
  const error = ref<string | null>(null);
  const tipoError = ref<TipoErrorCarga | null>(null);
  const busqueda = ref('');
  const filtro = ref('todos');
  const pagina = ref(1);

  let debounce: ReturnType<typeof setTimeout> | undefined;

  async function cargar(): Promise<void> {
    cargando.value = true;
    error.value = null;
    tipoError.value = null;
    try {
      pedidos.value = await OrdenesService.misPedidos(busqueda.value);
    } catch (e: unknown) {
      pedidos.value = VACIO;
      tipoError.value = clasificarErrorCarga(e);
      error.value =
        tipoError.value === 'sesion'
          ? 'Inicia sesión para ver tus pedidos.'
          : 'No pudimos cargar tus pedidos. Inténtalo de nuevo en unos segundos.';
    } finally {
      cargando.value = false;
    }
  }

  function buscar(texto: string): void {
    busqueda.value = texto;
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => void cargar(), 350);
  }

  const estadosDelFiltro = computed(
    () => FILTROS.find((f) => f.id === filtro.value)?.estados ?? []
  );

  function aplicarFiltro(lista: ReadonlyArray<ResumenPedido>): ResumenPedido[] {
    const estados = estadosDelFiltro.value;
    if (estados.length === 0) return [...lista];
    return lista.filter((p) => estados.includes(p.estado));
  }

  /** Grupos tras aplicar el filtro, antes de paginar. */
  const enCursoFiltrados = computed(() => aplicarFiltro(pedidos.value.en_curso));
  const finalizadosFiltrados = computed(() => aplicarFiltro(pedidos.value.finalizados));

  const total = computed(() => enCursoFiltrados.value.length + finalizadosFiltrados.value.length);
  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / porPagina)));

  /**
   * La paginación recorre la lista completa (en curso + finalizados) y luego se
   * vuelve a separar en grupos, para que los encabezados solo aparezcan si la
   * página actual contiene pedidos de ese grupo.
   */
  const ventana = computed(() => {
    const todos = [...enCursoFiltrados.value, ...finalizadosFiltrados.value];
    const desde = (pagina.value - 1) * porPagina;
    return todos.slice(desde, desde + porPagina);
  });

  const enCurso = computed(() =>
    ventana.value.filter((p) => enCursoFiltrados.value.includes(p))
  );
  const finalizados = computed(() =>
    ventana.value.filter((p) => finalizadosFiltrados.value.includes(p))
  );

  /** Distingue «no tienes pedidos» de «tu búsqueda o filtro no encontró nada». */
  const sinPedidos = computed(
    () =>
      tipoError.value === null &&
      pedidos.value.en_curso.length === 0 &&
      pedidos.value.finalizados.length === 0
  );
  const sinResultados = computed(
    () => tipoError.value === null && !sinPedidos.value && total.value === 0
  );

  // Cambiar de filtro o de búsqueda devuelve siempre a la primera página.
  watch([filtro, busqueda], () => {
    pagina.value = 1;
  });

  return {
    pedidos,
    enCurso,
    finalizados,
    total,
    totalPaginas,
    pagina,
    cargando,
    error,
    tipoError,
    busqueda,
    filtro,
    sinPedidos,
    sinResultados,
    cargar,
    buscar,
  };
}
