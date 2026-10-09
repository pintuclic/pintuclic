import { computed, isRef, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { normalizarBusquedaCatalogoPublico } from '../../dtos/publicas/catalogo-publico.dto';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import type { CatalogoPublicoGateway, CategoriaPublica, ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';
import type { FacetasBusquedaFrontend, OrdenBusqueda } from '@/modules/m02-busqueda/interfaces/busqueda.interface';

const LIMITE_PAGINA = 8;
const ESPERA_BUSQUEDA_MS = 300;

/** El input limita a 120 caracteres; un valor externo inválido se trata como vacío. */
function terminoNormalizado(valor: string): string {
  try {
    return normalizarBusquedaCatalogoPublico(valor).q;
  } catch {
    return '';
  }
}

export function useCatalogoPublico(servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
  const route = useRoute();
  const router = useRouter();

  const categorias = ref<CategoriaPublica[]>([]);
  const productos = ref<ProductoDestacadoPublico[]>([]);
  const pagina = ref(1);
  const total = ref(0);
  const termino = ref(String(route?.query?.q || ''));
  /** Término de la última consulta lanzada: evita repetirla y define el color coincidente. */
  const terminoAplicado = ref(terminoNormalizado(termino.value));
  let temporizadorBusqueda: ReturnType<typeof setTimeout> | undefined;
  let solicitudProductos = 0;
  let solicitudFacetas = 0;
  const subcategoria = ref<number | undefined>();
  const marcasSeleccionadas = ref<number[]>([]);
  const lineasSeleccionadas = ref<number[]>([]);
  const resinasSeleccionadas = ref<number[]>([]);
  const coloresSeleccionados = ref<number[]>([]);
  const presentacionesSeleccionadas = ref<number[]>([]);
  const precioMin = ref<number | undefined>();
  const precioMax = ref<number | undefined>();
  const orden = ref<OrdenBusqueda>('relevancia');

  const cargando = ref(true);
  const error = ref<string | null>(null);
  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE_PAGINA)));

  const facetas = ref<FacetasBusquedaFrontend>({
    categorias: [],
    subcategorias: [],
    marcas: [],
    lineas: [],
    resinas: [],
    colores: [],
    presentaciones: [],
  });

  async function cargarFacetas(): Promise<void> {
    const solicitud = ++solicitudFacetas;
    try {
      const q = terminoAplicado.value;
      const resFacetas = await BusquedaService.facetas({
        ...(q ? { q } : {}),
        ...(subcategoria.value !== undefined ? { subcategoria: subcategoria.value } : {}),
        marca: marcasSeleccionadas.value,
        linea: lineasSeleccionadas.value,
        resina: resinasSeleccionadas.value,
        color: coloresSeleccionados.value,
        presentacion: presentacionesSeleccionadas.value,
        precio_min: precioMin.value,
        precio_max: precioMax.value,
      });
      if (solicitud === solicitudFacetas) facetas.value = resFacetas;
    } catch {
      // Si falla facetas, no interrumpir la navegación
    }
  }

  async function cargarProductos(): Promise<void> {
    // Solo la consulta más reciente puede actualizar resultados y estados.
    const solicitud = ++solicitudProductos;
    terminoAplicado.value = terminoNormalizado(termino.value);
    cargando.value = true;
    error.value = null;
    try {
      const q = terminoAplicado.value;
      const resultado = await BusquedaService.buscar({
        ...(q ? { q } : {}),
        ...(subcategoria.value !== undefined ? { subcategoria: subcategoria.value } : {}),
        marca: marcasSeleccionadas.value,
        linea: lineasSeleccionadas.value,
        resina: resinasSeleccionadas.value,
        color: coloresSeleccionados.value,
        presentacion: presentacionesSeleccionadas.value,
        precio_min: precioMin.value,
        precio_max: precioMax.value,
        orden: orden.value,
        pagina: pagina.value,
        limite: LIMITE_PAGINA,
      });

      const enriquecidos = await enriquecerProductosPublicos(resultado.items, servicio);
      if (solicitud !== solicitudProductos) return;
      productos.value = enriquecidos;
      total.value = resultado.total;
      void cargarFacetas();
    } catch {
      if (solicitud === solicitudProductos) {
        error.value = 'No fue posible cargar el catálogo público. Intenta nuevamente.';
      }
    } finally {
      if (solicitud === solicitudProductos) cargando.value = false;
    }
  }

  async function cargarInicio(): Promise<void> {
    try {
      categorias.value = await servicio.listarCategorias();
    } catch {
      error.value = 'No fue posible cargar las categorías públicas.';
    }
    await cargarProductos();
  }

  function cancelarBusquedaPendiente(): void {
    if (temporizadorBusqueda !== undefined) {
      clearTimeout(temporizadorBusqueda);
      temporizadorBusqueda = undefined;
    }
  }

  /** Lanza la búsqueda del término actual si difiere de la última consulta. */
  function aplicarBusqueda(reemplazarUrl: boolean): void {
    cancelarBusquedaPendiente();
    if (terminoNormalizado(termino.value) === terminoAplicado.value) return;
    pagina.value = 1;
    void cargarProductos();
    actualizarUrlParams(reemplazarUrl);
  }

  /** Enter o botón de buscar: aplica de inmediato sin esperar el debounce. */
  function buscar(): void {
    aplicarBusqueda(false);
  }

  // Búsqueda en tiempo real: escribir o borrar actualiza resultados tras una pausa.
  watch(termino, () => {
    cancelarBusquedaPendiente();
    temporizadorBusqueda = setTimeout(() => aplicarBusqueda(true), ESPERA_BUSQUEDA_MS);
  });

  function seleccionarSubcategoria(id: number | undefined): void {
    subcategoria.value = id;
    pagina.value = 1;
    actualizarUrlParams();
    void cargarProductos();
  }

  function toggleFiltro(lista: Ref<number[]> | number[], id: number): void {
    const arr = isRef(lista) ? lista.value : lista;
    const idx = arr.indexOf(id);
    if (idx >= 0) {
      arr.splice(idx, 1);
    } else {
      arr.push(id);
    }
    pagina.value = 1;
    actualizarUrlParams();
    void cargarProductos();
  }

  function cambiarOrden(nuevoOrden: OrdenBusqueda): void {
    orden.value = nuevoOrden;
    pagina.value = 1;
    actualizarUrlParams();
    void cargarProductos();
  }

  function aplicarRangoPrecio(min?: number, max?: number): void {
    precioMin.value = min;
    precioMax.value = max;
    pagina.value = 1;
    actualizarUrlParams();
    void cargarProductos();
  }

  function irPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas.value) return;
    pagina.value = nuevaPagina;
    actualizarUrlParams();
    void cargarProductos();
  }

  function limpiar(): void {
    cancelarBusquedaPendiente();
    termino.value = '';
    subcategoria.value = undefined;
    marcasSeleccionadas.value = [];
    lineasSeleccionadas.value = [];
    resinasSeleccionadas.value = [];
    coloresSeleccionados.value = [];
    presentacionesSeleccionadas.value = [];
    precioMin.value = undefined;
    precioMax.value = undefined;
    orden.value = 'relevancia';
    pagina.value = 1;
    void router.push({ path: '/catalogo' });
    void cargarProductos();
  }

  /** `reemplazar` evita llenar el historial con cada pausa al escribir. */
  function actualizarUrlParams(reemplazar = false): void {
    const query: Record<string, string | number> = {};
    const q = terminoNormalizado(termino.value);
    if (q) query.q = q;
    if (subcategoria.value !== undefined) query.subcategoria = subcategoria.value;
    if (marcasSeleccionadas.value.length) query.marca = marcasSeleccionadas.value.join(',');
    if (lineasSeleccionadas.value.length) query.linea = lineasSeleccionadas.value.join(',');
    if (resinasSeleccionadas.value.length) query.resina = resinasSeleccionadas.value.join(',');
    if (coloresSeleccionados.value.length) query.color = coloresSeleccionados.value.join(',');
    if (presentacionesSeleccionadas.value.length) query.presentacion = presentacionesSeleccionadas.value.join(',');
    if (precioMin.value !== undefined && precioMin.value > 0) query.precioMin = precioMin.value;
    if (precioMax.value !== undefined && precioMax.value > 0) query.precioMax = precioMax.value;
    if (orden.value !== 'relevancia') query.orden = orden.value;
    if (pagina.value > 1) query.pagina = pagina.value;

    const destino = { path: '/catalogo', query };
    if (reemplazar) void router.replace(destino);
    else void router.push(destino);
  }

  function sincronizarDesdeRuta(): void {
    const qRaw = route?.query?.q;
    if (qRaw !== undefined && qRaw !== null) {
      termino.value = String(qRaw);
    }

    const subRaw = route?.query?.subcategoria;
    if (subRaw !== undefined && subRaw !== null && subRaw !== '') {
      const num = Number(subRaw);
      if (!Number.isNaN(num)) subcategoria.value = num;
    }

    const ordenRaw = route?.query?.orden as OrdenBusqueda;
    if (ordenRaw && ['relevancia', 'precio_asc', 'precio_desc', 'novedad'].includes(ordenRaw)) {
      orden.value = ordenRaw;
    }

    const pagRaw = Number(route?.query?.pagina);
    if (!Number.isNaN(pagRaw) && pagRaw > 0) {
      pagina.value = pagRaw;
    }
  }

  // Navegación externa (buscador del header, atrás/adelante): solo recarga si la URL
  // difiere del estado ya aplicado, para no duplicar las consultas propias.
  watch(
    () => route?.query,
    (nuevoQuery, anteriorQuery) => {
      let recargar = false;
      if (nuevoQuery?.q !== anteriorQuery?.q) {
        const qRuta = String(nuevoQuery?.q || '');
        if (terminoNormalizado(qRuta) !== terminoAplicado.value) {
          cancelarBusquedaPendiente();
          termino.value = qRuta;
          recargar = true;
        }
      }
      if (nuevoQuery?.subcategoria !== anteriorQuery?.subcategoria) {
        const num = Number(nuevoQuery?.subcategoria);
        const subRuta = !Number.isNaN(num) && nuevoQuery?.subcategoria !== undefined ? num : undefined;
        if (subRuta !== subcategoria.value) {
          subcategoria.value = subRuta;
          recargar = true;
        }
      }
      if (recargar) {
        pagina.value = 1;
        void cargarProductos();
      }
    }
  );

  onMounted(() => {
    sincronizarDesdeRuta();
    terminoAplicado.value = terminoNormalizado(termino.value);
    void cargarInicio();
  });

  onBeforeUnmount(cancelarBusquedaPendiente);

  return {
    buscar,
    cargando,
    cargarInicio,
    categorias,
    error,
    irPagina,
    limpiar,
    pagina,
    productos,
    seleccionarSubcategoria,
    subcategoria,
    termino,
    terminoAplicado,
    total,
    totalPaginas,
    // Estados y acciones avanzadas M02
    facetas,
    marcasSeleccionadas,
    lineasSeleccionadas,
    resinasSeleccionadas,
    coloresSeleccionados,
    presentacionesSeleccionadas,
    precioMin,
    precioMax,
    orden,
    cambiarOrden,
    toggleFiltro,
    aplicarRangoPrecio,
  };
}
