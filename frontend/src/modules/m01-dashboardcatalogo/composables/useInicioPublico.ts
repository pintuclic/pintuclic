import { onMounted, ref } from 'vue';
import { normalizarBusquedaCatalogoPublico } from '../dtos/catalogo-publico.dto';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import type {
  CategoriaPublica,
  ProductoDestacadoPublico,
  ProductoPublicoResumen,
} from '../interfaces/catalogo-publico.interface';

const LIMITE_DESTACADOS = 5;

export function useInicioPublico() {
  const categorias = ref<CategoriaPublica[]>([]);
  const productos = ref<ProductoDestacadoPublico[]>([]);
  const cargando = ref(true);
  const buscando = ref(false);
  const error = ref<string | null>(null);

  async function enriquecerProductos(
    resumenes: readonly ProductoPublicoResumen[]
  ): Promise<ProductoDestacadoPublico[]> {
    return Promise.all(
      resumenes.map(async (producto) => {
        try {
          const detalle = await CatalogoPublicoService.obtenerFicha(producto.id_producto);
          return { ...producto, detalle };
        } catch {
          return { ...producto, detalle: null };
        }
      })
    );
  }

  async function cargarInicio(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const [categoriasPublicas, pagina] = await Promise.all([
        CatalogoPublicoService.listarCategorias(),
        CatalogoPublicoService.listarProductos({ pagina: 1, limite: LIMITE_DESTACADOS }),
      ]);
      categorias.value = categoriasPublicas;
      const enriquecidos = await enriquecerProductos(pagina.items);
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
      const pagina = await CatalogoPublicoService.listarProductos({
        ...(q ? { q } : {}),
        pagina: 1,
        limite: LIMITE_DESTACADOS,
      });
      productos.value = await enriquecerProductos(pagina.items);
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
      const pagina = await CatalogoPublicoService.listarProductos({
        subcategoria: idSubcategoria,
        pagina: 1,
        limite: LIMITE_DESTACADOS,
      });
      productos.value = await enriquecerProductos(pagina.items);
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
