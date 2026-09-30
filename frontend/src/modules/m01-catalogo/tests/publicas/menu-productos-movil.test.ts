import { describe, expect, it } from 'vitest';
import { mount, RouterLinkStub } from '@vue/test-utils';
import MenuNavegacionMovil from '../../components/publicas/MenuNavegacionMovil.vue';

const categorias = [
  { id_categoria: 1, nombre: 'Pinturas', subcategorias: [{ id_subcategoria: 11, nombre: 'Interiores' }] },
  { id_categoria: 2, nombre: 'Herramientas', subcategorias: [{ id_subcategoria: 22, nombre: 'Brochas' }] },
];

describe('menú móvil de productos M01', () => {
  it('abre todas las secciones y navega de Productos a una subcategoría', async () => {
    const wrapper = mount(MenuNavegacionMovil, {
      props: { abierto: true, cargando: false, error: false, categorias },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    const pulsar = async (texto: string) => {
      const boton = wrapper.findAll('button').find((item) => item.text().trim() === texto);
      expect(boton).toBeDefined();
      await boton?.trigger('click');
    };

    for (const seccion of ['Inicio', 'Productos', 'Ofertas', 'Servicios', 'Paleta de Color', 'Sobre Nosotros']) {
      expect(wrapper.text()).toContain(seccion);
    }
    await pulsar('Productos');
    expect(wrapper.text()).toContain('Ver todos los productos');
    await pulsar('Ver todos los productos');
    expect(wrapper.emitted('seleccionarTodos')).toHaveLength(1);

    await pulsar('Pinturas');
    expect(wrapper.text()).toContain('Interiores');
    expect(wrapper.text()).not.toContain('Brochas');
    await pulsar('Interiores');
    expect(wrapper.emitted('seleccionar')).toEqual([[11]]);

    await wrapper.setProps({ abierto: false });
    await wrapper.setProps({ abierto: true });
    expect(wrapper.text()).toContain('Productos');
    expect(wrapper.text()).not.toContain('Interiores');
  });

  it('vuelve a la categoría del catálogo filtrado al abrir el menú', async () => {
    const wrapper = mount(MenuNavegacionMovil, {
      props: { abierto: false, cargando: false, error: false, categorias, subcategoriaActual: 11 },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    await wrapper.setProps({ abierto: true });
    expect(wrapper.text()).toContain('Interiores');
    expect(wrapper.text()).not.toContain('Brochas');
    expect(wrapper.find('nav').classes()).toContain('backdrop-blur-2xl');
    expect(wrapper.find('nav').classes()).toContain('bg-neutral-black/50');
  });
});
