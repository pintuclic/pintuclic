import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import CalculadoraPinturaContenido from '../../components/publicas/CalculadoraPinturaContenido.vue';
import VistaCatalogoPublico from '../../views/publicas/VistaCatalogoPublico.vue';
import VistaDetalleProductoPublico from '../../views/publicas/VistaDetalleProductoPublico.vue';
import { calculadoraPinturaSchema } from '../../dtos/publicas/calculadora-pintura.dto';
import { rangoPrecioPublicoSchema } from '../../dtos/publicas/catalogo-publico.dto';
import { useInicioPublico } from '../../composables/publicas/useInicioPublico';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import type { FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

vi.mock('@/modules/m02-busqueda/services/busqueda.service', () => ({
  BusquedaService: { buscar: vi.fn(), facetas: vi.fn() },
}));

const FICHA: FichaProductoPublico = {
  id_producto: 9,
  nombre: 'Esmalte de prueba',
  descripcion: null,
  id_marca: 1,
  clase_color: 'colores_fijos',
  rendimiento_min: null,
  rendimiento_max: null,
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
const FACETAS_VACIAS = { categorias: [], subcategorias: [], marcas: [], lineas: [], resinas: [], colores: [], presentaciones: [] };

function routerPublico() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/catalogo', name: 'CatalogoPublico', component: VistaCatalogoPublico },
      { path: '/productos/:productoId', name: 'DetalleProductoPublico', component: VistaDetalleProductoPublico, props: true },
      { path: '/calculadora', name: 'CalculadoraPinturaPublica', component: { render: () => null } },
      { path: '/', component: { render: () => null } },
    ],
  });
}

describe('calculadora: medidas inválidas no producen recomendación', () => {
  const producto = { id_producto: 7, nombre: 'Pintura', rendimiento_min: 10, rendimiento_max: 10 } as FichaProductoPublico;

  it.each([
    ['0', 0, 'El ancho debe ser de al menos 0,1 m.'],
    ['negativo', -3, 'El ancho debe ser de al menos 0,1 m.'],
    ['0,05 (bajo el mínimo del campo)', 0.05, 'El ancho debe ser de al menos 0,1 m.'],
    ['mayor que 100', 101, 'El ancho no puede superar 100 m.'],
    ['vacío', '', 'Ingresa el ancho en metros.'],
  ])('ancho %s: muestra el error, oculta los galones y no deja agregar', async (_caso, valor, mensaje) => {
    const wrapper = mount(CalculadoraPinturaContenido, { props: { producto } });
    const [ancho] = wrapper.findAll('input[type="number"]');
    await ancho.setValue(valor);

    expect(wrapper.find('#error-calculadora-ancho').text()).toBe(mensaje);
    expect(ancho.attributes('aria-invalid')).toBe('true');
    expect(wrapper.text()).not.toMatch(/\d+\s*gal(ón|ones)\b/);
    expect(wrapper.text()).toContain('Corrige las medidas de la superficie');

    const agregar = wrapper.findAll('button').find((b) => b.text().includes('Agregar al carrito'));
    expect(agregar?.attributes('disabled')).toBeDefined();
    await agregar?.trigger('click');
    expect(wrapper.emitted('agregar')).toBeUndefined();
  });

  it('al corregir la medida vuelve a calcular y permite agregar', async () => {
    const wrapper = mount(CalculadoraPinturaContenido, { props: { producto } });
    const [ancho] = wrapper.findAll('input[type="number"]');
    await ancho.setValue(0);
    await ancho.setValue(5);

    expect(wrapper.find('#error-calculadora-ancho').exists()).toBe(false);
    expect(wrapper.text()).toMatch(/5\s*galones/);
    await wrapper.findAll('button').find((b) => b.text().includes('Agregar al carrito'))?.trigger('click');
    expect(wrapper.emitted('agregar')).toHaveLength(1);
  });

  it('el alto también se valida', async () => {
    const wrapper = mount(CalculadoraPinturaContenido);
    const [, alto] = wrapper.findAll('input[type="number"]');
    await alto.setValue(0);
    expect(wrapper.find('#error-calculadora-alto').text()).toBe('El alto debe ser de al menos 0,1 m.');
  });

  it('el esquema rechaza 0, negativos y vacío, y acepta el mínimo de 0,1 m', () => {
    const base = { superficie: 'paredes' as const, alto: 2.5, cantidad: 2 };
    expect(calculadoraPinturaSchema.safeParse({ ...base, ancho: 0 }).success).toBe(false);
    expect(calculadoraPinturaSchema.safeParse({ ...base, ancho: -1 }).success).toBe(false);
    expect(calculadoraPinturaSchema.safeParse({ ...base, ancho: '' }).success).toBe(false);
    expect(calculadoraPinturaSchema.safeParse({ ...base, ancho: 0.1 }).success).toBe(true);
  });
});

describe('rango de precio: negativos y enlaces inválidos', () => {
  beforeEach(() => {
    buscarMock.mockReset();
    facetasMock.mockReset();
    facetasMock.mockResolvedValue(FACETAS_VACIAS);
    buscarMock.mockResolvedValue({ items: [], total: 0, pagina: 1, limite: 16, total_paginas: 0 });
  });

  it('el esquema informa un precio negativo y trata 0 o vacío como «sin límite»', () => {
    const negativo = rangoPrecioPublicoSchema.safeParse({ min: -50, max: 100 });
    expect(negativo.success).toBe(false);
    expect(negativo.error?.issues[0]?.message).toBe('El precio no puede ser negativo.');
    expect(rangoPrecioPublicoSchema.parse({ min: 0, max: undefined })).toEqual({ min: undefined, max: undefined });
  });

  it('un precio negativo en el panel se informa y no consulta', async () => {
    setActivePinia(createPinia());
    const router = routerPublico();
    await router.push('/catalogo');
    await router.isReady();
    const wrapper = mount(VistaCatalogoPublico, { global: { plugins: [router] }, attachTo: document.body });
    await flushPromises();

    await wrapper.find('#filtro-precio-encabezado').trigger('click');
    const [, max] = wrapper.findAll('#filtro-precio-contenido input');
    await max.setValue(-10);
    const llamadas = buscarMock.mock.calls.length;
    await wrapper.find('#filtro-precio-contenido form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('#error-rango-precio').text()).toBe('El precio no puede ser negativo.');
    expect(max.attributes('aria-invalid')).toBe('true');
    expect(buscarMock.mock.calls.length).toBe(llamadas);
    wrapper.unmount();
  });

  it('un enlace con el mínimo mayor que el máximo carga el catálogo sin ese rango y lo explica', async () => {
    setActivePinia(createPinia());
    const router = routerPublico();
    await router.push('/catalogo?precioMin=500000&precioMax=100');
    await router.isReady();
    const wrapper = mount(VistaCatalogoPublico, { global: { plugins: [router] }, attachTo: document.body });
    await flushPromises();

    const filtros = buscarMock.mock.lastCall?.[0];
    expect(filtros?.precio_min).toBeUndefined();
    expect(filtros?.precio_max).toBeUndefined();
    expect(wrapper.text()).toContain('El rango de precio del enlace no era válido');
    expect(wrapper.text()).not.toContain('No fue posible cargar el catálogo público');
    wrapper.unmount();
  });
});

describe('ficha: la cantidad no supera las existencias de la variante', () => {
  it('el botón «+» se detiene en las existencias disponibles', async () => {
    setActivePinia(createPinia());
    const router = routerPublico();
    await router.push('/productos/9');
    await router.isReady();
    const wrapper = mount(VistaDetalleProductoPublico, {
      props: { productoId: '9' },
      // jsdom no implementa <dialog>: los modales de la ficha no intervienen en la cantidad.
      global: {
        plugins: [router],
        stubs: {
          VisualizadorAmbientesPublico: true,
          ProductosComplementariosPublicos: true,
          CalculadoraPinturaPublica: true,
          CartaColoresProductoPublica: true,
          MenuCategoriasPublico: true,
        },
      },
    });
    await flushPromises();

    const mas = wrapper.find('button[aria-label="Aumentar cantidad"]');
    for (let i = 0; i < 6; i++) await mas.trigger('click');

    const cantidad = mas.element.previousElementSibling?.textContent?.trim();
    expect(cantidad).toBe('3');
    expect(mas.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });
});

describe('inicio: el buscador usa el mismo motor que el catálogo', () => {
  it('consulta la búsqueda de M02 con el término normalizado', async () => {
    const buscar = vi.fn().mockResolvedValue({ items: [], total: 0, pagina: 1, limite: 5, total_paginas: 0 });
    const servicio = {
      listarCategorias: async () => [],
      listarProductos: vi.fn(async () => ({ items: [], total: 0, pagina: 1, limite: 5 })),
      obtenerFicha: async () => FICHA,
      listarComplementarios: async () => [],
    };
    const { buscar: buscarInicio } = useInicioPublico(servicio, { buscar });

    await buscarInicio('  VINÍLTEX  ');

    expect(buscar).toHaveBeenCalledWith({ q: 'VINÍLTEX', pagina: 1, limite: 10 });
    expect(servicio.listarProductos).not.toHaveBeenCalled();
  });
});
