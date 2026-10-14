import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router';
import CalculadoraPinturaContenido from '../../components/publicas/CalculadoraPinturaContenido.vue';
import CalculadoraPinturaPublica from '../../components/publicas/CalculadoraPinturaPublica.vue';
import MenuCategoriasPublico from '../../components/publicas/MenuCategoriasPublico.vue';
import VistaCatalogoPublico from '../../views/publicas/VistaCatalogoPublico.vue';
import VistaDetalleProductoPublico from '../../views/publicas/VistaDetalleProductoPublico.vue';
import { useDetalleProductoPublico } from '../../composables/publicas/useDetalleProductoPublico';
import { galonesNecesarios, unidadesParaGalones } from '../../services/publicas/calculo-pintura';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import { useCartStore } from '@/modules/m05-carrito-compras/store/cart.store';
import type { CategoriaPublica, FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

vi.mock('@/modules/m02-busqueda/services/busqueda.service', () => ({
  BusquedaService: { buscar: vi.fn(), facetas: vi.fn() },
}));

/** Pintura de 10–12 m²/galón/mano, con galón (3 en existencia) y cuarto de galón. */
const FICHA = {
  id_producto: 9,
  nombre: 'Vinilo de prueba',
  descripcion: null,
  id_marca: 1,
  clase_color: 'colores_fijos',
  rendimiento_min: 10,
  rendimiento_max: 12,
  variantes: [
    {
      id_variante: 90, id_presentacion: 1, presentacion: 'Galón', volumen: '3.785', id_color: null, color: null,
      codigo_color: null, muestra_hex: null, familia_color: null, precio_vigente: 100000, existencia_referencial: 3,
    },
  ],
  imagenes: [],
} as unknown as FichaProductoPublico;

vi.mock('../../services/publicas/catalogo-publico.service', async (original) => {
  const real = await original<typeof import('../../services/publicas/catalogo-publico.service')>();
  return {
    ...real,
    CatalogoPublicoService: {
      listarCategorias: async () => [],
      listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 16 }),
      obtenerFicha: async () => FICHA,
      listarComplementarios: async () => [],
    },
  };
});

const buscarMock = vi.mocked(BusquedaService.buscar);
const facetasMock = vi.mocked(BusquedaService.facetas);
const FACETAS = { categorias: [], subcategorias: [], marcas: [], lineas: [], resinas: [], colores: [], presentaciones: [] };

// jsdom no implementa <dialog>; los modales de la ficha se sustituyen salvo cuando se prueban.
const STUBS_FICHA = {
  VisualizadorAmbientesPublico: true,
  ProductosComplementariosPublicos: true,
  CartaColoresProductoPublica: true,
  CalculadoraPinturaPublica: true,
};

const RUTAS = [
  { path: '/', component: { render: () => null } },
  { path: '/catalogo', name: 'CatalogoPublico', component: { render: () => null } },
  { path: '/productos/:productoId', name: 'DetalleProductoPublico', component: VistaDetalleProductoPublico, props: true },
  { path: '/calculadora', name: 'CalculadoraPinturaPublica', component: { render: () => null } },
];

async function montarFicha(router = createRouter({ history: createMemoryHistory(), routes: RUTAS })) {
  setActivePinia(createPinia());
  if (router.currentRoute.value.path !== '/productos/9') await router.push('/productos/9');
  await router.isReady();
  const wrapper = mount(VistaDetalleProductoPublico, {
    props: { productoId: '9' },
    global: { plugins: [router], stubs: STUBS_FICHA },
  });
  await flushPromises();
  return { wrapper, router };
}

describe('1 · calculadora → carrito: se agrega la cantidad calculada', () => {
  it('convierte los galones a unidades de la presentación elegida', () => {
    expect(unidadesParaGalones(5, '3.785')).toBe(5);
    expect(unidadesParaGalones(1, '3.785')).toBe(1);
    // El cuarto se guarda como 0,946 L: 1 galón son 4 cuartos y 5 galones son 20, no 5 y 21.
    expect(unidadesParaGalones(1, '0.946')).toBe(4);
    expect(unidadesParaGalones(5, '0.946')).toBe(20);
    expect(unidadesParaGalones(5, '1')).toBe(19); // litros (18,9 L)
    expect(unidadesParaGalones(5, null)).toBe(5); // sin volumen: se asume galón
    expect(unidadesParaGalones(0, '3.785')).toBe(0);
  });

  it('convierte desde la cantidad exacta, no desde los galones ya redondeados (caso de la captura)', () => {
    // Barniz de 45 m²/gal/mano: 25 m² a 2 manos = 1,11 galones = 4,2 L.
    const galones = galonesNecesarios(25, 45);
    expect(galones).toBeCloseTo(1.111, 3);
    expect(unidadesParaGalones(galones, '3.785')).toBe(2); // galones
    expect(unidadesParaGalones(galones, '0.946')).toBe(5); // cuartos (antes recomendaba 9)
    expect(unidadesParaGalones(galones, '1')).toBe(5); // litros (antes 8)
    // Una pared pequeña de 5 m² cabe en un cuarto (antes recomendaba 5).
    expect(unidadesParaGalones(galonesNecesarios(5, 45), '0.946')).toBe(1);
    expect(galonesNecesarios(0, 45)).toBe(0);
    expect(galonesNecesarios(10, 0)).toBe(0);
  });

  it('la calculadora muestra y emite las unidades de la presentación', async () => {
    const producto = { ...FICHA, rendimiento_min: 10, rendimiento_max: 10 } as FichaProductoPublico;
    const wrapper = mount(CalculadoraPinturaContenido, {
      props: { producto, presentacion: { nombre: 'Cuarto de Galón', volumen: '0.946' } },
    });
    // 5 m × 2,5 m × 2 superficies = 25 m²; a 2 manos y 10 m²/gal = 5 galones = 20 cuartos.
    expect(wrapper.find('[data-testid="unidades-recomendadas"]').text()).toBe('Se agregarán 20 unidades de Cuarto de Galón.');
    // El resultado principal se expresa en la presentación elegida, con los litros de referencia.
    expect(wrapper.find('[data-testid="resultado-calculadora"]').text()).toMatch(/20\s*unidades de Cuarto de Galón/);
    expect(wrapper.find('[data-testid="detalle-resultado"]').text()).toContain('aprox. 18,9 litros');
    await wrapper.findAll('button').find((b) => b.text().includes('Agregar al carrito'))?.trigger('click');
    expect(wrapper.emitted('agregar')).toEqual([[20]]);
  });

  it('caso de la captura: barniz de 45 m²/gal en cuartos recomienda 5, no 9', async () => {
    const barniz = { ...FICHA, rendimiento_min: 40, rendimiento_max: 50 } as FichaProductoPublico;
    const wrapper = mount(CalculadoraPinturaContenido, {
      props: { producto: barniz, presentacion: { nombre: 'Cuarto de Galón', volumen: '0.946' } },
    });
    expect(wrapper.text()).toContain('45.0 m² por galón y mano');
    expect(wrapper.find('[data-testid="resultado-calculadora"]').text()).toMatch(/5\s*unidades de Cuarto de Galón/);
    expect(wrapper.find('[data-testid="detalle-resultado"]').text()).toContain('aprox. 4,2 litros');
    await wrapper.findAll('button').find((b) => b.text().includes('Agregar al carrito'))?.trigger('click');
    expect(wrapper.emitted('agregar')).toEqual([[5]]);
  });

  it('con la presentación galón, el resultado se muestra en galones', () => {
    const barniz = { ...FICHA, rendimiento_min: 40, rendimiento_max: 50 } as FichaProductoPublico;
    const wrapper = mount(CalculadoraPinturaContenido, {
      props: { producto: barniz, presentacion: { nombre: 'Galón', volumen: '3.785' } },
    });
    expect(wrapper.find('[data-testid="resultado-calculadora"]').text()).toMatch(/2\s*galones/);
  });

  it('el diálogo retransmite las unidades', async () => {
    // jsdom crea <dialog> pero sin showModal/close.
    const proto = window.HTMLDialogElement.prototype as { showModal?: () => void; close?: () => void };
    proto.showModal ??= () => undefined;
    proto.close ??= () => undefined;
    const Hijo = CalculadoraPinturaContenido;
    const wrapper = mount(CalculadoraPinturaPublica, {
      props: { abierta: false, producto: FICHA },
      global: { stubs: { teleport: true } },
    });
    wrapper.findComponent(Hijo).vm.$emit('agregar', 7);
    expect(wrapper.emitted('agregar')).toEqual([[7]]);
  });

  it('la ficha agrega toda la cantidad recomendada aunque supere la existencia referencial (venta sin stock)', async () => {
    const { wrapper } = await montarFicha();
    const carrito = useCartStore();
    const agregar = vi.spyOn(carrito, 'addToCart').mockResolvedValue(undefined as never);

    // La variante tiene 3 en existencia: ya no se recorta a 3 (el límite es solo para combos, RF-CAT-13-02).
    wrapper.findComponent({ name: 'CalculadoraPinturaPublica' }).vm.$emit('agregar', 5);
    await flushPromises();

    expect(agregar).toHaveBeenCalledWith(expect.objectContaining({ variantId: 90 }), 5);
    expect(wrapper.text()).not.toContain('disponibles');
    wrapper.unmount();
  });
});

describe('2 · rendimiento de la ficha a 2 manos', () => {
  it('reparte el rendimiento por galón y mano entre las 2 manos que anuncia', async () => {
    const { wrapper } = await montarFicha();
    // 10–12 m²/gal/mano en 1 galón a 2 manos = 5–6 m² (antes mostraba 10–12 con el texto «a 2 manos»).
    expect(wrapper.text()).toContain('Rendimiento estimado: 5 a 6 m²');
    expect(wrapper.text()).toContain('Superficie que cubre 1 Galón a 2 manos.');
    wrapper.unmount();
  });
});

describe('3 · «Anterior» vuelve al catálogo con sus filtros', () => {
  it('si se llegó desde el catálogo, regresa a la misma URL con filtros y orden', async () => {
    const router = createRouter({ history: createWebHistory(), routes: RUTAS });
    await router.push('/catalogo?marca=3&orden=precio_asc&pagina=2');
    await router.push('/productos/9');
    const { wrapper } = await montarFicha(router);

    await wrapper.findAll('button').find((b) => b.text().includes('Anterior'))?.trigger('click');
    await new Promise((resolver) => setTimeout(resolver, 30));
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe('/catalogo?marca=3&orden=precio_asc&pagina=2');
    wrapper.unmount();
  });

  it('si se llegó de otra página, abre el catálogo sin filtros', async () => {
    const router = createRouter({ history: createWebHistory(), routes: RUTAS });
    await router.push('/');
    await router.push('/productos/9');
    const { wrapper } = await montarFicha(router);

    await wrapper.findAll('button').find((b) => b.text().includes('Anterior'))?.trigger('click');
    await flushPromises();

    expect(router.currentRoute.value.fullPath).toBe('/catalogo');
    wrapper.unmount();
  });
});

describe('4 · fallo de las opciones de filtro', () => {
  beforeEach(() => {
    buscarMock.mockReset();
    facetasMock.mockReset();
    buscarMock.mockResolvedValue({ items: [], total: 0, pagina: 1, limite: 16, total_paginas: 0 });
  });

  it('se informa en el panel y «Reintentar» vuelve a pedirlas', async () => {
    facetasMock.mockRejectedValueOnce(new Error('caída'));
    setActivePinia(createPinia());
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/catalogo', name: 'CatalogoPublico', component: VistaCatalogoPublico }, ...RUTAS.filter((r) => r.path !== '/catalogo')],
    });
    await router.push('/catalogo');
    await router.isReady();
    const wrapper = mount(VistaCatalogoPublico, { global: { plugins: [router] }, attachTo: document.body });
    await flushPromises();

    expect(wrapper.find('#error-facetas').text()).toContain('No pudimos actualizar las opciones de los filtros.');
    // Los resultados siguen disponibles: el fallo de facetas no bloquea el catálogo.
    expect(wrapper.text()).not.toContain('No fue posible cargar el catálogo público');

    facetasMock.mockResolvedValue(FACETAS);
    const llamadas = facetasMock.mock.calls.length;
    await wrapper.find('#error-facetas button').trigger('click');
    await flushPromises();

    expect(facetasMock.mock.calls.length).toBeGreaterThan(llamadas);
    expect(wrapper.find('#error-facetas').exists()).toBe(false);
    wrapper.unmount();
  });
});

const CATEGORIAS: CategoriaPublica[] = [
  { id_categoria: 1, nombre: 'Pinturas Arquitectónicas', subcategorias: [{ id_subcategoria: 1, nombre: 'Interiores y Exteriores' }] },
  { id_categoria: 2, nombre: 'Preparación y Protección', subcategorias: [{ id_subcategoria: 2, nombre: 'Anticorrosivos' }] },
];

describe('10 y 12 · menú de categorías', () => {
  it('no muestra el número de subcategorías junto a cada categoría', () => {
    const wrapper = mount(MenuCategoriasPublico, {
      props: { abierto: true, cargando: false, categorias: CATEGORIAS },
      global: { stubs: { teleport: true } },
    });
    const boton = wrapper.findAll('ul[aria-label="Categorías"] button')[0];
    expect(boton.text()).toBe('Pinturas Arquitectónicas');
    wrapper.unmount();
  });

  it('al abrir enfoca «Cerrar», Escape lo cierra y el foco vuelve al botón que lo abrió', async () => {
    const disparador = document.createElement('button');
    document.body.appendChild(disparador);
    disparador.focus();

    const wrapper = mount(MenuCategoriasPublico, {
      props: { abierto: false, cargando: false, categorias: CATEGORIAS },
      global: { stubs: { teleport: true } },
      attachTo: document.body,
    });
    await wrapper.setProps({ abierto: true });
    await flushPromises();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Cerrar categorías');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('cerrar')).toHaveLength(1);

    await wrapper.setProps({ abierto: false });
    await flushPromises();
    expect(document.activeElement).toBe(disparador);

    wrapper.unmount();
    disparador.remove();
  });

  it('Tab desde el último control vuelve al primero (el foco no sale del diálogo)', async () => {
    const wrapper = mount(MenuCategoriasPublico, {
      props: { abierto: true, cargando: false, categorias: CATEGORIAS },
      global: { stubs: { teleport: true } },
      attachTo: document.body,
    });
    await flushPromises();
    const enfocables = wrapper.findAll('button:not([disabled])');
    (enfocables[enfocables.length - 1].element as HTMLElement).focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
    expect(document.activeElement).toBe(enfocables[0].element);
    wrapper.unmount();
  });
});

describe('14 · ficha y paleta sin menú de categorías propio', () => {
  it('la ficha no monta el menú (vive en el encabezado)', async () => {
    const { wrapper } = await montarFicha();
    expect(wrapper.findComponent(MenuCategoriasPublico).exists()).toBe(false);
    wrapper.unmount();
  });

  it('un fallo del servicio de categorías ya no deja la ficha como «no disponible»', async () => {
    const servicio = {
      listarCategorias: vi.fn().mockRejectedValue(new Error('caída')),
      listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 5 }),
      obtenerFicha: async () => FICHA,
      listarComplementarios: async () => [],
    };
    let detalle!: ReturnType<typeof useDetalleProductoPublico>;
    mount(defineComponent({ setup() { detalle = useDetalleProductoPublico(ref(9), servicio); return () => null; } }));
    await flushPromises();

    expect(detalle.error.value).toBeNull();
    expect(detalle.producto.value?.nombre).toBe('Vinilo de prueba');
    expect(servicio.listarCategorias).not.toHaveBeenCalled();
  });
});
