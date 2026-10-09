import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TarjetaProductoPublico from '../../components/publicas/TarjetaProductoPublico.vue';
import type { ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

const producto: ProductoDestacadoPublico = {
  id_producto: 1,
  nombre: 'Producto',
  id_marca: 1,
  clase_color: 'sin_color',
  detalle: {
    id_producto: 1,
    nombre: 'Producto',
    id_marca: 1,
    clase_color: 'sin_color',
    descripcion: null,
    rendimiento_min: null,
    rendimiento_max: null,
    variantes: [],
    imagenes: [
      { id_imagen: 1, id_producto: 1, id_variante: null, id_color: null, mime_type: 'image/png', orden: 0, es_principal: false, contenido_url: '/api/imagenes/1' },
      { id_imagen: 2, id_producto: 1, id_variante: null, id_color: null, mime_type: 'image/png', orden: 1, es_principal: true, contenido_url: '/api/imagenes/2' },
    ],
  },
};

describe('datos reales del catálogo', () => {
  it('usa la imagen principal de la API y no inventa promociones', () => {
    const wrapper = mount(TarjetaProductoPublico, { props: { producto } });
    expect(wrapper.get('img').attributes('src')).toBe('/api/imagenes/2');
    expect(wrapper.text()).not.toContain('-15%');
    expect(wrapper.find('.line-through').exists()).toBe(false);
  });

  it('no sustituye una imagen fallida por un producto de demostración y recupera al cambiar los datos', async () => {
    const wrapper = mount(TarjetaProductoPublico, { props: { producto } });
    await wrapper.get('img').trigger('error');
    expect(wrapper.find('img').exists()).toBe(false);
    await wrapper.setProps({ producto: { ...producto, nombre: 'Producto actualizado' } });
    expect(wrapper.get('img').attributes('src')).toBe('/api/imagenes/2');
  });

  it('no inventa imagen ni color cuando no hay ficha', () => {
    const wrapper = mount(TarjetaProductoPublico, { props: { producto: { ...producto, clase_color: 'entonable', detalle: null } } });
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.find('[style]').exists()).toBe(false);
    expect(wrapper.text()).toContain('Consultar precio');
  });
});
