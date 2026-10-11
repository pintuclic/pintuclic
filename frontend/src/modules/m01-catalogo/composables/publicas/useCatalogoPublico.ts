import { computed, isRef, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useRoute, useRouter, type LocationQuery } from 'vue-router';
import { normalizarBusquedaCatalogoPublico } from '../../dtos/publicas/catalogo-publico.dto';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import type { CatalogoPublicoGateway, CategoriaPublica, ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';
import type {
  FacetasBusquedaFrontend,
  FiltrosBusquedaFrontend,
  OrdenBusqueda,
} from '@/modules/m02-busqueda/interfaces/busqueda.interface';

/** Productos por página; la API admite hasta 100 (`limite` en M02). */
export const LIMITE_PAGINA = 16;
const ESPERA_BUSQUEDA_MS = 300;
const ORDENES: readonly OrdenBusqueda[] = ['relevancia', 'precio_asc', 'precio_desc', 'novedad'];
/** Parámetros de la URL que pertenecen al estado del catálogo. */
const CLAVES_URL = ['q', 'categoria', 'subcategoria', 'marca', 'linea', 'resina', 'color', 'presentacion', 'precioMin', 'precioMax', 'orden', 'pagina'] as const;

/** El input limita a 120 caracteres; un valor externo inválido se trata como vacío. */
function terminoNormalizado(valor: string): string {
  try {
    return normalizarBusquedaCatalogoPublico(valor).q;
  } catch {
    return '';
  }
}

/** IDs positivos desde `?marca=1,2` o repetido; ignora valores no numéricos. */
function idsDesdeQuery(valor: unknown): number[] {
  const crudos = (Array.isArray(valor) ? valor : [valor]).filter((v): v is string => typeof v === 'string');
  const ids = crudos.flatMap((v) => v.split(',')).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  return [...new Set(ids)];
}

function numeroPositivo(valor: unknown): number | undefined {
  const n = Number(valor);
  return valor !== undefined && valor !== null && valor !== '' && Number.isFinite(n) && n > 0 ? n : undefined;
}

/** Forma canónica (solo claves del catálogo, valores en texto) para comparar URL y estado. */
function claveQuery(query: LocationQuery | Record<string, string | number>): string {
  return JSON.stringify(
    CLAVES_URL.flatMap((k) => {
      const v = query[k];
      if (v === undefined || v === null || v === '') return [];
      return [[k, Array.isArray(v) ? v.join(',') : String(v)]];
    })
  );
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
  /** Filtros de la última consulta de facetas: orden y página no las cambian. */
  let claveFacetas: string | null = null;
  /**
   * Subcategorías (OR) o categorías completas (OR). Son excluyentes entre sí: la API
   * combina ambos grupos con AND, así que mezclarlos no daría la unión esperada.
   */
  const subcategoriasSeleccionadas = ref<number[]>([]);
  const categoriasSeleccionadas = ref<number[]>([]);
  const marcasSeleccionadas = ref<number[]>([]);
  const lineasSeleccionadas = ref<number[]>([]);
  const resinasSeleccionadas = ref<number[]>([]);
  const coloresSeleccionados = ref<number[]>([]);
  const presentacionesSeleccionadas = ref<number[]>([]);
  const precioMin = ref<number | undefined>();
  const precioMax = ref<number | undefined>();
  const orden = ref<OrdenBusqueda>('relevancia');
  /** Cuenta las navegaciones que llegan desde fuera del catálogo (menú del header, atrás/adelante). */
  const navegacionesExternas = ref(0);

  const cargando = ref(true);
  /** true tras la primera respuesta: desde entonces se actualiza sin esqueletos. */
  const resultadosListos = ref(false);
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

  /** Filtros comunes a búsqueda y facetas. */
  function filtrosActuales(): FiltrosBusquedaFrontend {
    const q = terminoAplicado.value;
    return {
      ...(q ? { q } : {}),
      categoria: categoriasSeleccionadas.value,
      subcategoria: subcategoriasSeleccionadas.value,
      marca: marcasSeleccionadas.value,
      linea: lineasSeleccionadas.value,
      resina: resinasSeleccionadas.value,
      color: coloresSeleccionados.value,
      presentacion: presentacionesSeleccionadas.value,
      precio_min: precioMin.value,
      precio_max: precioMax.value,
    };
  }

  /**
   * Facetas multielección: la API cuenta aplicando todos los filtros, también los del
   * propio grupo (al marcar una marca, «Marcas» solo listaría esa). Para poder sumar
   * opciones del mismo grupo (OR), cada grupo con selección toma sus valores de una
   * consulta sin su propio filtro; los demás grupos, de la consulta completa.
   */
  async function cargarFacetas(): Promise<void> {
    const base = filtrosActuales();
    const clave = JSON.stringify(base);
    if (clave === claveFacetas) return;
    claveFacetas = clave;
    const solicitud = ++solicitudFacetas;
    const sin = (omitir: Partial<FiltrosBusquedaFrontend>) => BusquedaService.facetas({ ...base, ...omitir });
    const parciales: Promise<Partial<FacetasBusquedaFrontend>>[] = [];
    if (categoriasSeleccionadas.value.length || subcategoriasSeleccionadas.value.length) {
      parciales.push(sin({ categoria: [], subcategoria: [] }).then((f) => ({ categorias: f.categorias, subcategorias: f.subcategorias })));
    }
    if (base.marca?.length) parciales.push(sin({ marca: [] }).then((f) => ({ marcas: f.marcas })));
    if (base.linea?.length) parciales.push(sin({ linea: [] }).then((f) => ({ lineas: f.lineas })));
    if (base.resina?.length) parciales.push(sin({ resina: [] }).then((f) => ({ resinas: f.resinas })));
    if (base.presentacion?.length) parciales.push(sin({ presentacion: [] }).then((f) => ({ presentaciones: f.presentaciones })));
    try {
      const [completa, ...porGrupo] = await Promise.all([BusquedaService.facetas(base), ...parciales]);
      if (solicitud !== solicitudFacetas) return;
      facetas.value = Object.assign({}, completa, ...porGrupo);
    } catch {
      // Si fallan las facetas no se interrumpe la navegación; se reintentan en el próximo cambio.
      if (solicitud === solicitudFacetas) claveFacetas = null;
    }
  }

  async function cargarProductos(): Promise<void> {
    // Solo la consulta más reciente puede actualizar resultados y estados.
    const solicitud = ++solicitudProductos;
    terminoAplicado.value = terminoNormalizado(termino.value);
    cargando.value = true;
    error.value = null;
    // Facetas en paralelo con los productos: no esperan una a la otra.
    void cargarFacetas();
    try {
      const resultado = await BusquedaService.buscar({
        ...filtrosActuales(),
        orden: orden.value,
        pagina: pagina.value,
        limite: LIMITE_PAGINA,
      });

      const enriquecidos = await enriquecerProductosPublicos(resultado.items, servicio);
      if (solicitud !== solicitudProductos) return;
      productos.value = enriquecidos;
      total.value = resultado.total;
    } catch {
      if (solicitud === solicitudProductos) {
        error.value = 'No fue posible cargar el catálogo público. Intenta nuevamente.';
      }
    } finally {
      if (solicitud === solicitudProductos) {
        cargando.value = false;
        resultadosListos.value = true;
      }
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

  /** Publica el estado en la URL y consulta: un único punto para cada cambio de filtro. */
  function aplicar(reemplazarUrl = false): void {
    actualizarUrlParams(reemplazarUrl);
    void cargarProductos();
  }

  /** Lanza la búsqueda del término actual si difiere de la última consulta. */
  function aplicarBusqueda(reemplazarUrl: boolean): void {
    cancelarBusquedaPendiente();
    if (terminoNormalizado(termino.value) === terminoAplicado.value) return;
    pagina.value = 1;
    aplicar(reemplazarUrl);
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

  /** Reemplaza la selección por una sola subcategoría (o ninguna); quita las categorías. */
  function seleccionarSubcategoria(id: number | undefined): void {
    subcategoriasSeleccionadas.value = id === undefined ? [] : [id];
    categoriasSeleccionadas.value = [];
    pagina.value = 1;
    aplicar();
  }

  /** Reemplaza la selección por una categoría completa (o ninguna); quita las subcategorías. */
  function seleccionarCategoria(id: number | undefined): void {
    categoriasSeleccionadas.value = id === undefined ? [] : [id];
    subcategoriasSeleccionadas.value = [];
    pagina.value = 1;
    aplicar();
  }

  /** Suma o quita una subcategoría (OR entre ellas); elegir subcategorías quita las categorías completas. */
  function alternarSubcategoria(id: number): void {
    const actuales = subcategoriasSeleccionadas.value;
    subcategoriasSeleccionadas.value = actuales.includes(id) ? actuales.filter((s) => s !== id) : [...actuales, id];
    categoriasSeleccionadas.value = [];
    pagina.value = 1;
    aplicar();
  }

  /** Suma o quita una categoría completa (OR entre ellas); quita las subcategorías elegidas. */
  function alternarCategoria(id: number): void {
    const actuales = categoriasSeleccionadas.value;
    categoriasSeleccionadas.value = actuales.includes(id) ? actuales.filter((c) => c !== id) : [...actuales, id];
    subcategoriasSeleccionadas.value = [];
    pagina.value = 1;
    aplicar();
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
    aplicar();
  }

  function cambiarOrden(nuevoOrden: OrdenBusqueda): void {
    orden.value = nuevoOrden;
    pagina.value = 1;
    aplicar();
  }

  function aplicarRangoPrecio(min?: number, max?: number): void {
    precioMin.value = min;
    precioMax.value = max;
    pagina.value = 1;
    aplicar();
  }

  function irPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas.value) return;
    pagina.value = nuevaPagina;
    aplicar();
  }

  function limpiar(): void {
    cancelarBusquedaPendiente();
    termino.value = '';
    subcategoriasSeleccionadas.value = [];
    categoriasSeleccionadas.value = [];
    marcasSeleccionadas.value = [];
    lineasSeleccionadas.value = [];
    resinasSeleccionadas.value = [];
    coloresSeleccionados.value = [];
    presentacionesSeleccionadas.value = [];
    precioMin.value = undefined;
    precioMax.value = undefined;
    orden.value = 'relevancia';
    pagina.value = 1;
    aplicar();
  }

  /** Query que representa el estado actual (mismo formato que se publica en la URL). */
  function queryDesdeEstado(): Record<string, string | number> {
    const query: Record<string, string | number> = {};
    const q = terminoNormalizado(termino.value);
    if (q) query.q = q;
    if (categoriasSeleccionadas.value.length) query.categoria = categoriasSeleccionadas.value.join(',');
    if (subcategoriasSeleccionadas.value.length) query.subcategoria = subcategoriasSeleccionadas.value.join(',');
    if (marcasSeleccionadas.value.length) query.marca = marcasSeleccionadas.value.join(',');
    if (lineasSeleccionadas.value.length) query.linea = lineasSeleccionadas.value.join(',');
    if (resinasSeleccionadas.value.length) query.resina = resinasSeleccionadas.value.join(',');
    if (coloresSeleccionados.value.length) query.color = coloresSeleccionados.value.join(',');
    if (presentacionesSeleccionadas.value.length) query.presentacion = presentacionesSeleccionadas.value.join(',');
    if (precioMin.value !== undefined && precioMin.value > 0) query.precioMin = precioMin.value;
    if (precioMax.value !== undefined && precioMax.value > 0) query.precioMax = precioMax.value;
    if (orden.value !== 'relevancia') query.orden = orden.value;
    if (pagina.value > 1) query.pagina = pagina.value;
    return query;
  }

  /** `reemplazar` evita llenar el historial con cada pausa al escribir. */
  function actualizarUrlParams(reemplazar = false): void {
    const destino = { path: '/catalogo', query: queryDesdeEstado() };
    if (reemplazar) void router.replace(destino);
    else void router.push(destino);
  }

  /** Restaura TODO el estado desde la URL (carga inicial, enlace compartido, atrás/adelante). */
  function sincronizarDesdeRuta(): void {
    const query = route?.query ?? {};
    cancelarBusquedaPendiente();
    termino.value = typeof query.q === 'string' ? query.q : '';
    terminoAplicado.value = terminoNormalizado(termino.value);

    // Si una URL trae ambos, manda la subcategoría (comportamiento previo); nunca se combinan.
    subcategoriasSeleccionadas.value = idsDesdeQuery(query.subcategoria);
    categoriasSeleccionadas.value = subcategoriasSeleccionadas.value.length ? [] : idsDesdeQuery(query.categoria);

    const ordenRaw = query.orden as OrdenBusqueda;
    orden.value = ORDENES.includes(ordenRaw) ? ordenRaw : 'relevancia';
    const pagRaw = Number(query.pagina);
    pagina.value = Number.isInteger(pagRaw) && pagRaw > 0 ? pagRaw : 1;

    // Recupera todos los filtros compartidos por URL (RF-BUS-02-05).
    marcasSeleccionadas.value = idsDesdeQuery(query.marca);
    lineasSeleccionadas.value = idsDesdeQuery(query.linea);
    resinasSeleccionadas.value = idsDesdeQuery(query.resina);
    coloresSeleccionados.value = idsDesdeQuery(query.color);
    presentacionesSeleccionadas.value = idsDesdeQuery(query.presentacion);
    precioMin.value = numeroPositivo(query.precioMin);
    precioMax.value = numeroPositivo(query.precioMax);
  }

  // Navegación externa (buscador del header, Inicio → catálogo, atrás/adelante): si la URL
  // ya coincide con el estado, es la propia navegación del catálogo y no se consulta de nuevo.
  watch(
    () => route?.query,
    (nuevoQuery) => {
      if (!nuevoQuery || route.path !== '/catalogo') return;
      if (claveQuery(nuevoQuery) === claveQuery(queryDesdeEstado())) return;
      sincronizarDesdeRuta();
      navegacionesExternas.value++;
      void cargarProductos();
    }
  );

  onMounted(() => {
    sincronizarDesdeRuta();
    void cargarInicio();
  });

  onBeforeUnmount(cancelarBusquedaPendiente);

  return {
    buscar,
    cargando,
    resultadosListos,
    navegacionesExternas,
    cargarInicio,
    categorias,
    error,
    irPagina,
    limpiar,
    pagina,
    productos,
    seleccionarSubcategoria,
    seleccionarCategoria,
    alternarSubcategoria,
    alternarCategoria,
    subcategoriasSeleccionadas,
    categoriasSeleccionadas,
    termino,
    terminoAplicado,
    total,
    totalPaginas,
    limitePagina: LIMITE_PAGINA,
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
