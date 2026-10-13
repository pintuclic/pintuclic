import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import CarruselProductosPublico from '../../components/publicas/CarruselProductosPublico.vue';
import { LIMITE_DESTACADOS, useInicioPublico } from '../../composables/publicas/useInicioPublico';
import { FILAS_POR_PAGINA, LIMITE_PAGINA, PRODUCTOS_POR_FILA } from '../../composables/publicas/useCatalogoPublico';
import VistaCatalogoPublico from '../../views/publicas/VistaCatalogoPublico.vue';
import type { FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

const ELEMENTOS = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, nombre: `Producto ${i + 1}` }));

/** jsdom no calcula diseño: se simula una fila de 8 tarjetas donde caben 4 (800 px de 1600). */
function simularMedidas(pista: HTMLElement, scrollLeft = 0) {
  Object.defineProperty(pista, 'clientWidth', { configurable: true, value: 800 });
  Object.defineProperty(pista, 'scrollWidth', { configurable: true, value: 1600 });
  Object.defineProperty(pista, 'scrollLeft', { configurable: true, value: scrollLeft });
}

function montarCarrusel() {
  return mount(CarruselProductosPublico, {
    props: { elementos: ELEMENTOS, etiqueta: 'Productos de prueba', claveDe: (e: unknown) => (e as { id: number }).id },
    slots: { elemento: ({ elemento }: { elemento: unknown }) => h('article', (elemento as { nombre: string }).nombre) },
    attachTo: document.body,
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('carrusel de productos manual', () => {
  it('muestra todos los productos de la fila como diapositivas accesibles', () => {
    const wrapper = montarCarrusel();
    expect(wrapper.attributes('aria-roledescription')).toBe('carrusel');
    expect(wrapper.attributes('aria-label')).toBe('Productos de prueba');
    const diapositivas = wrapper.findAll('[aria-roledescription="diapositiva"]');
    expect(diapositivas).toHaveLength(8);
    expect(diapositivas[0].attributes('aria-label')).toBe('1 de 8');
    wrapper.unmount();
  });

  it('no avanza solo: con el paso del tiempo no se desplaza ni deja temporizadores', async () => {
    vi.useFakeTimers();
    const scrollBy = vi.fn();
    const wrapper = montarCarrusel();
    const pista = wrapper.find('[tabindex="0"]').element as HTMLElement;
    pista.scrollBy = scrollBy;

    vi.advanceTimersByTime(60_000);

    expect(scrollBy).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    wrapper.unmount();
  });

  it('las flechas avanzan y retroceden una pantalla y se desactivan en los extremos', async () => {
    const wrapper = montarCarrusel();
    const pista = wrapper.find('[tabindex="0"]').element as HTMLElement;
    const scrollBy = vi.fn();
    pista.scrollBy = scrollBy;

    simularMedidas(pista, 0);
    await wrapper.find('[tabindex="0"]').trigger('scroll');
    expect(wrapper.find('[data-anterior]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-siguiente]').attributes('disabled')).toBeUndefined();

    await wrapper.find('[data-siguiente]').trigger('click');
    expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: 800 }));

    simularMedidas(pista, 800);
    await wrapper.find('[tabindex="0"]').trigger('scroll');
    expect(wrapper.find('[data-siguiente]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-anterior]').attributes('disabled')).toBeUndefined();

    await wrapper.find('[data-anterior]').trigger('click');
    expect(scrollBy).toHaveBeenLastCalledWith(expect.objectContaining({ left: -800 }));
    wrapper.unmount();
  });

  it('también se maneja con las flechas del teclado', async () => {
    const wrapper = montarCarrusel();
    const pista = wrapper.find('[tabindex="0"]');
    const scrollBy = vi.fn();
    (pista.element as HTMLElement).scrollBy = scrollBy;
    simularMedidas(pista.element as HTMLElement);

    await pista.trigger('keydown', { key: 'ArrowRight' });
    await pista.trigger('keydown', { key: 'ArrowLeft' });

    expect(scrollBy.mock.calls.map(([opciones]) => opciones.left)).toEqual([800, -800]);
    wrapper.unmount();
  });

  it('sin productos de sobra no muestra flechas', () => {
    const wrapper = montarCarrusel();
    expect(wrapper.find('[data-siguiente]').exists()).toBe(false);
    wrapper.unmount();
  });
});

describe('tamaños acordados por el líder técnico', () => {
  it('catálogo: 4 filas de 8 productos por página', () => {
    expect(PRODUCTOS_POR_FILA).toBe(8);
    expect(FILAS_POR_PAGINA).toBe(4);
    expect(LIMITE_PAGINA).toBe(32);
  });

  it('inicio: el carrusel de destacados pide 10 productos', async () => {
    const listarProductos = vi.fn(async () => ({ items: [], total: 0, pagina: 1, limite: LIMITE_DESTACADOS }));
    const servicio = {
      listarCategorias: async () => [],
      listarProductos,
      obtenerFicha: async () => ({}) as FichaProductoPublico,
      listarComplementarios: async () => [],
    };
    mount(defineComponent({ setup() { useInicioPublico(servicio); return () => null; } }));
    await flushPromises();

    expect(LIMITE_DESTACADOS).toBe(10);
    expect(listarProductos).toHaveBeenCalledWith({ pagina: 1, limite: 10 });
  });
});

vi.mock('@/modules/m02-busqueda/services/busqueda.service', () => ({
  BusquedaService: {
    buscar: vi.fn(async () => ({ items: [], total: 0, pagina: 1, limite: 32, total_paginas: 0 })),
    facetas: vi.fn(async () => ({ categorias: [], subcategorias: [], marcas: [], lineas: [], resinas: [], colores: [], presentaciones: [] })),
  },
}));

describe('fondo del catálogo', () => {
  it('es gris claro como el inicio, no blanco', async () => {
    const { createRouter, createMemoryHistory } = await import('vue-router');
    const { createPinia, setActivePinia } = await import('pinia');
    setActivePinia(createPinia());
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/catalogo', name: 'CatalogoPublico', component: VistaCatalogoPublico }] });
    await router.push('/catalogo');
    await router.isReady();
    const wrapper = mount(VistaCatalogoPublico, { global: { plugins: [router] } });
    await flushPromises();

    expect(wrapper.classes()).toContain('bg-neutral-lightest');
    expect(wrapper.classes()).not.toContain('bg-neutral-white');
    wrapper.unmount();
  });
});
