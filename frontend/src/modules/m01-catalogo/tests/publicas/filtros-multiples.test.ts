import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import VistaCatalogoPublico from '../../views/publicas/VistaCatalogoPublico.vue';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import type {
  FacetasBusquedaFrontend,
  FiltrosBusquedaFrontend,
  PaginaBusquedaFrontend,
} from '@/modules/m02-busqueda/interfaces/busqueda.interface';
import type { CategoriaPublica } from '../../interfaces/publicas/catalogo-publico.interface';

vi.mock('@/modules/m02-busqueda/services/busqueda.service', () => ({
  BusquedaService: { buscar: vi.fn(), facetas: vi.fn() },
}));

const CATEGORIAS: CategoriaPublica[] = [
  { id_categoria: 1, nombre: 'Pinturas Arquitectónicas', subcategorias: [{ id_subcategoria: 1, nombre: 'Interiores y Exteriores' }, { id_subcategoria: 3, nombre: 'Maderas' }] },
  { id_categoria: 2, nombre: 'Preparación y Protección', subcategorias: [{ id_subcategoria: 2, nombre: 'Anticorrosivos' }] },
];

vi.mock('../../services/publicas/catalogo-publico.service', async (original) => {
  const real = await original<typeof import('../../services/publicas/catalogo-publico.service')>();
  return {
    ...real,
    CatalogoPublicoService: {
      listarCategorias: async () => CATEGORIAS,
      listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 16 }),
      obtenerFicha: async (id: number) => ({ id_producto: id, nombre: `Producto ${id}`, descripcion: null, id_marca: 1, clase_color: 'colores_fijos', rendimiento_min: null, rendimiento_max: null, variantes: [], imagenes: [] }),
      listarComplementarios: async () => [],
    },
  };
});

const MARCAS = [{ id: 3, nombre: 'Marca Alfa', cantidad: 10 }, { id: 4, nombre: 'Marca Beta', cantidad: 6 }];
const LINEAS = [{ id: 7, nombre: 'Línea Gamma', cantidad: 9 }, { id: 8, nombre: 'Línea Delta', cantidad: 4 }];

/** Imita la API: cada grupo con selección solo lista sus valores elegidos (facetas conjuntivas). */
function facetasApi(f: FiltrosBusquedaFrontend = {}): FacetasBusquedaFrontend {
  const solo = <T extends { id: number }>(valores: T[], ids?: number[]) => (ids?.length ? valores.filter((v) => ids.includes(v.id)) : valores);
  return {
    categorias: [{ id: 1, nombre: 'Pinturas Arquitectónicas', cantidad: 20 }, { id: 2, nombre: 'Preparación y Protección', cantidad: 8 }],
    subcategorias: [{ id: 1, nombre: 'Interiores y Exteriores', cantidad: 12 }, { id: 2, nombre: 'Anticorrosivos', cantidad: 8 }, { id: 3, nombre: 'Maderas', cantidad: 8 }],
    marcas: solo(MARCAS, f.marca),
    lineas: solo(LINEAS, f.linea),
    resinas: [],
    colores: [],
    presentaciones: [],
  };
}

function pagina(f: FiltrosBusquedaFrontend = {}, base = 0): PaginaBusquedaFrontend {
  return {
    items: Array.from({ length: 4 }, (_, i) => ({ id_producto: base + i + 1, nombre: `Producto ${base + i}`, id_marca: 3, clase_color: 'colores_fijos' as const })),
    total: 4, pagina: f.pagina ?? 1, limite: 16, total_paginas: 1,
  };
}

const buscarMock = vi.mocked(BusquedaService.buscar);
const facetasMock = vi.mocked(BusquedaService.facetas);

async function montar(url = '/catalogo') {
  setActivePinia(createPinia());
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/catalogo', name: 'CatalogoPublico', component: VistaCatalogoPublico },
      { path: '/productos/:productoId', name: 'DetalleProductoPublico', component: { render: () => null } },
      { path: '/calculadora', name: 'CalculadoraPinturaPublica', component: { render: () => null } },
      { path: '/', component: { render: () => null } },
    ],
  });
  await router.push(url);
  await router.isReady();
  const wrapper = mount(VistaCatalogoPublico, { global: { plugins: [router] }, attachTo: document.body });
  await flushPromises();
  return { wrapper, router };
}

const marcar = async (wrapper: Awaited<ReturnType<typeof montar>>['wrapper'], seccion: string, texto: string) => {
  const label = wrapper.findAll(`#filtro-${seccion}-contenido label`).find((l) => l.text().includes(texto));
  if (!label) throw new Error(`Sin opción ${texto}`);
  await label.find('input').trigger('change');
  await flushPromises();
};

describe('panel de filtros: secciones desplegables', () => {
  beforeEach(() => {
    buscarMock.mockReset();
    facetasMock.mockReset();
    facetasMock.mockImplementation(async (f) => facetasApi(f));
    buscarMock.mockImplementation(async (f) => pagina(f));
  });

  it('todas empiezan cerradas, incluso con filtros activos en la URL', async () => {
    const { wrapper } = await montar('/catalogo?marca=3&linea=7&subcategoria=1');
    const abiertas = wrapper.findAll('aside button[aria-expanded="true"]');
    expect(abiertas).toHaveLength(0);
    // El resumen del select cerrado muestra lo elegido.
    expect(wrapper.find('#filtro-marcas-encabezado').text()).toContain('Marca Alfa');
    expect(wrapper.find('#filtro-categorias-encabezado').text()).toContain('Interiores y Exteriores');
    wrapper.unmount();
  });

  it('solo una sección abierta: abrir otra cierra la anterior', async () => {
    const { wrapper } = await montar();
    await wrapper.find('#filtro-categorias-encabezado').trigger('click');
    await wrapper.find('#filtro-marcas-encabezado').trigger('click');
    await flushPromises();
    expect(wrapper.findAll('aside button[aria-expanded="true"]').map((b) => b.attributes('id'))).toEqual(['filtro-marcas-encabezado']);
    await wrapper.find('#filtro-marcas-encabezado').trigger('click');
    await flushPromises();
    expect(wrapper.findAll('aside button[aria-expanded="true"]')).toHaveLength(0);
    wrapper.unmount();
  });
});

describe('selección múltiple', () => {
  beforeEach(() => {
    buscarMock.mockReset();
    facetasMock.mockReset();
    facetasMock.mockImplementation(async (f) => facetasApi(f));
    buscarMock.mockImplementation(async (f) => pagina(f));
  });

  it('dos marcas a la vez (OR): la lista conserva las demás opciones y la URL las guarda', async () => {
    const { wrapper, router } = await montar();
    await marcar(wrapper, 'marcas', 'Marca Alfa');
    // Con una marca elegida, el panel sigue ofreciendo la otra (faceta sin su propio filtro).
    expect(wrapper.findAll('#filtro-marcas-contenido label').map((l) => l.attributes('title'))).toEqual(['Marca Alfa', 'Marca Beta']);
    await marcar(wrapper, 'marcas', 'Marca Beta');
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ marca: [3, 4], pagina: 1 });
    expect(router.currentRoute.value.query).toEqual({ marca: '3,4' });
    expect(facetasMock.mock.calls.some(([f]) => f?.marca?.length === 0)).toBe(true);
    wrapper.unmount();
  });

  it('dos líneas y una marca: OR dentro del grupo, AND entre grupos', async () => {
    const { wrapper, router } = await montar('/catalogo?marca=3');
    await marcar(wrapper, 'lineas', 'Línea Gamma');
    await marcar(wrapper, 'lineas', 'Línea Delta');
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ marca: [3], linea: [7, 8] });
    expect(router.currentRoute.value.query).toEqual({ marca: '3', linea: '7,8' });
    wrapper.unmount();
  });

  it('quitar un chip solo quita ese valor y conserva el resto de filtros', async () => {
    const { wrapper, router } = await montar('/catalogo?marca=3,4&linea=7&orden=precio_asc');
    await wrapper.find('[aria-label="Quitar filtro Marca Alfa"]').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ marca: '4', linea: '7', orden: 'precio_asc' });
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ marca: [4], linea: [7], orden: 'precio_asc' });
    wrapper.unmount();
  });

  it('varias subcategorías o varias categorías completas, sin mezclar ambos tipos', async () => {
    const { wrapper, router } = await montar('/catalogo?subcategoria=1');
    await marcar(wrapper, 'categorias', 'Maderas');
    expect(router.currentRoute.value.query).toEqual({ subcategoria: '1,3' });
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ subcategoria: [1, 3], categoria: [] });
    expect(wrapper.find('main h1').text()).toBe('Varias subcategorías');

    const todaCategoria = wrapper.findAll('#filtro-categorias-contenido label').filter((l) => l.text().startsWith('Toda la categoría'));
    await todaCategoria[1].find('input').trigger('change');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ categoria: '2' });
    await todaCategoria[0].find('input').trigger('change');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ categoria: '2,1' });
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ categoria: [2, 1], subcategoria: [] });
    wrapper.unmount();
  });

  it('atrás y adelante restauran todos los filtros, también marcas, líneas y orden', async () => {
    const { wrapper, router } = await montar('/catalogo?marca=3');
    await marcar(wrapper, 'marcas', 'Marca Beta');
    await wrapper.find('select[aria-label="Ordenar productos"]').setValue('precio_desc');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ marca: '3,4', orden: 'precio_desc' });

    router.back();
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ marca: [3, 4], orden: 'relevancia' });
    router.back();
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ marca: [3] });
    expect((wrapper.findAll('#filtro-marcas-contenido input').map((i) => (i.element as HTMLInputElement).checked))).toEqual([true, false]);
    router.forward();
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ marca: [3, 4] });
    wrapper.unmount();
  });
});

describe('rango de precio (CA-BUS-02-06)', () => {
  beforeEach(() => {
    buscarMock.mockReset();
    facetasMock.mockReset();
    facetasMock.mockImplementation(async (f) => facetasApi(f));
    buscarMock.mockImplementation(async (f) => pagina(f));
  });

  it('mínimo mayor que el máximo: lo informa junto a los campos y no consulta', async () => {
    const { wrapper, router } = await montar('/catalogo?marca=3');
    await wrapper.find('#filtro-precio-encabezado').trigger('click');
    const [min, max] = wrapper.findAll('#filtro-precio-contenido input');
    await min.setValue(50000);
    await max.setValue(10000);
    const llamadas = buscarMock.mock.calls.length;
    await wrapper.find('#filtro-precio-contenido form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('#error-rango-precio').text()).toBe('El precio mínimo no puede ser mayor que el máximo.');
    expect(min.attributes('aria-invalid')).toBe('true');
    expect(buscarMock.mock.calls.length).toBe(llamadas);
    expect(router.currentRoute.value.query).toEqual({ marca: '3' });

    await max.setValue(90000);
    await wrapper.find('#filtro-precio-contenido form').trigger('submit');
    await flushPromises();
    expect(wrapper.find('#error-rango-precio').exists()).toBe(false);
    expect(router.currentRoute.value.query).toEqual({ marca: '3', precioMin: '50000', precioMax: '90000' });
    wrapper.unmount();
  });
});

describe('actualización suave de resultados', () => {
  beforeEach(() => {
    buscarMock.mockReset();
    facetasMock.mockReset();
    facetasMock.mockImplementation(async (f) => facetasApi(f));
    buscarMock.mockImplementation(async (f) => pagina(f));
  });

  it('las tarjetas no se desmontan: se atenúan y se marcan como «actualizando» hasta la respuesta', async () => {
    const { wrapper } = await montar();
    const tarjetaAntes = wrapper.find('main article').element;
    let responder!: (p: PaginaBusquedaFrontend) => void;
    buscarMock.mockImplementationOnce(() => new Promise((r) => { responder = r; }));
    await marcar(wrapper, 'marcas', 'Marca Alfa');

    const zona = wrapper.find('[data-resultados]');
    expect(zona.attributes('aria-busy')).toBe('true');
    expect(zona.classes()).toContain('opacity-40');
    expect(wrapper.find('main article').element).toBe(tarjetaAntes);
    expect(wrapper.findAll('.animate-pulse.h-96')).toHaveLength(0);
    expect(wrapper.find('[data-contador-resultados]').text()).toBe('Actualizando resultados…');

    responder(pagina({}, 50));
    await flushPromises();
    expect(zona.attributes('aria-busy')).toBe('false');
    expect(wrapper.find('[data-contador-resultados]').text()).toBe('Mostrando 1–4 de 4 productos');
    wrapper.unmount();
  });

  it('cambios rápidos: una respuesta antigua que llega tarde no reemplaza la más reciente', async () => {
    const { wrapper } = await montar();
    const pendientes: ((p: PaginaBusquedaFrontend) => void)[] = [];
    buscarMock.mockImplementation(() => new Promise((r) => { pendientes.push(r); }));
    await marcar(wrapper, 'marcas', 'Marca Alfa');
    await marcar(wrapper, 'marcas', 'Marca Beta');
    pendientes[1](pagina({}, 200));
    await flushPromises();
    pendientes[0](pagina({}, 100));
    await flushPromises();
    expect(wrapper.findAll('main article h3').map((h) => h.text())[0]).toBe('Producto 200');
    wrapper.unmount();
  });

  it('ordenar o paginar no vuelve a pedir las facetas', async () => {
    const { wrapper } = await montar();
    const llamadas = facetasMock.mock.calls.length;
    await wrapper.find('select[aria-label="Ordenar productos"]').setValue('precio_desc');
    await flushPromises();
    expect(facetasMock.mock.calls.length).toBe(llamadas);
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ orden: 'precio_desc' });
    wrapper.unmount();
  });
});
