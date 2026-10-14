import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import VistaCatalogoPublico from '../../views/publicas/VistaCatalogoPublico.vue';
import VistaInicioPublica from '../../views/publicas/VistaInicioPublica.vue';
import { usePaletaColoresPublica, PRODUCTOS_POR_PAGINA_PALETA } from '../../composables/publicas/usePaletaColoresPublica';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import { useCartStore } from '@/modules/m05-carrito-compras/store/cart.store';
import type { FichaProductoPublico, VariantePublica } from '../../interfaces/publicas/catalogo-publico.interface';

const variante = (id: number, presentacion: string, color: string, precio: number) => ({
  id_variante: id, id_presentacion: presentacion === 'Litro' ? 3 : 2, presentacion, volumen: presentacion === 'Litro' ? '1.000' : '0.946',
  id_color: id, color, codigo_color: null, muestra_hex: '#5B3A22', familia_color: null, precio_vigente: precio, existencia_referencial: 10,
}) as unknown as VariantePublica;

/** Natural solo en cuarto ($23.300) y Nogal solo en litro ($26.200). */
const TINTE = {
  id_producto: 77, nombre: 'Tinte para Madera', descripcion: null, id_marca: 5, clase_color: 'colores_fijos',
  rendimiento_min: 45, rendimiento_max: 55, imagenes: [],
  variantes: [variante(1, 'Cuarto de Galón', 'Natural', 23300), variante(2, 'Litro', 'Nogal', 26200)],
} as unknown as FichaProductoPublico;

vi.mock('@/modules/m02-busqueda/services/busqueda.service', () => ({
  BusquedaService: { buscar: vi.fn(), facetas: vi.fn() },
}));

vi.mock('../../services/publicas/catalogo-publico.service', async (original) => {
  const real = await original<typeof import('../../services/publicas/catalogo-publico.service')>();
  return {
    ...real,
    CatalogoPublicoService: {
      listarCategorias: async () => [],
      listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 10 }),
      obtenerFicha: async () => TINTE,
      listarComplementarios: async () => [],
    },
  };
});

const buscarMock = vi.mocked(BusquedaService.buscar);
const facetasMock = vi.mocked(BusquedaService.facetas);
const COLORES = [{ id: 90, nombre: 'Nogal', cantidad: 11 }, { id: 92, nombre: 'Cedro', cantidad: 10 }, { id: 93, nombre: 'Natural', cantidad: 4 }];

function routerPublico() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'InicioTiendaPublica', component: { render: () => null } },
      { path: '/catalogo', name: 'CatalogoPublico', component: VistaCatalogoPublico },
      { path: '/productos/:productoId', name: 'DetalleProductoPublico', component: { render: () => null } },
      { path: '/calculadora', name: 'CalculadoraPinturaPublica', component: { render: () => null } },
    ],
  });
}

async function montar(url: string) {
  setActivePinia(createPinia());
  const router = routerPublico();
  await router.push(url);
  await router.isReady();
  const wrapper = mount(VistaCatalogoPublico, { global: { plugins: [router] }, attachTo: document.body });
  await flushPromises();
  return { wrapper, router };
}

beforeEach(() => {
  buscarMock.mockReset();
  facetasMock.mockReset();
  facetasMock.mockImplementation(async (f) => ({
    categorias: [], subcategorias: [], marcas: [], lineas: [], resinas: [], presentaciones: [],
    colores: f?.color?.length ? COLORES.filter((c) => f.color!.includes(c.id)) : COLORES,
  }));
  buscarMock.mockResolvedValue({
    items: [{ id_producto: 77, nombre: 'Tinte para Madera', id_marca: 5, clase_color: 'colores_fijos' }],
    total: 1, pagina: 1, limite: 32, total_paginas: 1,
  });
});

describe('M02-03: filtro de color en el panel', () => {
  it('ofrece los colores de las facetas, se buscan por nombre y se aplican a la búsqueda y la URL', async () => {
    const { wrapper, router } = await montar('/catalogo');
    // Opciones de color (el buscador de la sección también es un <label>).
    const opciones = () => wrapper.findAll('#filtro-colores-contenido label').filter((l) => !l.find('input[type="search"]').exists());
    const nombres = () => opciones().map((l) => l.text().replace(/\d+$/, '').trim());
    expect(nombres()).toEqual(['Nogal', 'Cedro', 'Natural']);

    await opciones()[0].find('input').trigger('change');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ color: '90' });
    expect(buscarMock.mock.lastCall?.[0]).toMatchObject({ color: [90] });
    // Las opciones del grupo se cuentan sin su propio filtro, para poder sumar otro color (OR).
    expect(facetasMock.mock.calls.some(([f]) => Array.isArray(f?.color) && f.color.length === 0)).toBe(true);
    expect(nombres()).toEqual(['Nogal', 'Cedro', 'Natural']);

    await wrapper.find('#filtro-colores-contenido input[type="search"]').setValue('ced');
    // El color marcado sigue visible aunque no coincida con el texto.
    expect(nombres()).toEqual(['Nogal', 'Cedro']);
    wrapper.unmount();
  });
});

describe('M02-12: el rango de precio del enlace sigue las reglas del panel', () => {
  it.each([
    ['?precioMax=0', 'El precio máximo debe ser mayor que 0.'],
    ['?precioMin=-5', 'El precio no puede ser negativo.'],
  ])('%s no se aplica y se explica el motivo', async (consulta, motivo) => {
    const { wrapper } = await montar(`/catalogo${consulta}`);
    expect(buscarMock.mock.lastCall?.[0]?.precio_max).toBeUndefined();
    expect(buscarMock.mock.lastCall?.[0]?.precio_min).toBeUndefined();
    expect(wrapper.text()).toContain(`El rango de precio del enlace no era válido y no se aplicó: ${motivo}`);
    wrapper.unmount();
  });
});

describe('M02-12 B: sin variante que cumpla todos los filtros no se relajan en silencio', () => {
  it('la tarjeta lo avisa y la compra rápida lleva a la ficha en lugar de agregar otra variante', async () => {
    // Nogal solo existe a $26.200: con máximo $25.000 ninguna variante cumple color y precio.
    const { wrapper, router } = await montar('/catalogo?color=2&precioMax=25000');
    const tarjeta = wrapper.find('article');
    expect(tarjeta.find('[data-coincidencia-parcial]').text()).toBe('Ninguna opción cumple todos los filtros; elígela en el producto.');

    const agregar = vi.spyOn(useCartStore(), 'addToCart').mockResolvedValue(undefined as never);
    await tarjeta.find('button[aria-label="Elegir una opción en el producto"]').trigger('click');
    await flushPromises();
    expect(agregar).not.toHaveBeenCalled();
    expect(router.currentRoute.value.fullPath).toBe('/productos/77');
    wrapper.unmount();
  });

  it('si una variante cumple todo, no hay aviso y se agrega', async () => {
    const { wrapper } = await montar('/catalogo?color=2&precioMax=30000');
    expect(wrapper.find('[data-coincidencia-parcial]').exists()).toBe(false);
    const agregar = vi.spyOn(useCartStore(), 'addToCart').mockResolvedValue(undefined as never);
    await wrapper.find('article button[aria-label="Agregar producto al carrito"]').trigger('click');
    await flushPromises();
    expect(agregar).toHaveBeenCalledWith(expect.objectContaining({ variantId: 2 }));
    wrapper.unmount();
  });
});

describe('M02-13: si la búsqueda falla se lleva al inicio con un aviso', () => {
  it('el catálogo navega al inicio y el inicio informa sin detalles técnicos', async () => {
    buscarMock.mockRejectedValue(new Error('ECONNREFUSED 10.0.0.1:3000'));
    const { router } = await montar('/catalogo?q=azul');
    expect(router.currentRoute.value.path).toBe('/');
    expect(router.currentRoute.value.query).toEqual({ aviso: 'busqueda-no-disponible' });

    setActivePinia(createPinia());
    const inicio = mount(VistaInicioPublica, { global: { plugins: [router], stubs: { MenuCategoriasPublico: true } } });
    await flushPromises();
    expect(inicio.text()).toContain('La búsqueda de productos no está disponible en este momento.');
    expect(inicio.text()).not.toContain('ECONNREFUSED');
    // La URL se limpia para que recargar no repita el aviso.
    expect(router.currentRoute.value.query).toEqual({});
    inicio.unmount();
  });
});

describe('M01-16: la paleta reúne los colores de todo el catálogo', () => {
  it('pide todas las páginas (hasta el tope), no solo los primeros 20 productos', async () => {
    const listarProductos = vi.fn(async ({ pagina }: { pagina?: number }) => ({
      items: [{ id_producto: pagina ?? 1, nombre: `P${pagina}`, descripcion: null, id_marca: 1, clase_color: 'colores_fijos' as const }],
      total: 150, pagina: pagina ?? 1, limite: PRODUCTOS_POR_PAGINA_PALETA,
    }));
    const servicio = {
      listarCategorias: async () => [],
      listarProductos,
      obtenerFicha: async () => TINTE,
      listarComplementarios: async () => [],
    };
    let paleta!: ReturnType<typeof usePaletaColoresPublica>;
    mount(defineComponent({ setup() { paleta = usePaletaColoresPublica(servicio); return () => null; } }));
    await flushPromises();

    expect(listarProductos.mock.calls.map(([o]) => o)).toEqual([
      { pagina: 1, limite: PRODUCTOS_POR_PAGINA_PALETA },
      { pagina: 2, limite: PRODUCTOS_POR_PAGINA_PALETA },
    ]);
    expect(paleta.colores.value.map((c) => c.nombre)).toEqual(['Natural', 'Nogal']);
  });
});
