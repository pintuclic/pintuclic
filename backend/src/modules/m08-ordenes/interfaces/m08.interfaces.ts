import type { EnumEstadoOrden, EnumOrigenOrden, LineaOrden, Orden } from '../../../core/db/types';
import type { RegistroSeguridadService } from '../../m20-seguridad/services/registro-seguridad.service';

// ==============================================================================
// M08 - ORDEN DE VENTA
// Contratos e interfaces públicas del módulo (solo tipos de compilación, 0 runtime).
// ==============================================================================

/** Agrupación de la sección de pedidos del cliente (HU-ORD-07, CA-ORD-07-01). */
export type GrupoPedido = 'en_curso' | 'finalizados';

/**
 * Cabecera de la orden tal como la lee el repositorio. Excluye a propósito el
 * identificador de la transacción de pago y la cotización de origen (HU-SEG-06).
 */
export type CabeceraOrden = Pick<
  Orden,
  | 'id_orden'
  | 'codigo_visible'
  | 'id_usuario'
  | 'origen'
  | 'estado'
  | 'direccion'
  | 'sub_total'
  | 'descuento'
  | 'total'
  | 'observaciones'
  | 'fecha'
>;

/** Línea de orden conservada tal como se cobró (HU-ORD-02, ADR-05). */
export type FilaLineaOrden = Pick<LineaOrden, 'nombre_producto' | 'variante_copia' | 'precio_aplicado' | 'cantidad'>;

/** Fila mínima para el listado de pedidos de un cliente (CA-ORD-07-01). */
export type FilaResumenOrden = Pick<Orden, 'codigo_visible' | 'fecha' | 'total' | 'estado'>;

/** Pedido tal como se muestra en la sección del cliente: identificador, fecha, total y estado. */
export interface ResumenPedido {
  readonly codigo: string;
  readonly fecha: string;
  readonly total: string;
  readonly estado: EnumEstadoOrden;
}

/** Sección de pedidos del cliente separada entre en curso y finalizados (CA-ORD-07-01). */
export type PedidosCliente = Readonly<Record<GrupoPedido, ReadonlyArray<ResumenPedido>>>;

/** Línea del detalle: datos copiados en la compra, sin enlace al catálogo vivo (CA-ORD-02-01). */
export interface LineaPedido {
  readonly producto: string;
  readonly variante: string;
  readonly precio_aplicado: string;
  readonly cantidad: number;
}

/** Detalle de un pedido para su cliente titular (HU-ORD-04, CA-ORD-04-01). */
export interface DetallePedido {
  readonly codigo: string;
  readonly fecha: string;
  readonly estado: EnumEstadoOrden;
  readonly origen: EnumOrigenOrden;
  readonly direccion: string;
  readonly sub_total: string;
  readonly descuento: string;
  readonly total: string;
  readonly observaciones: string | null;
  readonly lineas: ReadonlyArray<LineaPedido>;
}

/** Detalle para personal autorizado (HU-ORD-05): añade el cliente titular como contexto. */
export interface DetallePedidoPersonal extends DetallePedido {
  readonly id_cliente: number;
}

/** Capacidad de M20 que usa este módulo para dejar constancia de accesos denegados (CA-SEG-03-05). */
export type RegistroAccesosDenegados = Pick<RegistroSeguridadService, 'registrarAccesoDenegado'>;
