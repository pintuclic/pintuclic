import { computed, onMounted, ref, watch } from 'vue';
import { normalizarBusquedaCatalogoPublico } from '../../dtos/publicas/catalogo-publico.dto';
import type {
  CatalogoPublicoGateway,
  CategoriaPublica,
  ColorPaletaPublica,
  ProductoDestacadoPublico,
} from '../../interfaces/publicas/catalogo-publico.interface';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';

const LIMITE_PRODUCTOS = 20;

export function usePaletaColoresPublica(servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
  const categorias = ref<CategoriaPublica[]>([]);
  const productos = ref<ProductoDestacadoPublico[]>([]);
  const termino = ref('');
  const familiaSeleccionada = ref<string | null>(null);
  const colorSeleccionadoId = ref<number | null>(null);
  const cargando = ref(true);
  const error = ref<string | null>(null);

  const colores = computed<ColorPaletaPublica[]>(() => {
    const indice = new Map<number, {
      nombre: string;
      codigo: string | null;
      muestra_hex: string | null;
      familia: string | null;
      productos: ProductoDestacadoPublico[];
    }>();

    productos.value.forEach((producto) => {
      producto.detalle?.variantes.forEach((variante) => {
        if (variante.id_color === null || variante.color === null) return;
        const existente = indice.get(variante.id_color);
        if (existente) {
          if (!existente.productos.some((item) => item.id_producto === producto.id_producto)) {
            existente.productos.push(producto);
          }
          return;
        }
        indice.set(variante.id_color, {
          nombre: variante.color,
          codigo: variante.codigo_color ?? null,
          muestra_hex: variante.muestra_hex ?? null,
          familia: variante.familia_color ?? null,
          productos: [producto],
        });
      });
    });

    return [...indice.entries()]
      .map(([id_color, valor]) => ({ id_color, ...valor }))
      .sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es'));
  });

  const coloresFiltrados = computed(() => {
    const { q } = normalizarBusquedaCatalogoPublico(termino.value);
    const normalizado = q.toLocaleLowerCase('es');
    return colores.value.filter((color) => {
      if (familiaSeleccionada.value && color.familia !== familiaSeleccionada.value) return false;
      if (!normalizado) return true;
      return `${color.nombre} ${color.codigo ?? ''}`.toLocaleLowerCase('es').includes(normalizado);
    });
  });

  const colorSeleccionado = computed(
    () => colores.value.find((color) => color.id_color === colorSeleccionadoId.value) ?? colores.value[0] ?? null
  );

  const productosRecomendados = computed(() =>
    (colorSeleccionado.value?.productos ?? productos.value.filter((producto) => producto.clase_color !== 'sin_color')).slice(0, 5)
  );

  const productosComplementarios = computed(() =>
    productos.value.filter((producto) => producto.clase_color === 'sin_color').slice(0, 5)
  );

  async function cargarPaleta(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const [categoriasPublicas, pagina] = await Promise.all([
        servicio.listarCategorias(),
        servicio.listarProductos({ pagina: 1, limite: LIMITE_PRODUCTOS }),
      ]);
      categorias.value = categoriasPublicas;
      productos.value = await enriquecerProductosPublicos(pagina.items, servicio);
      colorSeleccionadoId.value = colores.value[0]?.id_color ?? null;
    } catch {
      error.value = 'No pudimos cargar la paleta pública en este momento.';
    } finally {
      cargando.value = false;
    }
  }

  function seleccionarColor(idColor: number): void {
    colorSeleccionadoId.value = idColor;
  }

  function seleccionarFamilia(familia: string | null): void {
    familiaSeleccionada.value = familia;
    colorSeleccionadoId.value = coloresFiltrados.value[0]?.id_color ?? null;
  }

  watch(termino, () => {
    if (!coloresFiltrados.value.some((color) => color.id_color === colorSeleccionadoId.value)) {
      colorSeleccionadoId.value = coloresFiltrados.value[0]?.id_color ?? null;
    }
  });

  onMounted(() => { void cargarPaleta(); });

  return {
    cargarPaleta,
    cargando,
    categorias,
    colorSeleccionado,
    colores,
    coloresFiltrados,
    error,
    familiaSeleccionada,
    productosComplementarios,
    productosRecomendados,
    seleccionarColor,
    seleccionarFamilia,
    termino,
  };
}
