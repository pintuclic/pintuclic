import { EnumEstadoOrden } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import {
  CabeceraOrden,
  CambioEstado,
  ContactoRegistrado,
  DescuentoAplicado,
  DetallePedido,
  DetallePedidoBase,
  DetallePedidoPersonal,
  FilaContactoOrden,
  FilaHistorialEstado,
  FilaLineaOrden,
  FilaNotaOrden,
  LineaPedido,
  LineaPedidoPersonal,
  FiltrosGestionOrdenes,
  GrupoPedido,
  NotaInterna,
  OrdenListado,
  PaginaOrdenesGestion,
  PedidosCliente,
  RegistroAccesosDenegados,
  ResumenEstadosOrdenes,
  ResumenPedido,
} from '../interfaces/m08.interfaces';
import { transicionesPermitidas } from './ciclo-estados';

// ==============================================================================
// M08 - SERVICIO DE CONSULTA DE ÓRDENES (HU-ORD-04, 05, 06, 07, 08, 09, 10 y 11)
// La sesión y los permisos los exigen las guardas de M20 en la ruta. Este servicio
// decide la titularidad: una orden ajena responde igual que una inexistente
// (CA-ORD-04-03, CA-SEG-03-06) y el intento queda registrado (CA-SEG-03-05).
// ==============================================================================

/**
 * Clasificación de Mis pedidos por estado (schema v3.8, HU-ORD-03). Al ser un `Record`
 * exhaustivo, TypeScript obliga a clasificar cualquier estado nuevo.
 *
 * `despachado` ya es finalizado: para domicilio es el cierre normal aunque no se registre
 * Entregado (D02, CA-ORD-03-06). `devuelto` es terminal; su etiqueta visible al cliente
 * sigue pendiente (P5).
 */
const GRUPO_POR_ESTADO: Record<EnumEstadoOrden, GrupoPedido> = {
  orden_confirmada: 'en_curso',
  revision_disponibilidad: 'en_curso',
  en_preparacion: 'en_curso',
  preparada: 'en_curso',
  despachado: 'finalizados',
  entregado: 'finalizados',
  cancelado: 'finalizados',
  devuelto: 'finalizados',
};

/** Todos los estados, en el orden del enum, para que los contadores incluyan los ceros. */
const ESTADOS = Object.keys(GRUPO_POR_ESTADO) as EnumEstadoOrden[];

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Fecha AAAA-MM-DD de hoy en Colombia, independiente de la zona del servidor. */
const formatoFechaColombia = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Mismo mensaje que las guardas de M20 para un recurso inalcanzable (RF-SEG-03-05). */
function recursoNoEncontrado(): AppError {
  return new AppError('Recurso no encontrado', 404, 'NOT_FOUND');
}

/**
 * `orden.fecha` es DATE: `pg` la entrega como medianoche local. Se formatea con la
 * fecha local para no correr el día al convertir a UTC.
 */
function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** Días naturales entre dos fechas AAAA-MM-DD; nunca negativo. */
function diasEntre(desde: string, hasta: string): number {
  const diferencia = Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`);
  return Math.max(0, Math.round(diferencia / MS_POR_DIA));
}

/**
 * Un producto está retirado del catálogo (RF-ORD-04-03, CA-ORD-04-04) si la línea remite a
 * una variante que ya no existe, o que está inactiva o descontinuada, o si su producto está
 * inactivo o sin publicar. «Agotado» no es retirado: sigue en el catálogo. Una línea sin
 * referencia no permite afirmarlo y se muestra sin enlace, pero sin la nota de retirado.
 */
export function lineaRetirada(fila: FilaLineaOrden): boolean {
  if (fila.id_variante_ref === null) {
    return false;
  }
  if (fila.variante_estado === null) {
    return true;
  }
  return (
    fila.variante_estado === 'inactivo' ||
    fila.variante_estado === 'descontinuado' ||
    fila.producto_estado === 'inactivo' ||
    fila.producto_publicado === false
  );
}

/** Detalle con las líneas completas del personal; la vista del cliente las recorta. */
type DetalleCompleto = DetallePedidoBase & { readonly lineas: ReadonlyArray<LineaPedidoPersonal> };

/** Línea tal como la ve el cliente: sin la base que consume, que es un dato de preparación. */
function aLineaCliente(linea: LineaPedidoPersonal): LineaPedido {
  return {
    producto: linea.producto,
    variante: linea.variante,
    color_solicitado: linea.color_solicitado,
    precio_inicial: linea.precio_inicial,
    descuentos: linea.descuentos,
    precio_aplicado: linea.precio_aplicado,
    cantidad: linea.cantidad,
    es_entonado: linea.es_entonado,
    retirado: linea.retirado,
    id_producto: linea.id_producto,
  };
}

// Historial, notas y contactos guardan TIMESTAMPTZ: viajan como instante ISO 8601 (UTC)
// y la interfaz los muestra en la hora local de quien consulta.

export function aCambioEstado(fila: FilaHistorialEstado): CambioEstado {
  return {
    estado_anterior: fila.estado_anterior,
    estado_nuevo: fila.estado_nuevo,
    autor: fila.autor,
    motivo: fila.motivo,
    fecha: fila.fecha.toISOString(),
  };
}

export function aNotaInterna(fila: FilaNotaOrden): NotaInterna {
  return { texto: fila.texto, autor: fila.autor, fecha: fila.fecha.toISOString() };
}

export function aContactoRegistrado(fila: FilaContactoOrden): ContactoRegistrado {
  return { medio: fila.medio, detalle: fila.detalle, autor: fila.autor, fecha: fila.fecha.toISOString() };
}

export class OrdenesService {
  /**
   * @param reloj Fuente de la hora actual. Se inyecta para que el cálculo de
   *              `dias_esperando` sea verificable en las pruebas.
   */
  constructor(
    private readonly repo: OrdenesRepository,
    private readonly registro: RegistroAccesosDenegados,
    private readonly reloj: () => Date = () => new Date()
  ) {}

  /** Sección de pedidos del cliente, separada en curso / finalizados (CA-ORD-07-01, CA-ORD-07-02). */
  async listarPedidosDeCliente(idUsuario: number, termino: string | undefined): Promise<PedidosCliente> {
    const texto = termino && termino.trim() !== '' ? termino.trim() : undefined;
    const filas = await this.repo.listarDeCliente(idUsuario, texto);

    const enCurso: ResumenPedido[] = [];
    const finalizados: ResumenPedido[] = [];
    for (const fila of filas) {
      const resumen: ResumenPedido = {
        codigo: fila.codigo_visible,
        fecha: fechaIso(fila.fecha),
        total: fila.total,
        estado: fila.estado,
      };
      (GRUPO_POR_ESTADO[fila.estado] === 'finalizados' ? finalizados : enCurso).push(resumen);
    }

    return { en_curso: enCurso, finalizados };
  }

  /**
   * Detalle de un pedido propio (HU-ORD-04), con su historia de estados (RF-ORD-04-01).
   * Del historial el cliente solo recibe cada estado y su momento: el autor y el motivo
   * son datos del personal (RF-ORD-09-01). `operacion` identifica la petición en el
   * registro de accesos denegados, con la misma forma que usan las guardas de M20.
   */
  async detallePedidoDeCliente(idUsuario: number, codigo: string, operacion: string): Promise<DetallePedido> {
    const orden = await this.repo.buscarPorCodigo(codigo);
    if (!orden) {
      throw recursoNoEncontrado();
    }
    if (orden.id_usuario !== idUsuario) {
      this.registro.registrarAccesoDenegado(idUsuario, operacion, 'TITULARIDAD_AJENA');
      throw recursoNoEncontrado();
    }
    const [detalle, historial] = await Promise.all([
      this.armarDetalle(orden),
      this.repo.listarHistorial(orden.id_orden),
    ]);
    return {
      ...detalle,
      lineas: detalle.lineas.map(aLineaCliente),
      historial: historial.map((cambio) => ({ estado: cambio.estado_nuevo, fecha: cambio.fecha.toISOString() })),
    };
  }

  /**
   * Listado del personal con filtros (HU-ORD-05, HU-ORD-08). El permiso se exige en la
   * ruta. Paginación como en M02. Cada fila indica cuántos días lleva esperando desde su
   * último cambio de estado, con la fecha de Colombia (CA-ORD-05-07).
   */
  async listarOrdenesParaPersonal(
    filtros: FiltrosGestionOrdenes,
    pagina: number | undefined,
    limite: number | undefined,
    orden: OrdenListado = 'recientes'
  ): Promise<PaginaOrdenesGestion> {
    const paginaFinal = pagina && pagina > 0 ? Math.floor(pagina) : 1;
    const limiteFinal = Math.min(limite && limite > 0 ? Math.floor(limite) : LIMITE_POR_DEFECTO, LIMITE_MAXIMO);
    const offset = (paginaFinal - 1) * limiteFinal;

    const [filas, total] = await Promise.all([
      this.repo.listarParaPersonal(filtros, limiteFinal, offset, orden),
      this.repo.contarParaPersonal(filtros),
    ]);

    const hoy = formatoFechaColombia.format(this.reloj());
    return {
      items: filas.map((fila) => {
        const fecha = fechaIso(fila.fecha);
        const esperaDesde = fila.ultimo_cambio ? formatoFechaColombia.format(fila.ultimo_cambio) : fecha;
        return {
          codigo: fila.codigo_visible,
          fecha,
          total: fila.total,
          estado: fila.estado,
          id_cliente: fila.id_usuario,
          cliente: fila.nombre_cliente,
          modo_entrega: fila.modo_entrega,
          dias_esperando: diasEntre(esperaDesde, hoy),
        };
      }),
      total,
      pagina: paginaFinal,
      limite: limiteFinal,
      total_paginas: Math.ceil(total / limiteFinal),
    };
  }

  /** Contadores del panel por estado, con los estados sin órdenes en cero (CA-ORD-05-05). */
  async resumenPorEstado(): Promise<ResumenEstadosOrdenes> {
    const conteos = await this.repo.contarPorEstado();
    const porEstado = Object.fromEntries(ESTADOS.map((estado) => [estado, 0])) as Record<EnumEstadoOrden, number>;
    for (const { estado, total } of conteos) {
      porEstado[estado] = total;
    }
    return {
      por_estado: porEstado,
      total: conteos.reduce((suma, fila) => suma + fila.total, 0),
    };
  }

  /**
   * Compras anteriores del titular de una orden, abiertas desde esa orden
   * (HU-ORD-11, CA-ORD-11-01): la orden actual no se repite y van las más recientes primero.
   */
  async historialDelCliente(
    codigo: string,
    pagina: number | undefined,
    limite: number | undefined
  ): Promise<PaginaOrdenesGestion> {
    const orden = await this.repo.buscarPorCodigo(codigo);
    if (!orden) {
      throw recursoNoEncontrado();
    }
    return this.listarOrdenesParaPersonal(
      { idCliente: orden.id_usuario, excluirIdOrden: orden.id_orden },
      pagina,
      limite,
      'recientes'
    );
  }

  /**
   * Consulta de una orden por su identificador para personal autorizado (CA-ORD-08-01).
   * Incluye el contacto del cliente (CA-ORD-09-01), el historial de estados (CA-ORD-09-02),
   * las notas internas (CA-ORD-10-02), los contactos registrados (CA-ORD-09-03) y los
   * estados a los que se puede pasar desde el actual (HU-ORD-03).
   */
  async detallePedidoParaPersonal(codigo: string): Promise<DetallePedidoPersonal> {
    const orden = await this.repo.buscarPorCodigo(codigo);
    if (!orden) {
      throw recursoNoEncontrado();
    }
    const [detalle, contacto, historial, notas, contactos] = await Promise.all([
      this.armarDetalle(orden),
      this.repo.buscarContactoCliente(orden.id_usuario),
      this.repo.listarHistorial(orden.id_orden),
      this.repo.listarNotas(orden.id_orden),
      this.repo.listarContactos(orden.id_orden),
    ]);
    return {
      ...detalle,
      id_cliente: orden.id_usuario,
      cliente: contacto ?? null,
      transiciones_permitidas: transicionesPermitidas(orden.estado, orden.modo_entrega),
      historial: historial.map(aCambioEstado),
      notas: notas.map(aNotaInterna),
      contactos: contactos.map(aContactoRegistrado),
    };
  }

  /**
   * Arma el detalle con la copia histórica completa (HU-ORD-02): importes, IVA, modo de
   * entrega y, por línea, el precio de partida y sus descuentos en orden (RF-ORD-02-02).
   * Solo expone lo necesario para la vista (HU-SEG-06): ni claves primarias ni datos de pago.
   */
  private async armarDetalle(orden: CabeceraOrden): Promise<DetalleCompleto> {
    const lineas = await this.repo.listarLineas(orden.id_orden);
    const descuentos = await this.repo.listarDescuentos(lineas.map((linea) => linea.id_linea_orden));
    const descuentosPorLinea = new Map<number, DescuentoAplicado[]>();
    for (const d of descuentos) {
      const aplicado: DescuentoAplicado = {
        orden: d.orden_aplicacion,
        origen: d.origen,
        porcentaje: d.porcentaje,
        importe: d.importe,
      };
      descuentosPorLinea.set(d.id_linea_orden, [...(descuentosPorLinea.get(d.id_linea_orden) ?? []), aplicado]);
    }

    return {
      codigo: orden.codigo_visible,
      codigo_solicitud: orden.codigo_solicitud,
      fecha: fechaIso(orden.fecha),
      estado: orden.estado,
      origen: orden.origen,
      modo_entrega: orden.modo_entrega,
      direccion: orden.direccion,
      sub_total: orden.sub_total,
      descuento: orden.descuento,
      costo_entrega: orden.costo_entrega,
      total: orden.total,
      base_sin_impuesto: orden.base_sin_impuesto,
      importe_iva: orden.importe_iva,
      tasa_iva: orden.tasa_iva,
      observaciones: orden.observaciones,
      lineas: lineas.map((linea) => {
        const retirado = lineaRetirada(linea);
        return {
          producto: linea.nombre_producto,
          variante: linea.variante_copia,
          color_solicitado: linea.color_solicitado,
          precio_inicial: linea.precio_inicial,
          descuentos: descuentosPorLinea.get(linea.id_linea_orden) ?? [],
          precio_aplicado: linea.precio_aplicado,
          cantidad: linea.cantidad,
          es_entonado: linea.es_entonado,
          retirado,
          id_producto: retirado ? null : linea.producto_id,
          base_consumida: linea.base_consumida,
        };
      }),
    };
  }
}
