import { describe, expect, it } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import CalculadoraPinturaContenido from '../../components/publicas/CalculadoraPinturaContenido.vue';
import VistaCalculadoraPinturaPublica from '../../views/publicas/VistaCalculadoraPinturaPublica.vue';
import type { FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

describe('calculadora pública M01', () => {
  it('regresa al catálogo y conserva el filtro al pulsar Anterior', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/catalogo', component: { template: '<div />' } },
        { path: '/calculadora', component: VistaCalculadoraPinturaPublica },
      ],
    });
    await router.push('/calculadora?volver=%2Fcatalogo%3Fsubcategoria%3D1');
    await router.isReady();
    const wrapper = mount(VistaCalculadoraPinturaPublica, { global: { plugins: [router] } });

    const anterior = wrapper.findAll('button').find((button) => button.text().includes('Anterior'));
    expect(anterior).toBeDefined();
    await anterior?.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/catalogo?subcategoria=1');
  });

  it('calcula sin elegir producto y permite continuar al catálogo', async () => {
    const wrapper = mount(CalculadoraPinturaContenido);

    expect(wrapper.text()).toContain('Cálculo general');
    expect(wrapper.text()).toMatch(/2\s*galones/);
    expect(wrapper.text()).not.toContain('Agregar al carrito');
    await wrapper.findAll('button').find((button) => button.text() === 'Ver productos')?.trigger('click');
    expect(wrapper.emitted('verProductos')).toHaveLength(1);
  });

  it('usa el rendimiento del producto seleccionado y permite volver al detalle', async () => {
    const producto = {
      id_producto: 7,
      nombre: 'Pintura de prueba',
      rendimiento_min: 10,
      rendimiento_max: 10,
    } as FichaProductoPublico;
    const wrapper = mount(CalculadoraPinturaContenido, {
      props: { producto, mostrarVolver: true },
    });

    expect(wrapper.text()).toContain('Pintura de prueba');
    expect(wrapper.text()).toMatch(/5\s*galones/);
    expect(wrapper.text()).not.toContain('Ver productos');
    await wrapper.findAll('button').find((button) => button.text() === 'Volver al producto')?.trigger('click');
    expect(wrapper.emitted('verProducto')).toHaveLength(1);
  });
});
