import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defineComponent } from 'vue';
import VistaGestionOrdenes from '../views/admin/VistaGestionOrdenes.vue';
import VistaDetalleOrdenAdmin from '../views/admin/VistaDetalleOrdenAdmin.vue';
import { OrdenesService } from '../services/ordenes.service';
import type {
  DetalleOrdenGestion,
  PaginaOrdenesGestion,
  ResumenEstadosOrdenes,
} from '../interfaces/ordenes.interface';

/**
 * M08 · Vistas del personal ante errores de carga.
 *
 * Las vistas del personal no usaban datos de ejemplo, pero el detalle mostraba un 500
 * o una caída de red como «Orden no encontrada», y el personal podía creer que la
 * orden había desaparecido. Ahora el fallo del servidor se muestra como error con
 * «Reintentar», y 401 / 403 / 404 conservan su tratamiento.
 */

vi.mock('../services/ordenes.service', () => ({
  OrdenesService: {
    listarGestion: vi.fn(),
    resumenEstados: vi.fn(),
    detalleGestion: vi.fn(),
    historialCliente: vi.fn(),
  },
}));

const servicio = vi.mocked(OrdenesService);

function errorHttp(status: number): Error {
  return Object.assign(new Error(`Request failed with status code ${status}`), { response: { status } });
}

function errorDeRed(): Error {
  return Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK', request: {} });
}

const RESUMEN: ResumenEstadosOrdenes = {
  por_estado: {
    orden_confirmada: 1,
    revision_disponibilidad: 0,
    en_preparacion: 0,
    preparada: 0,
    despachado: 0,
    entregado: 0,
    cancelado: 0,
    devuelto: 0,
  },
  total: 1,
};

const PAGINA: PaginaOrdenesGestion = {
  items: [
    {
      codigo: 'PRUEBA-0001',
      fecha: '2026-10-01',
      total: '1000.00',
      estado: 'orden_confirmada',
      id_cliente: 2,
      cliente: 'Cliente de prueba',
      modo_entrega: 'domicilio',
      dias_esperando: 1,
    },
  ],
  total: 1,
  pagina: 1,
  limite: 10,
  total_paginas: 1,
};

const DETALLE: DetalleOrdenGestion = {
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
  lineas: [],
  id_cliente: 2,
  cliente: { nombre: 'Cliente de prueba', correo: 'cliente@prueba.co', telefono: null },
  transiciones_permitidas: ['revision_disponibilidad'],
  historial: [],
  notas: [],
  contactos: [],
};

function crearRouter() {
  const vacia = defineComponent({ template: '<div />' });
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: vacia },
      { path: '/admin/ordenes', name: 'AdminGestionOrdenes', component: vacia },
      { path: '/admin/ordenes/:codigo', name: 'AdminDetalleOrden', component: vacia },
    ],
  });
}

async function montar<T>(componente: T, props: Record<string, unknown> = {}) {
  const router = crearRouter();
  await router.push('/');
  // El modal de cambio de estado usa <dialog>.close(), que jsdom no implementa; no es
  // parte de lo que se prueba aquí.
  const envoltorio = mount(componente as never, {
    props,
    global: { plugins: [router], stubs: { ModalCambiarEstado: true } },
  });
  await flushPromises();
  return envoltorio;
}

function botonReintentar(vista: Awaited<ReturnType<typeof montar>>) {
  return vista.findAll('button').find((b) => b.text() === 'Reintentar');
}

beforeEach(() => {
  vi.clearAllMocks();
  servicio.resumenEstados.mockResolvedValue(RESUMEN);
});

describe('VistaDetalleOrdenAdmin', () => {
  it.each([
    ['un 500', errorHttp(500)],
    ['un error de red', errorDeRed()],
  ])('con %s muestra el error con «Reintentar», no «Orden no encontrada»', async (_caso, error) => {
    servicio.detalleGestion.mockRejectedValueOnce(error);
    const vista = await montar(VistaDetalleOrdenAdmin, { codigo: 'PRUEBA-0001' });
    const texto = vista.text();

    expect(texto).toContain('No pudimos cargar la orden');
    expect(botonReintentar(vista)).toBeDefined();
    expect(texto).not.toContain('Orden no encontrada');
    expect(texto).not.toContain('Cliente de prueba');
  });

  it.each([
    [403, 'Orden no encontrada'],
    [404, 'Orden no encontrada'],
    [401, 'Tu sesión expiró'],
  ])('con un %i conserva su estado propio y no ofrece reintentar', async (status, esperado) => {
    servicio.detalleGestion.mockRejectedValueOnce(errorHttp(status));
    const vista = await montar(VistaDetalleOrdenAdmin, { codigo: 'PRUEBA-0001' });

    expect(vista.text()).toContain(esperado);
    expect(botonReintentar(vista)).toBeUndefined();
  });

  it('«Reintentar» vuelve a consultar y muestra la orden', async () => {
    servicio.detalleGestion.mockRejectedValueOnce(errorHttp(503)).mockResolvedValueOnce(DETALLE);
    const vista = await montar(VistaDetalleOrdenAdmin, { codigo: 'PRUEBA-0001' });

    await botonReintentar(vista)!.trigger('click');
    await flushPromises();

    expect(servicio.detalleGestion).toHaveBeenCalledTimes(2);
    expect(vista.text()).toContain('Orden PRUEBA-0001');
    expect(vista.text()).not.toContain('No pudimos cargar la orden');
  });
});

describe('VistaGestionOrdenes (bandeja)', () => {
  it.each([
    ['un 500', errorHttp(500)],
    ['un error de red', errorDeRed()],
  ])('con %s muestra el error con «Reintentar» y ninguna orden', async (_caso, error) => {
    servicio.listarGestion.mockRejectedValueOnce(error);
    const vista = await montar(VistaGestionOrdenes);

    expect(botonReintentar(vista)).toBeDefined();
    expect(vista.text()).not.toContain('PRUEBA-0001');
  });

  it.each([401, 403])('con un %i explica el motivo sin ofrecer reintentar', async (status) => {
    servicio.listarGestion.mockRejectedValueOnce(errorHttp(status));
    const vista = await montar(VistaGestionOrdenes);

    expect(vista.text()).toMatch(status === 401 ? /sesión expiró/ : /ventas\.ver/);
    expect(botonReintentar(vista)).toBeUndefined();
  });

  it('«Reintentar» vuelve a consultar y muestra las órdenes', async () => {
    servicio.listarGestion.mockRejectedValueOnce(errorDeRed()).mockResolvedValueOnce(PAGINA);
    const vista = await montar(VistaGestionOrdenes);

    await botonReintentar(vista)!.trigger('click');
    await flushPromises();

    expect(servicio.listarGestion).toHaveBeenCalledTimes(2);
    expect(vista.text()).toContain('PRUEBA-0001');
    expect(botonReintentar(vista)).toBeUndefined();
  });
});
