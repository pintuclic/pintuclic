import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defineComponent } from 'vue';
import SeccionMisPedidos from '../components/SeccionMisPedidos.vue';
import PanelSeguimiento from '../components/PanelSeguimiento.vue';
import { useMisPedidos } from '../composables/useMisPedidos';
import { clasificarErrorCarga } from '../composables/clasificarErrorCarga';
import { OrdenesService } from '../services/ordenes.service';
import type { DetallePedido, PedidosCliente } from '../interfaces/ordenes.interface';

/**
 * M08 · Vistas del cliente ante errores de carga.
 *
 * Antes, un 500 o una caída de red mostraban pedidos de ejemplo como si fueran del
 * cliente. Estas pruebas fijan que eso no vuelva a pasar: ante un fallo se ve un
 * estado de error con «Reintentar» y ningún dato de pedido.
 */

vi.mock('../services/ordenes.service', () => ({
  OrdenesService: {
    misPedidos: vi.fn(),
    detalle: vi.fn(),
  },
}));

const servicio = vi.mocked(OrdenesService);

/** Error con respuesta HTTP, con la misma forma que los de axios. */
function errorHttp(status: number): Error {
  return Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });
}

/** Error de red: axios no recibe respuesta (servidor caído, timeout, CORS). */
function errorDeRed(): Error {
  return Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK', request: {} });
}

const PEDIDOS: PedidosCliente = {
  en_curso: [{ codigo: 'PRUEBA-0001', fecha: '2026-10-01', total: '1000.00', estado: 'en_preparacion' }],
  finalizados: [],
};

const DETALLE: DetallePedido = {
  codigo: 'PRUEBA-0001',
  codigo_solicitud: null,
  fecha: '2026-10-01',
  estado: 'orden_confirmada',
  origen: 'carrito',
  modo_entrega: 'domicilio',
  direccion: 'Dirección de prueba 123',
  sub_total: '1000.00',
  descuento: '0.00',
  costo_entrega: '0.00',
  total: '1000.00',
  base_sin_impuesto: null,
  importe_iva: null,
  tasa_iva: null,
  observaciones: null,
  historial: [{ estado: 'orden_confirmada', fecha: '2026-10-01T10:00:00.000Z' }],
  lineas: [
    {
      producto: 'Producto de prueba',
      variante: 'Galón',
      color_solicitado: null,
      precio_inicial: null,
      descuentos: [],
      precio_aplicado: '1000.00',
      cantidad: 1,
      es_entonado: false,
      retirado: false,
      id_producto: null,
    },
  ],
};

/** Rastros de los antiguos datos de ejemplo (`ordenes.mock.ts`, ya eliminado). */
const RASTROS_DEL_MOCK = ['ORD-2026-0001', 'ORD-2026-0002', 'ORD-2026-0000', 'Calle 45', 'Chapinero', 'Viniltex'];

function crearRouter() {
  const vacia = defineComponent({ template: '<div />' });
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: vacia },
      { path: '/pedidos/:codigo', name: 'DetallePedido', component: vacia },
    ],
  });
}

async function montar<T>(componente: T, props: Record<string, unknown> = {}) {
  const router = crearRouter();
  await router.push('/');
  const envoltorio = mount(componente as never, { props, global: { plugins: [router] } });
  await flushPromises();
  return envoltorio;
}

function sinRastrosDelMock(texto: string): boolean {
  return RASTROS_DEL_MOCK.every((rastro) => !texto.includes(rastro));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('clasificarErrorCarga', () => {
  it('distingue sesión, no encontrado y fallo del servidor o de red', () => {
    expect(clasificarErrorCarga(errorHttp(401))).toBe('sesion');
    expect(clasificarErrorCarga(errorHttp(403))).toBe('no_encontrado');
    expect(clasificarErrorCarga(errorHttp(404))).toBe('no_encontrado');
    expect(clasificarErrorCarga(errorHttp(500))).toBe('servidor');
    expect(clasificarErrorCarga(errorHttp(503))).toBe('servidor');
    expect(clasificarErrorCarga(errorDeRed())).toBe('servidor');
    expect(clasificarErrorCarga(new TypeError('inesperado'))).toBe('servidor');
    expect(clasificarErrorCarga(undefined)).toBe('servidor');
  });
});

describe('useMisPedidos ante errores', () => {
  it.each([
    ['un 500', errorHttp(500)],
    ['un error de red', errorDeRed()],
  ])('con %s deja la lista vacía, marca el error y no afirma «no tienes pedidos»', async (_caso, error) => {
    servicio.misPedidos.mockRejectedValueOnce(error);
    const estado = useMisPedidos();
    await estado.cargar();

    expect(estado.pedidos.value.en_curso).toHaveLength(0);
    expect(estado.pedidos.value.finalizados).toHaveLength(0);
    expect(estado.tipoError.value).toBe('servidor');
    expect(estado.error.value).toBeTruthy();
    expect(estado.sinPedidos.value).toBe(false);
    expect(estado.sinResultados.value).toBe(false);
  });

  it('con un 401 pide iniciar sesión y tampoco muestra datos', async () => {
    servicio.misPedidos.mockRejectedValueOnce(errorHttp(401));
    const estado = useMisPedidos();
    await estado.cargar();

    expect(estado.tipoError.value).toBe('sesion');
    expect(estado.error.value).toContain('Inicia sesión');
    expect(estado.total.value).toBe(0);
  });

  it('al reintentar con éxito limpia el error y muestra los pedidos reales', async () => {
    servicio.misPedidos.mockRejectedValueOnce(errorHttp(500)).mockResolvedValueOnce(PEDIDOS);
    const estado = useMisPedidos();
    await estado.cargar();
    await estado.cargar();

    expect(estado.tipoError.value).toBeNull();
    expect(estado.error.value).toBeNull();
    expect(estado.enCurso.value.map((p) => p.codigo)).toEqual(['PRUEBA-0001']);
  });
});

describe('SeccionMisPedidos (lista del cliente)', () => {
  it.each([
    ['un 500', errorHttp(500)],
    ['un error de red', errorDeRed()],
  ])('con %s muestra el error con «Reintentar» y ningún pedido', async (_caso, error) => {
    servicio.misPedidos.mockRejectedValueOnce(error);
    const vista = await montar(SeccionMisPedidos);
    const texto = vista.text();

    expect(texto).toContain('No pudimos cargar tus pedidos');
    expect(vista.find('button').exists()).toBe(true);
    expect(vista.findAll('button').some((b) => b.text() === 'Reintentar')).toBe(true);
    expect(texto).not.toContain('Todavía no tienes pedidos');
    expect(texto).not.toContain('datos de ejemplo');
    expect(sinRastrosDelMock(texto)).toBe(true);
  });

  it('«Reintentar» vuelve a consultar y muestra los pedidos reales', async () => {
    servicio.misPedidos.mockRejectedValueOnce(errorHttp(500)).mockResolvedValueOnce(PEDIDOS);
    const vista = await montar(SeccionMisPedidos);

    const boton = vista.findAll('button').find((b) => b.text() === 'Reintentar');
    expect(boton).toBeDefined();
    await boton!.trigger('click');
    await flushPromises();

    expect(servicio.misPedidos).toHaveBeenCalledTimes(2);
    expect(vista.text()).toContain('PRUEBA-0001');
    expect(vista.text()).not.toContain('No pudimos cargar tus pedidos');
  });
});

describe('PanelSeguimiento (detalle del cliente)', () => {
  it.each([
    ['un 500', errorHttp(500)],
    ['un error de red', errorDeRed()],
  ])('con %s muestra el error con «Reintentar» y ningún dato de pedido', async (_caso, error) => {
    servicio.detalle.mockRejectedValueOnce(error);
    const vista = await montar(PanelSeguimiento, { codigo: 'PRUEBA-0001' });
    const texto = vista.text();

    expect(texto).toContain('No pudimos cargar tu pedido');
    expect(vista.findAll('button').some((b) => b.text() === 'Reintentar')).toBe(true);
    expect(texto).not.toContain('Pedido no encontrado');
    expect(sinRastrosDelMock(texto)).toBe(true);
  });

  it('con un 404 sigue mostrando «Pedido no encontrado» (CA-SEG-03-06)', async () => {
    servicio.detalle.mockRejectedValueOnce(errorHttp(404));
    const vista = await montar(PanelSeguimiento, { codigo: 'AJENO-0001' });

    expect(vista.text()).toContain('Pedido no encontrado');
    expect(vista.text()).not.toContain('Reintentar');
  });

  it('«Reintentar» vuelve a consultar y muestra el pedido real', async () => {
    servicio.detalle.mockRejectedValueOnce(errorDeRed()).mockResolvedValueOnce(DETALLE);
    const vista = await montar(PanelSeguimiento, { codigo: 'PRUEBA-0001' });

    await vista.findAll('button').find((b) => b.text() === 'Reintentar')!.trigger('click');
    await flushPromises();

    expect(servicio.detalle).toHaveBeenCalledTimes(2);
    expect(vista.text()).toContain('PRUEBA-0001');
    expect(vista.text()).not.toContain('No pudimos cargar tu pedido');
  });
});
