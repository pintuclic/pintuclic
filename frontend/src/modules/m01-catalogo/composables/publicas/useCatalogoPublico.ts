import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { normalizarBusquedaCatalogoPublico } from '../../dtos/publicas/catalogo-publico.dto';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import type { CatalogoPublicoGateway, CategoriaPublica, ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';
import type { FacetasBusquedaFrontend, OrdenBusqueda } from '@/modules/m02-busqueda/interfaces/busqueda.interface';

const LIMITE_PAGINA = 8;

export function useCatalogoPublico(servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
  const route = useRoute();
  const router = useRouter();

  const categorias = ref<CategoriaPublica[]>([]);
  const productos = ref<ProductoDestacadoPublico[]>([]);
  const pagina = ref(1);
  const total = ref(0);
  const termino = ref(String(route?.query?.q || ''));
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
    try {
      const { q } = normalizarBusquedaCatalogoPublico(termino.value);
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
      facetas.value = resFacetas;
    } catch {
      // Si falla facetas, no interrumpir la navegación
    }
  }

  async function cargarProductos(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const { q } = normalizarBusquedaCatalogoPublico(termino.value);
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

      productos.value = await enriquecerProductosPublicos(resultado.items, servicio);
      total.value = resultado.total;
      void cargarFacetas();
    } catch {
      error.value = 'No fue posible cargar el catálogo público. Intenta nuevamente.';
    } finally {
      cargando.value = false;
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

  function buscar(): void {
    pagina.value = 1;
    actualizarUrlParams();
    void cargarProductos();
  }

  function seleccionarSubcategoria(id: number | undefined): void {
    subcategoria.value = id;
    pagina.value = 1;
    actualizarUrlParams();
    void cargarProductos();
  }

  function toggleFiltro(lista: typeof marcasSeleccionadas, id: number): void {
    const idx = lista.value.indexOf(id);
    if (idx >= 0) {
      lista.value.splice(idx, 1);
    } else {
      lista.value.push(id);
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

  function actualizarUrlParams(): void {
    const query: Record<string, string | number> = {};
    if (termino.value.trim()) query.q = termino.value.trim();
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

    void router.push({ path: '/catalogo', query });
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

  watch(
    () => route?.query,
    (nuevoQuery, anteriorQuery) => {
      if (nuevoQuery?.q !== anteriorQuery?.q) {
        termino.value = String(nuevoQuery?.q || '');
        pagina.value = 1;
        void cargarProductos();
      }
      if (nuevoQuery?.subcategoria !== anteriorQuery?.subcategoria) {
        const num = Number(nuevoQuery?.subcategoria);
        subcategoria.value = !Number.isNaN(num) && nuevoQuery?.subcategoria !== undefined ? num : undefined;
        pagina.value = 1;
        void cargarProductos();
      }
    }
  );

  onMounted(() => {
    sincronizarDesdeRuta();
    void cargarInicio();
  });

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
