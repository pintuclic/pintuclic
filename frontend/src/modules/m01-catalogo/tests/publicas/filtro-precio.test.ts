import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import VistaCatalogoPublico from '../../views/publicas/VistaCatalogoPublico.vue';
import { rangoPrecioPublicoSchema } from '../../dtos/publicas/catalogo-publico.dto';
import { seleccionarVarianteCompraRapida } from '../../services/publicas/seleccion-variante';
import { BusquedaService } from '@/modules/m02-busqueda/services/busqueda.service';
import { useCartStore } from '@/modules/m05-carrito-compras/store/cart.store';
import type { FichaProductoPublico, VariantePublica } from '../../interfaces/publicas/catalogo-publico.interface';

const variante = (id: number, presentacion: string, color: string, hex: string, precio: number, existencias = 10) => ({
  id_variante: id, id_presentacion: presentacion === 'Litro' ? 3 : 2, presentacion, volumen: presentacion === 'Litro' ? '1.000' : '0.946',
  id_color: id, color, codigo_color: null, muestra_hex: hex, familia_color: null, precio_vigente: precio, existencia_referencial: existencias,
}) as unknown as VariantePublica;

/** Caso de la captura: el cuarto cuesta $23.300 (fuera del rango) y el litro $26.200 (dentro). */
const TINTE = {
  id_producto: 77, nombre: 'Tinte para Madera Brillante', descripcion: null, id_marca: 5, clase_color: 'colores_fijos',
  rendimiento_min: 45, rendimiento_max: 55, imagenes: [],
  variantes: [variante(1, 'Cuarto de Galón', 'Natural', '#D8B98A', 23300), variante(2, 'Litro', 'Nogal', '#5B3A22', 26200)],
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
      listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 32 }),
      obtenerFicha: async () => TINTE,
      listarComplementarios: async () => [],
    },
  };
});

describe('rango de precio: el máximo no puede ser 0', () => {
  it('máximo 0 es un error; mínimo 0 equivale a «desde $0»; vacío es «sin límite»', () => {
    const maximoCero = rangoPrecioPublicoSchema.safeParse({ min: 0, max: 0 });
    expect(maximoCero.success).toBe(false);
    expect(maximoCero.error?.issues[0]?.message).toBe('El precio máximo debe ser mayor que 0.');
    expect(maximoCero.error?.issues[0]?.path).toEqual(['max']);

    expect(rangoPrecioPublicoSchema.parse({ min: 0, max: 50000 })).toEqual({ min: undefined, max: 50000 });
    expect(rangoPrecioPublicoSchema.parse({ min: undefined, max: undefined })).toEqual({ min: undefined, max: undefined });
  });
});

describe('selección de variante con rango de precio', () => {
  it('sin rango elige la más barata con existencias (comportamiento anterior)', () => {
    expect(seleccionarVarianteCompraRapida(TINTE.variantes)?.precio_vigente).toBe(23300);
  });

  it('con rango elige una variante dentro del rango', () => {
    expect(seleccionarVarianteCompraRapida(TINTE.variantes, null, { min: 26000, max: 26800 })?.precio_vigente).toBe(26200);
  });

  it('si ninguna variante cumple el rango, vuelve a la regla normal en lugar de quedarse sin precio', () => {
    expect(seleccionarVarianteCompraRapida(TINTE.variantes, null, { min: 90000 })?.precio_vigente).toBe(23300);
  });

  it('con filtro de presentación elige una variante de esa presentación (Litro → $26.200, no el cuarto)', () => {
    expect(seleccionarVarianteCompraRapida(TINTE.variantes, null, { presentaciones: [3] })?.presentacion).toBe('Litro');
  });

  it('con filtro de color elige una variante de ese color', () => {
    expect(seleccionarVarianteCompraRapida(TINTE.variantes, null, { colores: [2] })?.color).toBe('Nogal');
    expect(seleccionarVarianteCompraRapida(TINTE.variantes, null, { colores: [1] })?.color).toBe('Natural');
  });

  it('si ninguna variante cumple todo a la vez, prioriza el color y luego la presentación sobre el precio', () => {
    // Nogal solo existe en litro a $26.200: con máximo $25.000 se respeta el color y se suelta el precio.
    const elegida = seleccionarVarianteCompraRapida(TINTE.variantes, null, { colores: [2], max: 25000 });
    expect(elegida?.color).toBe('Nogal');
    expect(elegida?.precio_vigente).toBe(26200);
  });
});

describe('catálogo con filtro de precio activo', () => {
  beforeEach(() => {
    vi.mocked(BusquedaService.facetas).mockResolvedValue({ categorias: [], subcategorias: [], marcas: [], lineas: [], resinas: [], colores: [], presentaciones: [] });
    vi.mocked(BusquedaService.buscar).mockResolvedValue({
      items: [{ id_producto: 77, nombre: 'Tinte para Madera Brillante', id_marca: 5, clase_color: 'colores_fijos' }],
      total: 1, pagina: 1, limite: 32, total_paginas: 1,
    });
  });

  async function montar(url: string) {
    setActivePinia(createPinia());
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/catalogo', name: 'CatalogoPublico', component: VistaCatalogoPublico },
        { path: '/productos/:productoId', name: 'DetalleProductoPublico', component: { render: () => null } },
      ],
    });
    await router.push(url);
    await router.isReady();
    const wrapper = mount(VistaCatalogoPublico, { global: { plugins: [router] }, attachTo: document.body });
    await flushPromises();
    return wrapper;
  }

  it('la tarjeta muestra el precio dentro del rango y la compra rápida agrega esa misma variante', async () => {
    const wrapper = await montar('/catalogo?precioMin=26000&precioMax=26800');
    const tarjeta = wrapper.find('article');
    expect(tarjeta.text()).toContain('26.200');
    expect(tarjeta.text()).not.toContain('23.300');

    const carrito = useCartStore();
    const agregar = vi.spyOn(carrito, 'addToCart').mockResolvedValue(undefined as never);
    await tarjeta.find('button[aria-label^="Agregar"]').trigger('click');
    await flushPromises();
    expect(agregar).toHaveBeenCalledWith(expect.objectContaining({ variantId: 2, price: 26200 }));
    wrapper.unmount();
  });

  it('con filtro de presentación la tarjeta muestra y agrega esa presentación', async () => {
    const wrapper = await montar('/catalogo?presentacion=3');
    const tarjeta = wrapper.find('article');
    expect(tarjeta.text()).toContain('26.200');

    const carrito = useCartStore();
    const agregar = vi.spyOn(carrito, 'addToCart').mockResolvedValue(undefined as never);
    await tarjeta.find('button[aria-label^="Agregar"]').trigger('click');
    await flushPromises();
    expect(agregar).toHaveBeenCalledWith(expect.objectContaining({ variantId: 2 }));
    wrapper.unmount();
  });

  it('con filtro de color la compra rápida agrega ese color, no otro más barato', async () => {
    const wrapper = await montar('/catalogo?color=2');
    const carrito = useCartStore();
    const agregar = vi.spyOn(carrito, 'addToCart').mockResolvedValue(undefined as never);
    await wrapper.find('article button[aria-label^="Agregar"]').trigger('click');
    await flushPromises();
    expect(agregar).toHaveBeenCalledWith(expect.objectContaining({ variantId: 2 }));
    wrapper.unmount();
  });

  it.each([
    [9, [4, 4, 1]],
    [31, [4, 4, 4, 4, 4, 4, 4, 3]],
    [32, [8, 8, 8, 8]],
  ])('con %i resultados las filas quedan %j (menos de una página: 4 por fila, todo visible)', async (cantidad, filas) => {
    vi.mocked(BusquedaService.buscar).mockResolvedValue({
      items: Array.from({ length: cantidad }, (_, i) => ({ id_producto: i + 1, nombre: `Producto ${i + 1}`, id_marca: 5, clase_color: 'colores_fijos' })),
      total: cantidad, pagina: 1, limite: 32, total_paginas: 1,
    });
    const wrapper = await montar('/catalogo');
    const carruseles = wrapper.findAll('[aria-roledescription="carrusel"]');
    expect(carruseles.map((c) => c.findAll('[aria-roledescription="diapositiva"]').length)).toEqual(filas);
    expect(carruseles[1]?.attributes('aria-label')).toBe(`Productos ${filas[0] + 1} a ${filas[0] + filas[1]}`);
    wrapper.unmount();
  });

  it('sin filtro de precio la tarjeta sigue mostrando la variante más barata', async () => {
    const wrapper = await montar('/catalogo');
    expect(wrapper.find('article').text()).toContain('23.300');
    wrapper.unmount();
  });

  it('en el panel, un máximo de 0 se informa y no se aplica', async () => {
    const wrapper = await montar('/catalogo');
    await wrapper.find('#filtro-precio-encabezado').trigger('click');
    const [, max] = wrapper.findAll('#filtro-precio-contenido input');
    await max.setValue(0);
    const llamadas = vi.mocked(BusquedaService.buscar).mock.calls.length;
    await wrapper.find('#filtro-precio-contenido form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('#error-rango-precio').text()).toBe('El precio máximo debe ser mayor que 0.');
    expect(max.attributes('aria-invalid')).toBe('true');
    expect(vi.mocked(BusquedaService.buscar).mock.calls.length).toBe(llamadas);
    wrapper.unmount();
  });
});
