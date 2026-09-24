/**
 * ==============================================================================
 * M08 - ORDEN DE VENTA · CONTRATOS DE DATOS
 * Ubicación: src/modules/m08-ordenes/interfaces/ordenes.interface.ts
 *
 * Reflejan exactamente lo que devuelve el backend (rama feature/m08-orden-venta):
 *   GET /api/ordenes/mis-pedidos
 *   GET /api/ordenes/mis-pedidos/:codigo
 *   GET /api/ordenes/gestion/:codigo
 *
 * ⚠️ Los importes llegan como TEXTO ("171800.00"), no como número: son NUMERIC
 * de PostgreSQL y `pg` los entrega en string para no perder precisión. No sumar
 * en el frontend; usar sub_total, descuento y total tal como llegan.
 * ==============================================================================
 */

/** Estados admitidos por `enum_estado_orden` en la base de datos. */
export type EstadoOrden =
  | 'pendiente'
  | 'pagado'
  | 'en_preparacion'
  | 'enviado'
  | 'entregado'
  | 'cancelado';

/** Origen de la orden (RF-ORD-01-03). */
export type OrigenOrden = 'carrito' | 'cotizacion';

/** Agrupación que devuelve el backend ya resuelta (CA-ORD-07-01). */
export type GrupoPedido = 'en_curso' | 'finalizados';

/** Fila del listado. El endpoint devuelve SOLO estos cuatro campos. */
export interface ResumenPedido {
  readonly codigo: string;
  readonly fecha: string; // AAAA-MM-DD
  readonly total: string; // "425000.00"
  readonly estado: EstadoOrden;
}

/** Respuesta de GET /api/ordenes/mis-pedidos: los dos grupos ya separados. */
export interface PedidosCliente {
  readonly en_curso: ReadonlyArray<ResumenPedido>;
  readonly finalizados: ReadonlyArray<ResumenPedido>;
}

/** Línea del pedido: copia congelada de la compra, sin enlace al catálogo vivo. */
export interface LineaPedido {
  readonly producto: string;
  readonly variante: string;
  readonly precio_aplicado: string;
  readonly cantidad: number;
}

/** Detalle de un pedido propio (HU-ORD-04). */
export interface DetallePedido {
  readonly codigo: string;
  readonly fecha: string;
  readonly estado: EstadoOrden;
  readonly origen: OrigenOrden;
  readonly direccion: string;
  readonly sub_total: string;
  readonly descuento: string;
  readonly total: string;
  readonly observaciones: string | null;
  readonly lineas: ReadonlyArray<LineaPedido>;
}

/** Detalle para personal autorizado: añade el titular (HU-ORD-05). */
export interface DetallePedidoPersonal extends DetallePedido {
  readonly id_cliente: number;
}

/** Sobre estándar de la API de Pintuclic. */
export interface ApiResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly message?: string;
}
