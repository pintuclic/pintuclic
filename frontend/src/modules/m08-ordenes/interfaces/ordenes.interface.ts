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

/**
 * Estados admitidos por `enum_estado_orden` en la base de datos.
 *
 * Alineados con la máquina de estados oficial del diagrama desde que el backend
 * la implementó (v0.3.x): ya no son los seis provisionales anteriores.
 */
export type EstadoOrden =
  | 'orden_confirmada'
  | 'revision_disponibilidad'
  | 'en_preparacion'
  | 'preparada'
  | 'despachado'
  | 'entregado'
  | 'cancelado'
  | 'devuelto';

/** Origen de la orden (RF-ORD-01-03). */
export type OrigenOrden = 'carrito' | 'cotizacion';

/** `enum_modo_entrega` en la base de datos. */
export type ModoEntrega = 'domicilio' | 'recogida';

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

/** Un descuento aplicado a una línea, con el orden en que entró (RF-ORD-02-02). */
export interface DescuentoAplicado {
  readonly orden: number;
  readonly origen: string;
  /** Nulo cuando el descuento fue un importe fijo en vez de un porcentaje. */
  readonly porcentaje: string | null;
  readonly importe: string;
}

/**
 * Línea del pedido: copia congelada de la compra, sin depender del catálogo vivo
 * (CA-ORD-02-01, CA-ORD-02-04).
 *
 * `precio_inicial` y `descuentos` reconstruyen cómo se llegó al precio aplicado
 * (RF-ORD-02-02). `retirado` indica que el producto ya no está en el catálogo
 * (RF-ORD-04-03); en ese caso `id_producto` llega nulo, para no enlazar a una ficha
 * que ya no existe.
 */
export interface LineaPedido {
  readonly producto: string;
  readonly variante: string;
  readonly color_solicitado: string | null;
  readonly precio_inicial: string | null;
  readonly descuentos: ReadonlyArray<DescuentoAplicado>;
  readonly precio_aplicado: string;
  readonly cantidad: number;
  readonly es_entonado: boolean;
  readonly retirado: boolean;
  readonly id_producto: number | null;
}

/**
 * Momento en que el pedido entró en un estado (RF-ORD-04-01).
 *
 * `fecha` es un ISO CON HORA (el backend la serializa con `toISOString()`), al
 * contrario que `DetallePedido.fecha`, que es solo AAAA-MM-DD. Por eso la línea de
 * tiempo usa `formatearFechaHora` y la cabecera `formatearFecha`.
 *
 * Al cliente solo se le entrega el estado y el momento: ni el autor ni el motivo,
 * que son datos del personal (RF-ORD-09-01).
 */
export interface HitoEstado {
  readonly estado: EstadoOrden;
  readonly fecha: string; // ISO 8601 con hora
}

/** Detalle de un pedido propio (HU-ORD-04). */
export interface DetallePedido {
  readonly codigo: string;
  readonly codigo_solicitud: string | null;
  readonly fecha: string; // AAAA-MM-DD
  readonly estado: EstadoOrden;
  readonly origen: OrigenOrden;
  readonly modo_entrega: ModoEntrega | null;
  /** Nula cuando el pedido se recoge en tienda. */
  readonly direccion: string | null;
  readonly sub_total: string;
  readonly descuento: string;
  readonly costo_entrega: string;
  readonly total: string;
  /** Desglose fiscal. Nulo en pedidos anteriores a su implantación. */
  readonly base_sin_impuesto: string | null;
  readonly importe_iva: string | null;
  readonly tasa_iva: string | null;
  readonly observaciones: string | null;
  readonly lineas: ReadonlyArray<LineaPedido>;
  readonly historial: ReadonlyArray<HitoEstado>;
}

/** Sobre estándar de la API de Pintuclic. */
export interface ApiResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly message?: string;
}

// ==============================================================================
// VISTAS DEL PERSONAL (HU-ORD-01, HU-ORD-03, HU-ORD-05)
// Exigen permiso `ventas.ver`; cambiar el estado exige además `ventas.gestionar`.
// ==============================================================================

/** Contacto del titular, que el listado del cliente nunca incluye. */
export interface ContactoCliente {
  readonly nombre: string;
  readonly correo: string;
  readonly telefono: string | null;
}

/** Línea del detalle del personal: añade la base que consume el entonado (RF-ORD-09-01). */
export interface LineaPedidoPersonal extends LineaPedido {
  readonly base_consumida: string | null;
}

/** Cambio de estado en el detalle del personal (CA-ORD-09-02). `autor` nulo = sistema. */
export interface CambioEstado {
  readonly estado_anterior: EstadoOrden | null;
  readonly estado_nuevo: EstadoOrden;
  readonly autor: string | null;
  readonly motivo: string | null;
  readonly fecha: string;
}

/** Nota interna del personal (HU-ORD-10). Nunca se muestra al cliente. */
export interface NotaInterna {
  readonly texto: string;
  readonly autor: string;
  readonly fecha: string;
}

/** Contacto con el cliente registrado desde la orden (CA-ORD-09-03). */
export interface ContactoRegistrado {
  readonly medio: string;
  readonly detalle: string | null;
  readonly autor: string;
  readonly fecha: string;
}

/**
 * Fila del listado del personal.
 *
 * `dias_esperando` cuenta desde el último cambio de estado, o desde la fecha del
 * pedido si todavía no tiene historial (CA-ORD-05-07): es el dato que permite ver
 * de un vistazo qué órdenes llevan demasiado tiempo paradas.
 */
export interface ResumenOrdenGestion extends ResumenPedido {
  readonly id_cliente: number;
  readonly cliente: string | null;
  readonly modo_entrega: ModoEntrega | null;
  readonly dias_esperando: number;
}

/** Página del listado del personal, con los metadatos de paginación de M02. */
export interface PaginaOrdenesGestion {
  readonly items: ReadonlyArray<ResumenOrdenGestion>;
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
  readonly total_paginas: number;
}

/** Contadores de la bandeja por estado, incluidos los que están en cero (CA-ORD-05-05). */
export interface ResumenEstadosOrdenes {
  readonly por_estado: Readonly<Record<EstadoOrden, number>>;
  readonly total: number;
}

/** Filtros que admite GET /api/ordenes/gestion. Todos son opcionales. */
export interface FiltrosGestion {
  codigo?: string;
  estado?: EstadoOrden | '';
  desde?: string; // AAAA-MM-DD
  hasta?: string; // AAAA-MM-DD
  cliente?: number;
  /** CA-ORD-08-02: el dato que da el cliente cuando no recuerda su número de pedido. */
  correo?: string;
  telefono?: string;
  orden?: 'recientes' | 'antiguedad';
  pagina?: number;
  limite?: number;
}

/** Detalle completo para el personal autorizado (HU-ORD-05, HU-ORD-09, HU-ORD-10). */
export interface DetalleOrdenGestion extends Omit<DetallePedido, 'historial' | 'lineas'> {
  readonly lineas: ReadonlyArray<LineaPedidoPersonal>;
  readonly id_cliente: number;
  readonly cliente: ContactoCliente | null;
  /**
   * Estados a los que el backend permite avanzar DESDE el actual. La vista no
   * decide nada: pinta exactamente lo que llega aquí (CA-ORD-05-01).
   */
  readonly transiciones_permitidas: ReadonlyArray<EstadoOrden>;
  readonly historial: ReadonlyArray<CambioEstado>;
  readonly notas: ReadonlyArray<NotaInterna>;
  readonly contactos: ReadonlyArray<ContactoRegistrado>;
}

/** Respuesta de PATCH /api/ordenes/gestion/:codigo/estado. */
export interface ResultadoCambioEstado {
  readonly codigo: string;
  readonly estado_anterior: EstadoOrden;
  readonly estado: EstadoOrden;
  readonly fecha: string;
  readonly transiciones_permitidas: ReadonlyArray<EstadoOrden>;
}

/** Medios por los que el personal puede dejar constancia de un contacto (CA-ORD-09-03). */
export type MedioContacto = 'correo' | 'telefono';
