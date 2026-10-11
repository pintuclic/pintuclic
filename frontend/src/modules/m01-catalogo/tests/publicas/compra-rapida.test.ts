import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TarjetaProductoPublico from '../../components/publicas/TarjetaProductoPublico.vue';
import { seleccionarVarianteCompraRapida } from '../../services/publicas/seleccion-variante';
import type { ProductoDestacadoPublico, VariantePublica } from '../../interfaces/publicas/catalogo-publico.interface';

const variante = (id: number, precio: number, stock: number): VariantePublica => ({
  id_variante: id, precio_vigente: precio, existencia_referencial: stock,
  id_presentacion: id, presentacion: 'Litro', volumen: 1,
  id_color: null, color: null, id_base: null, base: null,
});

describe('precio y selección de compra rápida', () => {
  it('muestra el precio de la variante disponible que se agregará, aunque otra agotada sea más barata', () => {
    const variantes = [variante(1, 100, 0), variante(2, 300, 10), variante(3, 200, 5)];
    const producto: ProductoDestacadoPublico = {
      id_producto: 2, nombre: 'Kit', id_marca: 1, clase_color: 'sin_color',
      detalle: { id_producto: 2, nombre: 'Kit', id_marca: 1, clase_color: 'sin_color',
        descripcion: null, rendimiento_min: null, rendimiento_max: null, imagenes: [], variantes },
    };
    const wrapper = mount(TarjetaProductoPublico, { props: { producto } });
    expect(wrapper.text()).toContain('$200 COP');
    expect(seleccionarVarianteCompraRapida(variantes)?.id_variante).toBe(3);
  });

  it('respeta el color del abanico sin mezclar sus precios con otro color', () => {
    const variantes = [{ ...variante(1, 100, 10), id_color: 1 }, { ...variante(2, 200, 10), id_color: 2 }];
    expect(seleccionarVarianteCompraRapida(variantes, 2)?.id_variante).toBe(2);
    expect(seleccionarVarianteCompraRapida(variantes, 99)?.id_variante).toBe(1);
  });

  it('mantiene una selección determinista sin stock y rechaza precios no válidos', () => {
    expect(seleccionarVarianteCompraRapida([variante(1, 300, 0), variante(2, 200, 0)])?.id_variante).toBe(2);
    expect(seleccionarVarianteCompraRapida([variante(1, NaN, 4)])).toBeUndefined();
    expect(seleccionarVarianteCompraRapida([])).toBeUndefined();
  });
});
