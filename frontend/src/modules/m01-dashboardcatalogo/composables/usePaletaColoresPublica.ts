import { computed, onMounted, ref } from 'vue';
import { normalizarBusquedaCatalogoPublico } from '../dtos/catalogo-publico.dto';
import type {
  CategoriaPublica,
  ColorPaletaPublica,
  ProductoDestacadoPublico,
  ProductoPublicoResumen,
} from '../interfaces/catalogo-publico.interface';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';

const LIMITE_PRODUCTOS = 20;

export function usePaletaColoresPublica() {
  const categorias = ref<CategoriaPublica[]>([]);
  const productos = ref<ProductoDestacadoPublico[]>([]);
  const termino = ref('');
  const colorSeleccionadoId = ref<number | null>(null);
  const cargando = ref(true);
  const error = ref<string | null>(null);

  const colores = computed<ColorPaletaPublica[]>(() => {
    const indice = new Map<number, { nombre: string; productos: ProductoDestacadoPublico[] }>();

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
        indice.set(variante.id_color, { nombre: variante.color, productos: [producto] });
      });
    });

    return [...indice.entries()]
      .map(([id_color, valor]) => ({ id_color, nombre: valor.nombre, productos: valor.productos }))
      .sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es'));
  });

  const coloresFiltrados = computed(() => {
    const { q } = normalizarBusquedaCatalogoPublico(termino.value);
    const normalizado = q.toLocaleLowerCase('es');
    if (!normalizado) return colores.value;
    return colores.value.filter((color) => color.nombre.toLocaleLowerCase('es').includes(normalizado));
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

  async function enriquecer(resumenes: readonly ProductoPublicoResumen[]): Promise<ProductoDestacadoPublico[]> {
    return Promise.all(resumenes.map(async (producto) => {
      try {
        return { ...producto, detalle: await CatalogoPublicoService.obtenerFicha(producto.id_producto) };
      } catch {
        return { ...producto, detalle: null };
      }
    }));
  }

  async function cargarPaleta(): Promise<void> {
    cargando.value = true;
    error.value = null;
    try {
      const [categoriasPublicas, pagina] = await Promise.all([
        CatalogoPublicoService.listarCategorias(),
        CatalogoPublicoService.listarProductos({ pagina: 1, limite: LIMITE_PRODUCTOS }),
      ]);
      categorias.value = categoriasPublicas;
      productos.value = await enriquecer(pagina.items);
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

  onMounted(() => { void cargarPaleta(); });

  return {
    cargarPaleta,
    cargando,
    categorias,
    colorSeleccionado,
    coloresFiltrados,
    error,
    productosComplementarios,
    productosRecomendados,
    seleccionarColor,
    termino,
  };
}
