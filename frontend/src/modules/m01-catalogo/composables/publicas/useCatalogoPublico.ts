import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { normalizarBusquedaCatalogoPublico } from '../../dtos/publicas/catalogo-publico.dto';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';
import type { CatalogoPublicoGateway, CategoriaPublica, ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

const LIMITE_PAGINA = 8;

export function useCatalogoPublico(servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
  const categorias = ref<CategoriaPublica[]>([]);
  const productos = ref<ProductoDestacadoPublico[]>([]);
  const pagina = ref(1);
  const total = ref(0);
  const termino = ref('');
  const subcategoria = ref<number | undefined>();
  const cargando = ref(true);
  const error = ref<string | null>(null);
  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE_PAGINA)));

  async function cargarProductos(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const { q } = normalizarBusquedaCatalogoPublico(termino.value);
      const resultado = await servicio.listarProductos({
        ...(q ? { q } : {}),
        ...(subcategoria.value !== undefined ? { subcategoria: subcategoria.value } : {}),
        pagina: pagina.value,
        limite: LIMITE_PAGINA,
      });
      productos.value = await enriquecerProductosPublicos(resultado.items, servicio);
      total.value = resultado.total;
    } catch {
      error.value = 'No fue posible cargar el catálogo público.';
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
    void cargarProductos();
  }

  function seleccionarSubcategoria(id: number | undefined): void {
    subcategoria.value = id;
    pagina.value = 1;
    void cargarProductos();
  }

  function irPagina(nuevaPagina: number): void {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas.value) return;
    pagina.value = nuevaPagina;
    void cargarProductos();
  }

  function limpiar(): void {
    termino.value = '';
    seleccionarSubcategoria(undefined);
  }

  const route = useRoute();

  function sincronizarSubcategoriaDesdeRuta(): void {
    const raw = route?.query?.subcategoria;
    if (raw !== undefined && raw !== null && raw !== '') {
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        subcategoria.value = num;
      }
    }
  }

  watch(
    () => route?.query?.subcategoria,
    (nuevo) => {
      if (nuevo !== undefined && nuevo !== null && nuevo !== '') {
        const num = Number(nuevo);
        if (!Number.isNaN(num) && num !== subcategoria.value) {
          seleccionarSubcategoria(num);
        }
      } else if (subcategoria.value !== undefined) {
        seleccionarSubcategoria(undefined);
      }
    }
  );

  onMounted(() => {
    sincronizarSubcategoriaDesdeRuta();
    void cargarInicio();
  });

  return { buscar, cargando, cargarInicio, categorias, error, irPagina, limpiar, pagina, productos, seleccionarSubcategoria, subcategoria, termino, total, totalPaginas };
}
