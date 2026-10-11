import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import VistaCatalogoPublico from '../../views/publicas/VistaCatalogoPublico.vue';
import PaginacionCatalogoPublico from '../../components/publicas/PaginacionCatalogoPublico.vue';
import MenuCategoriasPublico from '../../components/publicas/MenuCategoriasPublico.vue';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import type { FacetasBusquedaFrontend } from '@/modules/m02-busqueda/interfaces/busqueda.interface';
import type { CategoriaPublica } from '../../interfaces/publicas/catalogo-publico.interface';

vi.mock('@/modules/m02-busqueda/services/busqueda.service', () => ({
  BusquedaService: { buscar: vi.fn(), facetas: vi.fn() },
}));

const CATEGORIAS: CategoriaPublica[] = [
  { id_categoria: 1, nombre: 'Pinturas Arquitectónicas', subcategorias: [{ id_subcategoria: 1, nombre: 'Interiores y Exteriores' }] },
  { id_categoria: 2, nombre: 'Preparación y Protección de Superficies', subcategorias: [{ id_subcategoria: 2, nombre: 'Anticorrosivos e Imprimantes' }] },
];

vi.mock('../../services/publicas/catalogo-publico.service', async (original) => {
  const real = await original<typeof import('../../services/publicas/catalogo-publico.service')>();
  return {
    ...real,
    CatalogoPublicoService: {
      listarCategorias: async () => CATEGORIAS,
      listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 18 }),
      obtenerFicha: async (id: number) => ({ id_producto: id, nombre: `Producto ${id}`, descripcion: null, id_marca: 1, clase_color: 'colores_fijos', rendimiento_min: null, rendimiento_max: null, variantes: [], imagenes: [] }),
      listarComplementarios: async () => [],
    },
  };
});

const FACETAS: FacetasBusquedaFrontend = {
  categorias: [],
  subcategorias: [{ id: 1, nombre: 'Interiores y Exteriores', cantidad: 30 }],
  marcas: [{ id: 3, nombre: '[PRUEBA] Marca con un nombre comercial muy largo', cantidad: 25 }],
  lineas: [{ id: 7, nombre: '[PRUEBA] Línea Profesional Gamma', cantidad: 9 }],
  resinas: [{ id: 1, nombre: 'Base Agua', cantidad: 12 }],
  colores: [{ id: 5, nombre: 'Amarillo Trigo', cantidad: 4 }],
  presentaciones: [{ id: 2, nombre: 'Cuarto de Galón', cantidad: 20 }],
};

const buscarMock = vi.mocked(BusquedaService.buscar);
const facetasMock = vi.mocked(BusquedaService.facetas);

async function montarCatalogo(url = '/catalogo') {
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
  const wrapper = mount(VistaCatalogoPublico, { global: { plugins: [router] } });
  await flushPromises();
  return { wrapper, router };
}

describe('catálogo público: panel de filtros, contador y paginación', () => {
  beforeEach(() => {
    buscarMock.mockReset();
    facetasMock.mockReset();
    facetasMock.mockResolvedValue(FACETAS);
    buscarMock.mockImplementation(async (filtros = {}) => ({
      items: Array.from({ length: Math.min(filtros.limite ?? 16, 40 - ((filtros.pagina ?? 1) - 1) * (filtros.limite ?? 16)) }, (_, i) => ({
        id_producto: (filtros.pagina ?? 1) * 100 + i, nombre: `Producto ${i}`, id_marca: 3, clase_color: 'colores_fijos' as const,
      })),
      total: 40, pagina: filtros.pagina ?? 1, limite: filtros.limite ?? 16, total_paginas: 3,
    }));
  });

  it('solo muestra las seis secciones acordadas (sin colores ni disponibilidad)', async () => {
    const { wrapper } = await montarCatalogo();
    const titulos = wrapper.findAll('aside h3').map((h) => h.text().trim());
    expect(titulos).toEqual(['Categorías', 'Marcas', 'Línea comercial', 'Tipo de resina', 'Presentación', 'Rango de precio']);
    expect(wrapper.text()).not.toContain('Colores disponibles');
    expect(wrapper.text()).not.toContain('Disponibilidad');
    expect(wrapper.text()).not.toContain('Con existencia');
  });

  it('pide 16 productos por página y muestra un único contador sobre las tarjetas', async () => {
    const { wrapper } = await montarCatalogo();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ limite: 16, pagina: 1 });
    expect(wrapper.findAll('article')).toHaveLength(16);
    expect(wrapper.find('[data-contador-resultados]').text()).toBe('Mostrando 1–16 de 40 productos');
    expect(wrapper.text().match(/Mostrando/g)).toHaveLength(1);
  });

  it('elimina el selector cuadrícula/lista y conserva «Ordenar por» con sus opciones', async () => {
    const { wrapper } = await montarCatalogo();
    expect(wrapper.find('[aria-label="Vista en lista"]').exists()).toBe(false);
    expect(wrapper.find('[aria-label="Vista en cuadrícula"]').exists()).toBe(false);
    const opciones = wrapper.findAll('select[aria-label="Ordenar productos"] option').map((o) => o.attributes('value'));
    expect(opciones).toEqual(['relevancia', 'precio_asc', 'precio_desc', 'novedad']);
    await wrapper.find('select[aria-label="Ordenar productos"]').setValue('precio_desc');
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ orden: 'precio_desc', pagina: 1 });
  });

  it('abrir o cerrar un acordeón no altera los filtros seleccionados', async () => {
    const { wrapper, router } = await montarCatalogo();
    const encabezado = () => wrapper.find('#filtro-lineas-encabezado');
    expect(encabezado().attributes('aria-expanded')).toBe('false');
    await encabezado().trigger('click');
    expect(encabezado().attributes('aria-expanded')).toBe('true');
    await wrapper.find('#filtro-lineas-contenido input[type="checkbox"]').setValue(true);
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ linea: [7] });
    const llamadas = buscarMock.mock.calls.length;

    await encabezado().trigger('click');
    await encabezado().trigger('click');
    await flushPromises();
    expect(buscarMock.mock.calls.length).toBe(llamadas);
    expect((wrapper.find('#filtro-lineas-contenido input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true);
    expect(encabezado().text()).toContain('1');
    expect(router.currentRoute.value.query.linea).toBe('7');
  });

  it('muestra los filtros activos como chips removibles, incluido el color llegado por URL', async () => {
    const { wrapper, router } = await montarCatalogo('/catalogo?marca=3&color=5&precioMin=1000');
    const chips = wrapper.findAll('[aria-label^="Quitar filtro"]').map((c) => c.text());
    expect(chips).toEqual(['[PRUEBA] Marca con un nombre comercial muy largo', 'Amarillo Trigo', 'Precio: $1.000 – sin límite']);

    await wrapper.find('[aria-label="Quitar filtro Amarillo Trigo"]').trigger('click');
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ color: [], marca: [3], precio_min: 1000 });
    expect(router.currentRoute.value.query).toEqual({ marca: '3', precioMin: '1000' });
  });

  it('la paginación navega sin repetir el contador y conserva los filtros', async () => {
    const { wrapper, router } = await montarCatalogo('/catalogo?marca=3');
    const nav = wrapper.findComponent(PaginacionCatalogoPublico);
    expect(nav.text()).not.toContain('Mostrando');
    await nav.find('[aria-label="Página 3"]').trigger('click');
    await flushPromises();
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ pagina: 3, marca: [3], limite: 16 });
    expect(router.currentRoute.value.query).toEqual({ marca: '3', pagina: '3' });
    expect(wrapper.find('[data-contador-resultados]').text()).toBe('Mostrando 33–40 de 40 productos');
  });
});

describe('paginación del catálogo', () => {
  it('resume con «…» cuando hay muchas páginas', () => {
    const wrapper = mount(PaginacionCatalogoPublico, { props: { pagina: 5, totalPaginas: 10 } });
    const textos = wrapper.findAll('nav > *').map((n) => n.text());
    expect(textos.slice(1, -1)).toEqual(['1', '…', '4', '5', '6', '…', '10']);
  });

  it('no se muestra con una sola página', () => {
    expect(mount(PaginacionCatalogoPublico, { props: { pagina: 1, totalPaginas: 1 } }).find('nav').exists()).toBe(false);
  });
});

describe('menú de categorías', () => {
  it('permite ver todos, elegir una categoría y navegar a su subcategoría', async () => {
    const wrapper = mount(MenuCategoriasPublico, {
      props: { abierto: true, cargando: false, categorias: CATEGORIAS },
      global: { stubs: { teleport: true } },
    });
    expect(wrapper.text()).toContain('Interiores y Exteriores');
    expect(wrapper.text()).not.toContain('Anticorrosivos e Imprimantes');

    await wrapper.findAll('button').find((b) => b.text().includes('Preparación y Protección'))?.trigger('click');
    expect(wrapper.text()).toContain('Anticorrosivos e Imprimantes');
    await wrapper.findAll('button').find((b) => b.text().includes('Anticorrosivos e Imprimantes'))?.trigger('click');
    expect(wrapper.emitted('seleccionar')).toEqual([[2]]);

    await wrapper.findAll('button').find((b) => b.text().includes('Ver todos los productos'))?.trigger('click');
    expect(wrapper.emitted('seleccionarTodos')).toHaveLength(1);
  });
});
