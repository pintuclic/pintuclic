import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref, type Ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { useProductosComplementarios } from '../../composables/publicas/useProductosComplementarios';
import { useDetalleProductoPublico } from '../../composables/publicas/useDetalleProductoPublico';
import ProductosComplementariosPublicos from '../../components/publicas/ProductosComplementariosPublicos.vue';
import type {
  CatalogoPublicoGateway,
  FichaProductoPublico,
  ProductoDestacadoPublico,
  ProductoPublicoResumen,
  VariantePublica,
} from '../../interfaces/publicas/catalogo-publico.interface';

const variante: VariantePublica = {
  id_variante: 1, id_presentacion: 1, presentacion: 'Galón', volumen: 3.785, id_color: null, color: null,
  codigo_color: null, muestra_hex: null, familia_color: null, id_base: null, base: null, precio_vigente: 20000, existencia_referencial: 5,
};

const resumen = (id: number, nombre = `Producto ${id}`): ProductoPublicoResumen => ({ id_producto: id, nombre, id_marca: 1, clase_color: 'sin_color' });

function ficha(id: number, conVariantes = true): FichaProductoPublico {
  return {
    id_producto: id, nombre: `Producto ${id}`, descripcion: null, id_marca: 1, clase_color: 'sin_color',
    rendimiento_min: null, rendimiento_max: null, variantes: conVariantes ? [{ ...variante, id_variante: id * 10 }] : [], imagenes: [],
  };
}

function gateway(parcial: Partial<CatalogoPublicoGateway>): CatalogoPublicoGateway {
  return {
    listarCategorias: async () => [],
    listarProductos: async () => ({ items: [], total: 0, pagina: 1, limite: 16 }),
    obtenerFicha: async (id) => ficha(id),
    listarComplementarios: async () => [],
    ...parcial,
  };
}

function montar<T>(usar: () => T): T {
  let resultado!: T;
  mount(defineComponent({ setup() { resultado = usar(); return () => h('div'); } }));
  return resultado;
}

describe('HU-CAT-08: carga de productos complementarios', () => {
  it('muestra los complementarios de la categoría configurada (enriquecidos con su ficha)', async () => {
    const servicio = gateway({ listarComplementarios: async () => [resumen(93, 'Bandeja'), resumen(99, 'Brocha')] });
    const { complementarios } = montar(() => useProductosComplementarios(ref(4), servicio));
    await flushPromises();
    expect(complementarios.value.map((p) => p.nombre)).toEqual(['Bandeja', 'Brocha']);
    expect(complementarios.value[0]?.detalle?.variantes).toHaveLength(1);
  });

  it('muestra los patrocinados que devuelve el endpoint cuando no hay categoría complementaria', async () => {
    const patrocinados = [resumen(3, 'Esmalte'), resumen(4, 'Vinilo A'), resumen(5, 'Vinilo B'), resumen(6, 'Vinilo C')];
    const { complementarios } = montar(() => useProductosComplementarios(ref(62), gateway({ listarComplementarios: async () => patrocinados })));
    await flushPromises();
    expect(complementarios.value.map((p) => p.id_producto)).toEqual([3, 4, 5, 6]);
  });

  it('excluye el producto actual y los repetidos, y muestra como máximo 4', async () => {
    const lista = [resumen(4), resumen(7), resumen(7), resumen(8), resumen(9), resumen(10), resumen(11)];
    const obtenerFicha = vi.fn(async (id: number) => ficha(id));
    const { complementarios } = montar(() => useProductosComplementarios(ref(4), gateway({ listarComplementarios: async () => lista, obtenerFicha })));
    await flushPromises();
    expect(complementarios.value.map((p) => p.id_producto)).toEqual([7, 8, 9, 10]);
    // Solo se piden las fichas de los 4 que se muestran (sin consultas de más).
    expect(obtenerFicha).toHaveBeenCalledTimes(4);
  });

  it('omite productos sin ficha pública o sin variantes activas, usando la ficha ya cargada', async () => {
    const obtenerFicha = vi.fn(async (id: number) => {
      if (id === 9) throw new Error('404');
      return ficha(id, id !== 8);
    });
    const { complementarios } = montar(() =>
      useProductosComplementarios(ref(1), gateway({ listarComplementarios: async () => [resumen(7), resumen(8), resumen(9)], obtenerFicha }))
    );
    await flushPromises();
    expect(complementarios.value.map((p) => p.id_producto)).toEqual([7]);
    expect(obtenerFicha).toHaveBeenCalledTimes(3);
  });

  it('sin resultados la lista queda vacía', async () => {
    const { complementarios, cargando } = montar(() => useProductosComplementarios(ref(1), gateway({})));
    await flushPromises();
    expect(complementarios.value).toEqual([]);
    expect(cargando.value).toBe(false);
  });

  it('si el endpoint falla, la lista queda vacía y la ficha principal se carga igual', async () => {
    const servicio = gateway({ listarComplementarios: async () => { throw new Error('500'); } });
    const detalle = montar(() => useDetalleProductoPublico(ref(4), servicio));
    await flushPromises();
    expect(detalle.complementarios.value).toEqual([]);
    expect(detalle.producto.value?.id_producto).toBe(4);
    expect(detalle.error.value).toBeNull();
  });

  it('al cambiar rápido de producto, una respuesta antigua no sobrescribe la actual', async () => {
    let resolverLenta!: (lista: ProductoPublicoResumen[]) => void;
    const listarComplementarios = vi.fn(async (id: number) =>
      id === 4 ? new Promise<ProductoPublicoResumen[]>((r) => { resolverLenta = r; }) : [resumen(50, 'Del producto 5')]
    );
    const id: Ref<number> = ref(4);
    const { complementarios } = montar(() => useProductosComplementarios(id, gateway({ listarComplementarios })));
    await flushPromises();
    id.value = 5;
    await flushPromises();
    resolverLenta([resumen(40, 'Del producto 4')]);
    await flushPromises();
    expect(complementarios.value.map((p) => p.nombre)).toEqual(['Del producto 5']);
  });

  it('la ficha tampoco se sobrescribe con una respuesta antigua', async () => {
    let resolverLenta!: (f: FichaProductoPublico) => void;
    const obtenerFicha = vi.fn(async (idProd: number) => (idProd === 4 ? new Promise<FichaProductoPublico>((r) => { resolverLenta = r; }) : ficha(idProd)));
    const id: Ref<number> = ref(4);
    const detalle = montar(() => useDetalleProductoPublico(id, gateway({ obtenerFicha })));
    await flushPromises();
    id.value = 5;
    await flushPromises();
    resolverLenta(ficha(4));
    await flushPromises();
    expect(detalle.producto.value?.id_producto).toBe(5);
  });
});

describe('presentación de «Productos que te pueden interesar»', () => {
  const productos: ProductoDestacadoPublico[] = [7, 8, 9].map((id) => ({ ...resumen(id), detalle: ficha(id) }));

  it('se oculta por completo sin resultados', () => {
    const wrapper = mount(ProductosComplementariosPublicos, { props: { productos: [] } });
    expect(wrapper.html()).not.toContain('Productos que te pueden interesar');
    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('muestra el título, una tarjeta pública por producto y una rejilla de hasta 4 columnas', () => {
    const wrapper = mount(ProductosComplementariosPublicos, { props: { productos } });
    expect(wrapper.find('h2').text()).toBe('Productos que te pueden interesar');
    expect(wrapper.findAll('article')).toHaveLength(3);
    expect(wrapper.find('.grid').classes()).toEqual(expect.arrayContaining(['lg:grid-cols-4', 'md:grid-cols-3', 'min-[480px]:grid-cols-2']));
  });

  it('propaga «Ver producto» y «Agregar al carrito» para reutilizar la navegación y el carrito de la ficha', async () => {
    const wrapper = mount(ProductosComplementariosPublicos, { props: { productos } });
    await wrapper.findAll('article')[1]?.findAll('button').find((b) => b.text() === 'Ver producto')?.trigger('click');
    await wrapper.findAll('article')[2]?.find('button[aria-label="Agregar producto al carrito"]').trigger('click');
    expect(wrapper.emitted('ver')).toEqual([[8]]);
    expect(wrapper.emitted('agregar')).toEqual([[9]]);
  });
});
