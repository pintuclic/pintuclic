import type {
  EnumEstadoGeneral,
  EnumEstadoOrden,
  EnumEstadoProducto,
  EnumModoEntrega,
  EnumOrigenOrden,
  LineaOrden,
  LineaOrdenDescuento,
  NewLineaOrden,
  NewLineaOrdenDescuento,
  NewOrden,
  Orden,
  Usuario,
} from '../../../core/db/types';
import type { RegistroSeguridadService } from '../../m20-seguridad/services/registro-seguridad.service';
import type { NotificacionesService } from '../../m18-notificaciones/services/notificaciones.service';

// ==============================================================================
// M08 - ORDEN DE VENTA
// Contratos e interfaces públicas del módulo (solo tipos de compilación, 0 runtime).
// ==============================================================================

/** Agrupación de la sección de pedidos del cliente (HU-ORD-07, CA-ORD-07-01). */
export type GrupoPedido = 'en_curso' | 'finalizados';

/**
 * Orden del listado del personal: `recientes` (más nuevas primero, por defecto) o
 * `antiguedad` (más antiguas primero, para atender primero lo que lleva más tiempo;
 * HU-ORD-05, CA-ORD-05-07).
 */
export type OrdenListado = 'recientes' | 'antiguedad';

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
  | 'codigo_solicitud'
  | 'modo_entrega'
  | 'costo_entrega'
  | 'direccion'
  | 'sub_total'
  | 'descuento'
  | 'total'
  | 'base_sin_impuesto'
  | 'importe_iva'
  | 'tasa_iva'
  | 'observaciones'
  | 'fecha'
>;

/**
 * Línea de orden conservada tal como se cobró (HU-ORD-02, ADR-05), con el estado actual
 * de la variante y del producto a los que remite `id_variante_ref`. Esos tres datos solo
 * sirven para saber si el producto sigue en el catálogo (RF-ORD-04-03); son `null` si la
 * línea no tiene referencia o la variante ya no existe.
 */
export type FilaLineaOrden = Pick<
  LineaOrden,
  | 'id_linea_orden'
  | 'nombre_producto'
  | 'variante_copia'
  | 'precio_aplicado'
  | 'cantidad'
  | 'color_solicitado'
  | 'precio_inicial'
  | 'id_variante_ref'
  | 'es_entonado'
  | 'base_consumida'
> & {
  readonly variante_estado: EnumEstadoProducto | null;
  readonly producto_id: number | null;
  readonly producto_estado: EnumEstadoGeneral | null;
  readonly producto_publicado: boolean | null;
};

/** Descuento aplicado a una línea tal como se lee de `linea_orden_descuento` (RF-ORD-02-02). */
export type FilaDescuentoLinea = Pick<
  LineaOrdenDescuento,
  'id_linea_orden' | 'orden_aplicacion' | 'origen' | 'porcentaje' | 'importe'
>;

/** Fila mínima para el listado de pedidos de un cliente (CA-ORD-07-01). */
export type FilaResumenOrden = Pick<Orden, 'codigo_visible' | 'fecha' | 'total' | 'estado'>;

/**
 * Fila del listado del personal: la del cliente más el titular, su nombre (`null` si la
 * cuenta ya no existe) y el momento del último cambio de estado (`null` sin historial).
 */
export type FilaResumenOrdenGestion = FilaResumenOrden &
  Pick<Orden, 'id_usuario' | 'modo_entrega'> & { readonly nombre_cliente: string | null; readonly ultimo_cambio: Date | null };

/** Cambio de estado tal como se lee de `historial_estado_orden`; `autor` null = sistema (D01). */
export interface FilaHistorialEstado {
  readonly estado_anterior: EnumEstadoOrden | null;
  readonly estado_nuevo: EnumEstadoOrden;
  readonly autor: string | null;
  readonly motivo: string | null;
  readonly fecha: Date;
}

/** Nota interna tal como se lee de `nota_orden`, con el nombre de quien la escribió. */
export interface FilaNotaOrden {
  readonly texto: string;
  readonly autor: string;
  readonly fecha: Date;
}

/** Contacto con el cliente tal como se lee de `contacto_orden`. */
export interface FilaContactoOrden {
  readonly medio: string;
  readonly detalle: string | null;
  readonly autor: string;
  readonly fecha: Date;
}

/** Datos para registrar un cambio de estado de forma atómica (HU-ORD-03). */
export interface SolicitudCambioEstado {
  readonly idOrden: number;
  readonly estadoActual: EnumEstadoOrden;
  readonly estadoNuevo: EnumEstadoOrden;
  readonly idAutor: number;
  readonly motivo: string | null;
}

/**
 * Medios con los que el personal contacta al cliente desde la orden: los que la orden
 * conserva, correo y teléfono (RF-ORD-09-02, Tanda 3C; CA-ORD-09-03).
 */
export type MedioContacto = 'correo' | 'telefono';

/** Datos de contacto del cliente que ve el personal en el detalle (CA-ORD-09-01). */
export type ContactoCliente = Pick<Usuario, 'nombre' | 'correo' | 'telefono'>;

/** Conteo de órdenes por estado tal como lo devuelve la base de datos. */
export interface FilaConteoEstado {
  readonly estado: EnumEstadoOrden;
  readonly total: number;
}

/**
 * Filtros del listado del personal (HU-ORD-05, HU-ORD-08, HU-ORD-11). Cada uno es
 * opcional; si llegan varios se aplican a la vez (AND).
 * - `desde` / `hasta`: fechas AAAA-MM-DD sobre `orden.fecha`, ambos extremos incluidos.
 * - `correoCliente` / `telefonoCliente`: coincidencia exacta con el titular (CA-ORD-08-02).
 * - `excluirIdOrden`: uso interno del historial del cliente (CA-ORD-11-01); no se expone.
 */
export interface FiltrosGestionOrdenes {
  readonly codigo?: string;
  readonly estado?: EnumEstadoOrden;
  readonly desde?: string;
  readonly hasta?: string;
  readonly idCliente?: number;
  readonly correoCliente?: string;
  readonly telefonoCliente?: string;
  readonly excluirIdOrden?: number;
}

/** Pedido tal como se muestra en la sección del cliente: identificador, fecha, total y estado. */
export interface ResumenPedido {
  readonly codigo: string;
  readonly fecha: string;
  readonly total: string;
  readonly estado: EnumEstadoOrden;
}

/** Sección de pedidos del cliente separada entre en curso y finalizados (CA-ORD-07-01). */
export type PedidosCliente = Readonly<Record<GrupoPedido, ReadonlyArray<ResumenPedido>>>;

/** Descuento aplicado a una línea, en el orden en que se aplicó (RF-ORD-02-02, CA-ORD-02-02). */
export interface DescuentoAplicado {
  readonly orden: number;
  readonly origen: string;
  /** `null` cuando el descuento fue un importe fijo. */
  readonly porcentaje: string | null;
  readonly importe: string;
}

/**
 * Línea del detalle: datos copiados en la compra, sin depender del catálogo vivo
 * (CA-ORD-02-01, CA-ORD-02-04). `precio_inicial` y `descuentos` reconstruyen el precio
 * aplicado (RF-ORD-02-02). `retirado` indica que el producto ya no está en el catálogo
 * (RF-ORD-04-03); en ese caso `id_producto` es `null` para no enlazar a su ficha.
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

/** Línea en el detalle del personal: añade la base que consume cada línea entonada (RF-ORD-09-01). */
export interface LineaPedidoPersonal extends LineaPedido {
  readonly base_consumida: string | null;
}

/**
 * Datos del pedido comunes a la vista del cliente y a la del personal. Los importes de IVA,
 * el modo de entrega y la solicitud son `null` en órdenes anteriores a la copia histórica.
 * `direccion` es `null` en la recogida en almacén.
 */
export interface DetallePedidoBase {
  readonly codigo: string;
  readonly codigo_solicitud: string | null;
  readonly fecha: string;
  readonly estado: EnumEstadoOrden;
  readonly origen: EnumOrigenOrden;
  readonly modo_entrega: EnumModoEntrega | null;
  readonly direccion: string | null;
  readonly sub_total: string;
  readonly descuento: string;
  readonly costo_entrega: string;
  readonly total: string;
  readonly base_sin_impuesto: string | null;
  readonly importe_iva: string | null;
  readonly tasa_iva: string | null;
  readonly observaciones: string | null;
  readonly lineas: ReadonlyArray<LineaPedido>;
}

/**
 * Estado por el que pasó el pedido, tal como lo ve el cliente (RF-ORD-04-01): solo el
 * estado y el momento. Quién lo cambió y el motivo son datos del personal (RF-ORD-09-01).
 */
export interface HitoEstado {
  readonly estado: EnumEstadoOrden;
  readonly fecha: string;
}

/** Detalle de un pedido para su cliente titular, con su historia de estados (HU-ORD-04, RF-ORD-04-01). */
export interface DetallePedido extends DetallePedidoBase {
  readonly historial: ReadonlyArray<HitoEstado>;
}

/** Cambio de estado en el detalle del personal (CA-ORD-09-02). `autor` null = sistema. */
export interface CambioEstado {
  readonly estado_anterior: EnumEstadoOrden | null;
  readonly estado_nuevo: EnumEstadoOrden;
  readonly autor: string | null;
  readonly motivo: string | null;
  readonly fecha: string;
}

/** Nota interna del personal (HU-ORD-10). Nunca forma parte de la vista del cliente. */
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
 * Detalle para personal autorizado (HU-ORD-05, HU-ORD-09, HU-ORD-10): añade el titular y su
 * contacto (CA-ORD-09-01), el historial de estados (CA-ORD-09-02), las notas internas
 * (CA-ORD-10-02), los contactos registrados (CA-ORD-09-03) y los estados a los que se puede
 * pasar. `cliente` es null solo si la cuenta ya no existe.
 */
export interface DetallePedidoPersonal extends DetallePedidoBase {
  readonly lineas: ReadonlyArray<LineaPedidoPersonal>;
  readonly id_cliente: number;
  readonly cliente: ContactoCliente | null;
  readonly transiciones_permitidas: ReadonlyArray<EnumEstadoOrden>;
  readonly historial: ReadonlyArray<CambioEstado>;
  readonly notas: ReadonlyArray<NotaInterna>;
  readonly contactos: ReadonlyArray<ContactoRegistrado>;
}

/** Respuesta al cambiar el estado de una orden (HU-ORD-03, CA-ORD-05-01). */
export interface ResultadoCambioEstado {
  readonly codigo: string;
  readonly estado_anterior: EnumEstadoOrden;
  readonly estado: EnumEstadoOrden;
  readonly fecha: string;
  readonly transiciones_permitidas: ReadonlyArray<EnumEstadoOrden>;
}

/**
 * Orden en el listado del personal, con el cliente, el modo de entrega y cuánto lleva en su
 * estado (RF-ORD-05-05). `cliente` es el nombre del titular (`null` si la cuenta ya no existe).
 * `modo_entrega` es `null` en órdenes anteriores a la copia histórica. `dias_esperando` cuenta
 * los días desde el último cambio de estado o, si la orden aún no tiene historial, desde su
 * fecha (CA-ORD-05-07).
 */
export interface ResumenOrdenGestion extends ResumenPedido {
  readonly id_cliente: number;
  readonly cliente: string | null;
  readonly modo_entrega: EnumModoEntrega | null;
  readonly dias_esperando: number;
}

/** Página del listado del personal, con los metadatos de paginación de M02 (HU-BUS-05). */
export interface PaginaOrdenesGestion {
  readonly items: ReadonlyArray<ResumenOrdenGestion>;
  readonly total: number;
  readonly pagina: number;
  readonly limite: number;
  readonly total_paginas: number;
}

/** Contadores de la bandeja del personal por estado, incluidos los que están en cero (CA-ORD-05-05). */
export interface ResumenEstadosOrdenes {
  readonly por_estado: Readonly<Record<EnumEstadoOrden, number>>;
  readonly total: number;
}

/** Capacidad de M20 que usa este módulo para dejar constancia de accesos denegados (CA-SEG-03-05). */
export type RegistroAccesosDenegados = Pick<RegistroSeguridadService, 'registrarAccesoDenegado'>;

/** Capacidad de M18 que usa este módulo para avisar al cliente de un cambio de estado (HU-NOT-02, D05). */
export type NotificadorEstadoOrden = Pick<NotificacionesService, 'notificarCambioEstadoOrden'>;

// ==============================================================================
// HU-ORD-01: CREACIÓN DE LA ORDEN AL CONFIRMARSE EL PAGO (contrato para M07)
// M07 administra la solicitud SOL y el cobro; cuando el pago queda confirmado llama a
// `serviciosOrdenes.creacion.crearDesdePagoConfirmado()` con estos datos. Los importes
// llegan congelados desde la solicitud y se copian sin recalcular ni redondear (D07).
// ==============================================================================

/**
 * Importe congelado de la solicitud: texto con hasta 2 decimales («95900.00») o un número
 * que se escriba exacto con ellos (95900 o 95900.5). Nunca negativo.
 */
export type Importe = string | number;

/**
 * Confirmación del pago que autoriza crear la orden (RF-ORD-01-01). Las dos vías son
 * equivalentes (CA-ORD-01-03): la pasarela aporta su identificador de transacción y el
 * empleado que verificó un pago directo (D06) queda como autor del primer registro del
 * historial. `montoConfirmado` es lo que se recibió: si no cubre el total, no hay orden (D06).
 */
export type ConfirmacionPago =
  | {
      readonly medio: 'pasarela';
      readonly transaccionId: string;
      readonly montoConfirmado: Importe;
    }
  | {
      readonly medio: 'verificacion_manual';
      readonly idEmpleado: number;
      /** Referencia del pago recibido por otro medio (ej. número del comprobante), si la hay. */
      readonly referencia?: string | null;
      readonly montoConfirmado: Importe;
    };

/** Descuento aplicado a una línea; el orden del arreglo es su orden de aplicación (RF-ORD-02-02). */
export interface DescuentoSolicitud {
  readonly origen: string;
  /** `null` si fue un importe fijo, no un porcentaje. */
  readonly porcentaje?: Importe | null;
  readonly importe: Importe;
}

/** Línea de la solicitud tal como se cobró (RF-ORD-02-01). */
export interface LineaSolicitud {
  readonly nombreProducto: string;
  readonly varianteCopia: string;
  readonly cantidad: number;
  /** Precio unitario de partida, antes de descuentos. */
  readonly precioInicial: Importe;
  /** Precio unitario cobrado, después de descuentos. */
  readonly precioAplicado: Importe;
  readonly colorSolicitado?: string | null;
  /** Variante del catálogo, solo para saber después si sigue disponible (sin FK, ADR-05). */
  readonly idVarianteRef?: number | null;
  /** Una línea entonada exige el color solicitado y la base que consume (RF-ORD-09-01). */
  readonly esEntonado?: boolean;
  readonly baseConsumida?: string | null;
  readonly descuentos?: ReadonlyArray<DescuentoSolicitud>;
}

/** Solicitud de compra con el pago confirmado, lista para convertirse en orden (HU-ORD-01). */
export interface SolicitudPagoConfirmado {
  /** Código SOL-AAAA-NNNNN de M07 (D04). Identifica la operación: una solicitud genera una sola orden. */
  readonly codigoSolicitud: string;
  readonly idCliente: number;
  readonly origen: EnumOrigenOrden;
  /** Obligatorio si `origen` es `cotizacion` y prohibido si es `carrito` (CA-ORD-01-04). */
  readonly idCotizacion?: number | null;
  readonly modoEntrega: EnumModoEntrega;
  /** Obligatoria a domicilio. */
  readonly direccion?: string | null;
  readonly costoEntrega: Importe;
  readonly subTotal: Importe;
  readonly descuento: Importe;
  readonly total: Importe;
  readonly baseSinImpuesto: Importe;
  readonly importeIva: Importe;
  /** Porcentaje de IVA vigente al crear la solicitud (0 a 100). */
  readonly tasaIva: Importe;
  readonly observaciones?: string | null;
  readonly lineas: ReadonlyArray<LineaSolicitud>;
  readonly confirmacion: ConfirmacionPago;
}

/**
 * Respuesta a M07. `creada` es `false` si esa solicitud ya tenía orden: una confirmación
 * repetida devuelve la orden existente en lugar de crear otra (CA-ORD-01-05).
 */
export interface ResultadoCreacionOrden {
  readonly codigo: string;
  readonly codigoSolicitud: string;
  readonly estado: EnumEstadoOrden;
  readonly creada: boolean;
}

/** Orden ya registrada para una solicitud o una transacción de pago (CA-ORD-01-05). */
export type OrdenDeOperacion = Pick<
  Orden,
  'id_orden' | 'codigo_visible' | 'id_usuario' | 'estado' | 'codigo_solicitud' | 'transaccion_pago_id'
>;

/**
 * Orden validada y lista para insertar. El repositorio completa el código visible con el
 * consecutivo que obtiene dentro de la misma transacción (RF-ORD-06-04).
 */
export interface NuevaOrdenConfirmada {
  readonly orden: Omit<NewOrden, 'id_orden' | 'codigo_visible' | 'estado'> & { readonly fecha: string };
  readonly lineas: ReadonlyArray<{
    readonly linea: Omit<NewLineaOrden, 'id_linea_orden' | 'id_orden'>;
    readonly descuentos: ReadonlyArray<Omit<NewLineaOrdenDescuento, 'id_linea_orden_descuento' | 'id_linea_orden'>>;
  }>;
  /** Primer registro del historial: `null` → orden_confirmada (CA-ORD-03-04). */
  readonly historial: { readonly idAutor: number | null; readonly referenciaExterna: string | null };
}

/** Lo que devuelve el repositorio al crear la orden. */
export interface OrdenCreada {
  readonly idOrden: number;
  readonly codigo: string;
  /** Momento del primer registro del historial (para el correo al cliente). */
  readonly fecha: Date;
}
