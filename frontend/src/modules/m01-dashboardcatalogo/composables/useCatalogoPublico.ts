import { computed, onMounted, ref } from 'vue';
import { normalizarBusquedaCatalogoPublico } from '../dtos/catalogo-publico.dto';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import type { CategoriaPublica, ProductoDestacadoPublico, ProductoPublicoResumen } from '../interfaces/catalogo-publico.interface';

const LIMITE_PAGINA = 8;

export function useCatalogoPublico() {
  const categorias = ref<CategoriaPublica[]>([]);
  const productos = ref<ProductoDestacadoPublico[]>([]);
  const pagina = ref(1);
  const total = ref(0);
  const termino = ref('');
  const subcategoria = ref<number | undefined>();
  const cargando = ref(true);
  const error = ref<string | null>(null);
  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / LIMITE_PAGINA)));

  async function enriquecer(resumenes: readonly ProductoPublicoResumen[]): Promise<ProductoDestacadoPublico[]> {
    return Promise.all(resumenes.map(async (producto) => {
      try {
        return { ...producto, detalle: await CatalogoPublicoService.obtenerFicha(producto.id_producto) };
      } catch {
        return { ...producto, detalle: null };
      }
    }));
  }

  async function cargarProductos(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const { q } = normalizarBusquedaCatalogoPublico(termino.value);
      const resultado = await CatalogoPublicoService.listarProductos({
        ...(q ? { q } : {}),
        ...(subcategoria.value !== undefined ? { subcategoria: subcategoria.value } : {}),
        pagina: pagina.value,
        limite: LIMITE_PAGINA,
      });
      productos.value = await enriquecer(resultado.items);
      total.value = resultado.total;
    } catch {
      error.value = 'No fue posible cargar el catálogo público.';
    } finally {
      cargando.value = false;
    }
  }

  async function cargarInicio(): Promise<void> {
    try {
      categorias.value = await CatalogoPublicoService.listarCategorias();
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

  onMounted(() => { void cargarInicio(); });

  return { buscar, cargando, cargarInicio, categorias, error, irPagina, limpiar, pagina, productos, seleccionarSubcategoria, subcategoria, termino, total, totalPaginas };
}
