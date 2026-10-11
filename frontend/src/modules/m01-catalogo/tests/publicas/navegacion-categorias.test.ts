import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import VistaInicioPublica from '../../views/publicas/VistaInicioPublica.vue';
import { useCatalogoPublico } from '../../composables/publicas/useCatalogoPublico';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import type { CatalogoPublicoGateway, CategoriaPublica } from '../../interfaces/publicas/catalogo-publico.interface';

vi.mock('@/modules/m02-busqueda/services/busqueda.service', () => ({
  BusquedaService: { buscar: vi.fn(), facetas: vi.fn() },
}));

const CATEGORIAS: CategoriaPublica[] = [
  { id_categoria: 1, nombre: 'Pinturas Arquitectónicas', subcategorias: [{ id_subcategoria: 1, nombre: 'Interiores y Exteriores' }, { id_subcategoria: 3, nombre: 'Esmaltes y Lacas' }] },
  { id_categoria: 2, nombre: 'Preparación y Protección de Superficies', subcategorias: [{ id_subcategoria: 2, nombre: 'Anticorrosivos e Imprimantes' }] },
];

const listarProductos = vi.fn(async () => ({ items: [], total: 0, pagina: 1, limite: 5 }));
vi.mock('../../services/publicas/catalogo-publico.service', async (original) => {
  const real = await original<typeof import('../../services/publicas/catalogo-publico.service')>();
  return {
    ...real,
    CatalogoPublicoService: {
      listarCategorias: async () => CATEGORIAS,
      listarProductos: (...args: unknown[]) => listarProductos(...(args as [])),
      obtenerFicha: async () => { throw new Error('no usado'); },
      listarComplementarios: async () => [],
    },
  };
});

function crearRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'InicioTiendaPublica', component: VistaInicioPublica },
      { path: '/catalogo', name: 'CatalogoPublico', component: { render: () => null } },
      { path: '/calculadora', name: 'CalculadoraPinturaPublica', component: { render: () => null } },
      { path: '/productos/:productoId', name: 'DetalleProductoPublico', component: { render: () => null } },
    ],
  });
}

async function montarInicio() {
  setActivePinia(createPinia());
  const router = crearRouter();
  await router.push('/');
  await router.isReady();
  const wrapper = mount(VistaInicioPublica, { global: { plugins: [router], stubs: { teleport: true } } });
  await flushPromises();
  return { wrapper, router };
}

const boton = (wrapper: Awaited<ReturnType<typeof montarInicio>>['wrapper'], texto: string) =>
  wrapper.findAll('button').find((b) => b.text().replace(/\s+/g, ' ').includes(texto));

describe('Inicio → «Explora nuestras categorías» → catálogo', () => {
  beforeEach(() => listarProductos.mockClear());

  it('«Ver categorías» abre el modal; categoría → subcategoría cierra el modal y navega al catálogo filtrado', async () => {
    const { wrapper, router } = await montarInicio();
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    await boton(wrapper, 'Ver categorías')?.trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    const enModal = (texto: string) => wrapper.find('[role="dialog"]').findAll('button').find((x) => x.text().includes(texto));
    await enModal('Preparación y Protección')?.trigger('click');
    await enModal('Anticorrosivos e Imprimantes')?.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe('/catalogo?subcategoria=2');
    // Los destacados del inicio no se vuelven a pedir filtrados.
    expect(listarProductos).toHaveBeenCalledTimes(1);
  });

  it('«Ver todos los productos» cierra el modal y abre el catálogo completo', async () => {
    const { wrapper, router } = await montarInicio();
    await boton(wrapper, 'Ver categorías')?.trigger('click');
    await boton(wrapper, 'Ver todos los productos')?.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/catalogo');
  });

  it('la tarjeta de una categoría navega al catálogo con la categoría completa (id de la API)', async () => {
    const { wrapper, router } = await montarInicio();
    const tarjeta = wrapper.findAll('#categorias button').find((b) => b.text().includes('Pinturas Arquitectónicas'));
    await tarjeta?.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/catalogo?categoria=1');
    expect(listarProductos).toHaveBeenCalledTimes(1);
  });
});

describe('catálogo: filtro por categoría completa desde la URL', () => {
  const buscarMock = vi.mocked(BusquedaService.buscar);
  const gateway: CatalogoPublicoGateway = {
    listarCategorias: async () => CATEGORIAS,
    listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 16 }),
    obtenerFicha: async () => { throw new Error('no usado'); },
    listarComplementarios: async () => [],
  };

  beforeEach(() => {
    buscarMock.mockReset();
    vi.mocked(BusquedaService.facetas).mockResolvedValue({ categorias: [], subcategorias: [], marcas: [], lineas: [], resinas: [], colores: [], presentaciones: [] });
    buscarMock.mockResolvedValue({ items: [], total: 0, pagina: 1, limite: 16, total_paginas: 1 });
  });

  async function montarCatalogo(url: string) {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/catalogo', component: { render: () => null } }] });
    await router.push(url);
    await router.isReady();
    let estado!: ReturnType<typeof useCatalogoPublico>;
    mount(defineComponent({ setup() { estado = useCatalogoPublico(gateway); return () => h('div'); } }), { global: { plugins: [router] } });
    await flushPromises();
    return { estado, router };
  }

  it('aplica ?categoria= y lo combina con orden y página', async () => {
    const { estado } = await montarCatalogo('/catalogo?categoria=1&orden=precio_asc&pagina=2');
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ categoria: [1], subcategoria: [], orden: 'precio_asc', pagina: 2 });
    expect(estado.categoriasSeleccionadas.value).toEqual([1]);
  });

  it('elegir una subcategoría quita la categoría y viceversa, conservando los demás filtros', async () => {
    const { estado, router } = await montarCatalogo('/catalogo?categoria=1&marca=3');
    estado.seleccionarSubcategoria(3);
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ subcategoria: '3', marca: '3' });
    estado.seleccionarCategoria(2);
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ categoria: '2', marca: '3' });
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ categoria: [2], subcategoria: [], marca: [3], pagina: 1 });
  });

  it('atrás y adelante restauran la categoría/subcategoría de la URL', async () => {
    const { estado, router } = await montarCatalogo('/catalogo?subcategoria=2');
    estado.seleccionarCategoria(1);
    await flushPromises();
    router.back();
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ subcategoria: '2' });
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ subcategoria: [2], categoria: [] });
    router.forward();
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ categoria: [1] });
  });

  it('limpiar quita también la categoría', async () => {
    const { estado, router } = await montarCatalogo('/catalogo?categoria=1');
    estado.limpiar();
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/catalogo');
    expect(estado.categoriasSeleccionadas.value).toEqual([]);
  });
});
