import { onMounted, ref } from 'vue';
import { normalizarBusquedaCatalogoPublico } from '../../dtos/publicas/catalogo-publico.dto';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';
import type {
  CatalogoPublicoGateway,
  CategoriaPublica,
  ProductoDestacadoPublico,
} from '../../interfaces/publicas/catalogo-publico.interface';

const LIMITE_DESTACADOS = 5;

export function useInicioPublico(servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
  const categorias = ref<CategoriaPublica[]>([]);
  const productos = ref<ProductoDestacadoPublico[]>([]);
  const cargando = ref(true);
  const buscando = ref(false);
  const error = ref<string | null>(null);

  async function cargarInicio(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const [categoriasPublicas, pagina] = await Promise.all([
        servicio.listarCategorias(),
        servicio.listarProductos({ pagina: 1, limite: LIMITE_DESTACADOS }),
      ]);
      categorias.value = categoriasPublicas;
      const enriquecidos = await enriquecerProductosPublicos(pagina.items, servicio);
      productos.value = [...enriquecidos].sort((a, b) => a.id_producto - b.id_producto);
    } catch {
      error.value = 'No pudimos cargar el catálogo en este momento. Intenta nuevamente.';
    } finally {
      cargando.value = false;
    }
  }

  async function buscar(valor: string): Promise<void> {
    const { q } = normalizarBusquedaCatalogoPublico(valor);
    buscando.value = true;
    error.value = null;
    try {
      const pagina = await servicio.listarProductos({
        ...(q ? { q } : {}),
        pagina: 1,
        limite: LIMITE_DESTACADOS,
      });
      productos.value = await enriquecerProductosPublicos(pagina.items, servicio);
    } catch {
      error.value = 'No fue posible completar la búsqueda. Intenta nuevamente.';
    } finally {
      buscando.value = false;
    }
  }

  async function filtrarPorSubcategoria(idSubcategoria: number): Promise<void> {
    buscando.value = true;
    error.value = null;
    try {
      const pagina = await servicio.listarProductos({
        subcategoria: idSubcategoria,
        pagina: 1,
        limite: LIMITE_DESTACADOS,
      });
      productos.value = await enriquecerProductosPublicos(pagina.items, servicio);
    } catch {
      error.value = 'No fue posible cargar los productos de esta categoría.';
    } finally {
      buscando.value = false;
    }
  }

  onMounted(() => {
    void cargarInicio();
  });

  return {
    buscar,
    buscando,
    cargarInicio,
    cargando,
    categorias,
    error,
    filtrarPorSubcategoria,
    productos,
  };
}
