import { onMounted, ref } from 'vue';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';
import type {
  CatalogoPublicoGateway,
  CategoriaPublica,
  ProductoDestacadoPublico,
} from '../../interfaces/publicas/catalogo-publico.interface';

/** Productos destacados del inicio: un carrusel manual de 10 (decisión del líder técnico, 12/10/2026). */
export const LIMITE_DESTACADOS = 10;

/**
 * Datos del inicio: categorías y productos destacados.
 * La búsqueda del inicio no se resuelve aquí: lleva al catálogo (`/catalogo?q=…`), que busca
 * mientras se escribe, cuenta resultados, filtra y pagina. Antes los resultados reemplazaban
 * en silencio a los destacados, limitados a 10 y bajo el mismo título.
 */
export function useInicioPublico(servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
  const categorias = ref<CategoriaPublica[]>([]);
  const productos = ref<ProductoDestacadoPublico[]>([]);
  const cargando = ref(true);
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

  onMounted(() => {
    void cargarInicio();
  });

  return {
    cargarInicio,
    cargando,
    categorias,
    error,
    productos,
  };
}
