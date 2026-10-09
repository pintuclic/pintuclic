import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { mount } from '@vue/test-utils';
import { useCartStore } from '../store/cart.store';
import { CartService } from '../services/cart.service';
import CartItem from '../components/CartItem.vue';
import type { CartApi } from '../interfaces/cart.interface';

vi.mock('@/modules/m04-cuentas/store/auth.store', () => ({ useAuthStore: () => ({ isAuthenticated: false }) }));
vi.mock('../services/visitor-token.service', () => ({ getVisitorToken: () => 'visitante-prueba' }));

const carrito: CartApi = {
  id_carrito: 1, origen: 'visitante', token_visitante: null, id_usuario: null,
  fecha_ultima_actividad: '', total: '129900.00', total_lineas: 1,
  lineas: [{ id_linea_carrito: 1, id_variante: 4, id_producto: 2,
    nombre_producto: 'Kit Renovación Hogar Premium', descripcion_producto: 'Descripción real',
    presentacion: 'Litro', color: null, base: null, imagen_url: null,
    cantidad: 1, precio_unitario_vigente: '129900.00', subtotal: '129900.00',
    existencia_referencial: 12, estado_variante: 'activo' }],
};

describe('identidad real del carrito', () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.restoreAllMocks(); });

  it('conserva la identidad de la variante 4 al agregar y al recargar sin inventar imagen', async () => {
    vi.spyOn(CartService, 'addVisitorItem').mockResolvedValue(carrito);
    vi.spyOn(CartService, 'getVisitorCart').mockResolvedValue(carrito);
    const store = useCartStore();
    await store.addToCart({ id: 4, name: 'Kit', price: 129900, image: '' });
    expect(store.cartItems[0]).toMatchObject({ name: 'Kit Renovación Hogar Premium', image: '', variant: 'Litro', price: 129900 });
    await store.loadCart();
    expect(store.cartItems[0]?.name).toBe('Kit Renovación Hogar Premium');
    const wrapper = mount(CartItem, { props: { product: store.cartItems[0]!, updating: false } });
    expect(wrapper.find('img').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Brocha');
  });

  it('usa la imagen real y muestra un icono si falla su carga', async () => {
    const datos: CartApi = { ...carrito, lineas: carrito.lineas.map((l) => ({ ...l, imagen_url: '/api/catalogo/imagenes/10/contenido' })) };
    vi.spyOn(CartService, 'getVisitorCart').mockResolvedValue(datos);
    const store = useCartStore(); await store.loadCart();
    const wrapper = mount(CartItem, { props: { product: store.cartItems[0]!, updating: false } });
    expect(wrapper.get('img').attributes('src')).toBe('/api/catalogo/imagenes/10/contenido');
    await wrapper.get('img').trigger('error');
    expect(wrapper.find('img').exists()).toBe(false);
  });
});
