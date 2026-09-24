import type { DetallePedido, PedidosCliente } from '../interfaces/ordenes.interface';

/**
 * ==============================================================================
 * M08 - DATOS SIMULADOS DE RESPALDO
 * Ubicación: src/modules/m08-ordenes/services/ordenes.mock.ts
 *
 * Mismo patrón que los `.mock.ts` de M01: permiten maquetar sin backend y sirven
 * de red de seguridad cuando la API no responde.
 *
 * Los valores replican con exactitud el seed oficial (bd/sql/seed_pintuclic.sql):
 * importes como texto y fechas en formato AAAA-MM-DD.
 * ==============================================================================
 */

export const PEDIDOS_MOCK: PedidosCliente = {
  en_curso: [
    { codigo: 'ORD-2026-0002', fecha: '2026-09-23', total: '425000.00', estado: 'en_preparacion' },
    { codigo: 'ORD-2026-0001', fecha: '2026-09-23', total: '171800.00', estado: 'pagado' },
  ],
  finalizados: [
    { codigo: 'ORD-2026-0000', fecha: '2026-09-02', total: '96400.00', estado: 'entregado' },
  ],
};

export const DETALLE_MOCK: DetallePedido = {
  codigo: 'ORD-2026-0001',
  fecha: '2026-09-23',
  estado: 'pagado',
  origen: 'carrito',
  direccion: 'Calle 45 # 12-34, Apt 301, Chapinero, Bogotá D.C.',
  sub_total: '171800.00',
  descuento: '0.00',
  total: '171800.00',
  observaciones: 'Dejar en portería debidamente sellado',
  lineas: [
    {
      producto: 'Viniltex Máxima Protección Antibacterial',
      variante: 'Galón - Blanco Puro',
      precio_aplicado: '85900.00',
      cantidad: 2,
    },
  ],
};
