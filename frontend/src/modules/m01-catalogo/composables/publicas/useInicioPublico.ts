import { onMounted, ref } from 'vue';
import { normalizarBusquedaCatalogoPublico } from '../../dtos/publicas/catalogo-publico.dto';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import type {
  CatalogoPublicoGateway,
  CategoriaPublica,
  ProductoDestacadoPublico,
} from '../../interfaces/publicas/catalogo-publico.interface';

/** Productos destacados del inicio: un carrusel manual de 10 (decisión del líder técnico, 12/10/2026). */
export const LIMITE_DESTACADOS = 10;

export function useInicioPublico(
  servicio: CatalogoPublicoGateway = CatalogoPublicoService,
  // El buscador usa el mismo motor que el catálogo (M02): acentos, errores tipográficos,
  // marca, línea y color (RF-BUS-01-03). El listado de M01 solo compara el nombre.
  buscador: Pick<typeof BusquedaService, 'buscar'> = BusquedaService,
) {
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
      const pagina = await buscador.buscar({
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
    productos,
  };
}
