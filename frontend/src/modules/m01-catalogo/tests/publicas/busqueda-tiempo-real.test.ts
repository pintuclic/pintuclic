import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { useCatalogoPublico } from '../../composables/publicas/useCatalogoPublico';
import { obtenerMuestraColorCoincidente } from '../../composables/publicas/useColorCoincidenteBusqueda';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import type { PaginaBusquedaFrontend } from '@/modules/m02-busqueda/interfaces/busqueda.interface';
import type {
  CatalogoPublicoGateway,
  FichaProductoPublico,
  VariantePublica,
} from '../../interfaces/publicas/catalogo-publico.interface';

vi.mock('@/modules/m02-busqueda/services/busqueda.service', () => ({
  BusquedaService: { buscar: vi.fn(), facetas: vi.fn() },
}));

function variante(
  id_variante: number,
  id_color: number | null,
  color: string | null,
  muestra_hex: string | null,
  familia_color: string | null = null,
): VariantePublica {
  return {
    id_variante,
    id_presentacion: 1,
    presentacion: 'Galón',
    volumen: 3.785,
    id_color,
    color,
    codigo_color: null,
    muestra_hex,
    familia_color,
    id_base: null,
    base: null,
    precio_vigente: 85900,
    existencia_referencial: 10,
  };
}

/** Subconjunto real del seed (producto 1, Viniltex) en el orden que entrega la API. */
const VARIANTES_VINILTEX = [
  variante(33, 2, 'Azul Océano', '#1D70A5', 'azules'),
  variante(32, 1, 'Blanco Puro', '#F4F3F2', 'grises'),
  variante(7, 5, 'Amarillo Arena', '#EAC78A', 'amarillos'),
  variante(5, 3, 'Amarillo Sol', '#FFCD28', 'amarillos'),
  variante(6, 4, 'Amarillo Maíz', '#EFB939', 'amarillos'),
  variante(12, 9, 'Azul Cielo', '#73C3E6', 'azules'),
  variante(11, 8, 'Azul Marino', '#19477D', 'azules'),
];

describe('color coincidente con la búsqueda (M01/M02)', () => {
  it('usa el HEX real de la variante cuyo color coincide', () => {
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, 'amarillo arena')).toBe('#EAC78A');
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, 'Azul Marino')).toBe('#19477D');
  });

  it('elige de forma determinista entre varias coincidencias (menor id_color)', () => {
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, 'amarillo')).toBe('#FFCD28');
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, 'azul')).toBe('#1D70A5');
    const invertidas = [...VARIANTES_VINILTEX].reverse();
    expect(obtenerMuestraColorCoincidente(invertidas, 'amarillo')).toBe('#FFCD28');
  });

  it('ignora tildes y mayúsculas y coincide por familia de color', () => {
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, 'OCEANO')).toBe('#1D70A5');
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, 'maiz')).toBe('#EFB939');
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, 'amarillos')).toBe('#FFCD28');
  });

  it('devuelve null sin coincidencia de color para conservar el predeterminado', () => {
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, 'viniltex')).toBeNull();
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, '')).toBeNull();
    expect(obtenerMuestraColorCoincidente(VARIANTES_VINILTEX, '   ')).toBeNull();
    expect(obtenerMuestraColorCoincidente([], 'amarillo')).toBeNull();
  });

  it('descarta variantes sin HEX válido', () => {
    const invalidas = [variante(1, 1, 'Amarillo Sol', null), variante(2, 2, 'Amarillo Maíz', 'amarillo')];
    expect(obtenerMuestraColorCoincidente(invalidas, 'amarillo')).toBeNull();
  });
});

function ficha(id: number): FichaProductoPublico {
  return {
    id_producto: id,
    nombre: `Producto ${id}`,
    descripcion: null,
    id_marca: 1,
    clase_color: 'colores_fijos',
    rendimiento_min: null,
    rendimiento_max: null,
    variantes: [],
    imagenes: [],
  };
}

function pagina(...ids: number[]): PaginaBusquedaFrontend {
  return {
    items: ids.map((id) => ({ id_producto: id, nombre: `Producto ${id}`, id_marca: 1, clase_color: 'colores_fijos' })),
    total: ids.length,
    pagina: 1,
    limite: 8,
    total_paginas: 1,
  };
}

const gateway: CatalogoPublicoGateway = {
  listarCategorias: async () => [],
  listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 8 }),
  obtenerFicha: async (id) => ficha(id),
  listarComplementarios: async () => [],
};

async function montarCatalogo(url = '/catalogo') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/catalogo', component: { render: () => null } }],
  });
  await router.push(url);
  await router.isReady();

  let estado!: ReturnType<typeof useCatalogoPublico>;
  const Anfitrion = defineComponent({
    setup() {
      estado = useCatalogoPublico(gateway);
      return () => h('div');
    },
  });
  mount(Anfitrion, { global: { plugins: [router] } });
  await flushPromises();
  return { estado, router };
}

async function escribir(estado: ReturnType<typeof useCatalogoPublico>, valor: string, esperaMs = 50) {
  estado.termino.value = valor;
  await nextTick();
  await vi.advanceTimersByTimeAsync(esperaMs);
}

const buscarMock = vi.mocked(BusquedaService.buscar);

describe('búsqueda en tiempo real del catálogo público', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    buscarMock.mockReset();
    vi.mocked(BusquedaService.facetas).mockResolvedValue({
      categorias: [], subcategorias: [], marcas: [], lineas: [], resinas: [], colores: [], presentaciones: [],
    });
    buscarMock.mockImplementation(async (filtros = {}) => (filtros.q ? pagina(1) : pagina(1, 2, 3)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('busca tras 300 ms sin Enter y agrupa la escritura progresiva en una sola petición', async () => {
    const { estado, router } = await montarCatalogo();
    expect(buscarMock).toHaveBeenCalledTimes(1);

    await escribir(estado, 'a');
    await escribir(estado, 'am');
    await escribir(estado, 'ama');
    expect(buscarMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(300);
    await flushPromises();

    expect(buscarMock).toHaveBeenCalledTimes(2);
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ q: 'ama', pagina: 1 });
    expect(router.currentRoute.value.query.q).toBe('ama');
    expect(estado.productos.value.map((p) => p.id_producto)).toEqual([1]);
  });

  it('al borrar hasta vaciar vuelve al catálogo completo y reinicia la página', async () => {
    const { estado, router } = await montarCatalogo('/catalogo?q=azul&pagina=2');
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ q: 'azul', pagina: 2 });

    await escribir(estado, 'azu', 300);
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ q: 'azu', pagina: 1 });

    await escribir(estado, '', 300);
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).not.toHaveProperty('q');
    expect(router.currentRoute.value.query.q).toBeUndefined();
    expect(estado.productos.value).toHaveLength(3);
  });

  it('no repite la consulta si el término normalizado no cambia ni al sincronizar la URL', async () => {
    const { estado } = await montarCatalogo();
    await escribir(estado, 'azul', 300);
    await flushPromises();
    const llamadas = buscarMock.mock.calls.length;

    await escribir(estado, 'azul  ', 300);
    await flushPromises();
    estado.buscar();
    await flushPromises();
    expect(buscarMock).toHaveBeenCalledTimes(llamadas);
  });

  it('una respuesta antigua no sobrescribe los resultados más recientes', async () => {
    const { estado } = await montarCatalogo();
    let resolverLenta!: (valor: PaginaBusquedaFrontend) => void;
    buscarMock.mockImplementationOnce(() => new Promise((resolve) => { resolverLenta = resolve; }));

    await escribir(estado, 'amarillo', 300);
    await escribir(estado, 'kit', 300);
    await flushPromises();
    buscarMock.mockClear();

    resolverLenta(pagina(9));
    await flushPromises();

    expect(estado.productos.value.map((p) => p.id_producto)).toEqual([1]);
    expect(estado.terminoAplicado.value).toBe('kit');
    expect(estado.cargando.value).toBe(false);
  });

  it('Enter aplica la búsqueda de inmediato sin esperar el debounce', async () => {
    const { estado } = await montarCatalogo();
    estado.termino.value = 'esmalte';
    estado.buscar();
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ q: 'esmalte' });

    const llamadas = buscarMock.mock.calls.length;
    await vi.advanceTimersByTimeAsync(300);
    await flushPromises();
    expect(buscarMock).toHaveBeenCalledTimes(llamadas);
  });
});
