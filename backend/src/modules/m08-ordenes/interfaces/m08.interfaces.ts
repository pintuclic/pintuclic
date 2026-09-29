import type { EnumEstadoOrden, EnumOrigenOrden, LineaOrden, Orden, Usuario } from '../../../core/db/types';
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

/**
 * Fila del listado del personal: la del cliente más el titular y el momento del último
 * cambio de estado (`null` si la orden aún no tiene historial).
 */
export type FilaResumenOrdenGestion = FilaResumenOrden &
  Pick<Orden, 'id_usuario'> & { readonly ultimo_cambio: Date | null };

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
 * Medios con los que el personal registra un contacto con el cliente (CA-ORD-09-03).
 * ⚠️ PROVISIONAL: la lista cerrada está pendiente del análisis.
 */
export type MedioContacto = 'telefono' | 'correo' | 'whatsapp' | 'otro';

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
export interface DetallePedidoPersonal extends DetallePedido {
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
 * Orden en el listado del personal. `dias_esperando` cuenta los días desde el último
 * cambio de estado o, si la orden aún no tiene historial, desde su fecha (CA-ORD-05-07).
 */
export interface ResumenOrdenGestion extends ResumenPedido {
  readonly id_cliente: number;
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
