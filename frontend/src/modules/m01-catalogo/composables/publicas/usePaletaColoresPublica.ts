import { computed, onMounted, ref, watch } from 'vue';
import { normalizarBusquedaCatalogoPublico } from '../../dtos/publicas/catalogo-publico.dto';
import type {
  CatalogoPublicoGateway,
  ColorPaletaPublica,
  ProductoDestacadoPublico,
} from '../../interfaces/publicas/catalogo-publico.interface';
import { CatalogoPublicoService, enriquecerProductosPublicos } from '../../services/publicas/catalogo-publico.service';

/**
 * La paleta reúne los colores de las variantes de todo el catálogo (antes, solo de los 20
 * primeros productos). Se pide en páginas del máximo que admite la API, con un tope de
 * páginas para acotar las consultas de fichas. Pendiente de backend: un listado de colores
 * propio, que incluya las cartas de los productos entonables (M01-16).
 */
export const PRODUCTOS_POR_PAGINA_PALETA = 100;
export const MAXIMO_PAGINAS_PALETA = 3;

export function usePaletaColoresPublica(servicio: CatalogoPublicoGateway = CatalogoPublicoService) {
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
      // Las categorías ya no se piden aquí (el menú vive en el encabezado): un fallo de ese
      // servicio no impide cargar la paleta.
      const primera = await servicio.listarProductos({ pagina: 1, limite: PRODUCTOS_POR_PAGINA_PALETA });
      const paginas = Math.min(MAXIMO_PAGINAS_PALETA, Math.ceil(primera.total / PRODUCTOS_POR_PAGINA_PALETA));
      const resto = await Promise.all(
        Array.from({ length: Math.max(0, paginas - 1) }, (_, i) =>
          servicio.listarProductos({ pagina: i + 2, limite: PRODUCTOS_POR_PAGINA_PALETA })),
      );
      const resumenes = [primera, ...resto].flatMap((pagina) => pagina.items);
      productos.value = await enriquecerProductosPublicos(resumenes, servicio);
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
