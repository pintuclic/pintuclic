import { EnumEstadoOrden } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import {
  CabeceraOrden,
  DetallePedido,
  DetallePedidoPersonal,
  FiltrosGestionOrdenes,
  GrupoPedido,
  PaginaOrdenesGestion,
  PedidosCliente,
  RegistroAccesosDenegados,
  ResumenPedido,
} from '../interfaces/m08.interfaces';

// ==============================================================================
// M08 - SERVICIO DE CONSULTA DE ÓRDENES (HU-ORD-04, HU-ORD-05, HU-ORD-06, HU-ORD-07)
// La sesión y los permisos los exigen las guardas de M20 en la ruta. Este servicio
// decide la titularidad: una orden ajena responde igual que una inexistente
// (CA-ORD-04-03, CA-SEG-03-06) y el intento queda registrado (CA-SEG-03-05).
// ==============================================================================

/**
 * ⚠️ PROVISIONAL: la BD solo admite los estados de `enum_estado_orden`, que no coinciden
 * con la máquina de estados definida el 23/09 en #128. Cuando se alinee el esquema, este
 * mapa es el único punto a actualizar; al ser un `Record` exhaustivo, TypeScript obliga
 * a clasificar cualquier estado nuevo.
 *
 * `enviado` se trata como Despachado: para domicilio, Despachado ya es finalizado aunque
 * no se registre Entregado (D02, CA-ORD-07-01 escenario 2). Equivalencia por confirmar.
 */
const GRUPO_POR_ESTADO: Record<EnumEstadoOrden, GrupoPedido> = {
  pendiente: 'en_curso',
  pagado: 'en_curso',
  en_preparacion: 'en_curso',
  enviado: 'finalizados',
  entregado: 'finalizados',
  cancelado: 'finalizados',
};

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

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

export class OrdenesService {
  constructor(
    private readonly repo: OrdenesRepository,
    private readonly registro: RegistroAccesosDenegados
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
   * Detalle de un pedido propio (HU-ORD-04). `operacion` identifica la petición en el
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
    return this.armarDetalle(orden);
  }

  /**
   * Listado del personal con filtros por identificador, estado, periodo y cliente
   * (HU-ORD-05, CA-ORD-05-04). El permiso se exige en la ruta. Paginación como en M02.
   */
  async listarOrdenesParaPersonal(
    filtros: FiltrosGestionOrdenes,
    pagina: number | undefined,
    limite: number | undefined
  ): Promise<PaginaOrdenesGestion> {
    const paginaFinal = pagina && pagina > 0 ? Math.floor(pagina) : 1;
    const limiteFinal = Math.min(limite && limite > 0 ? Math.floor(limite) : LIMITE_POR_DEFECTO, LIMITE_MAXIMO);
    const offset = (paginaFinal - 1) * limiteFinal;

    const [filas, total] = await Promise.all([
      this.repo.listarParaPersonal(filtros, limiteFinal, offset),
      this.repo.contarParaPersonal(filtros),
    ]);

    return {
      items: filas.map((fila) => ({
        codigo: fila.codigo_visible,
        fecha: fechaIso(fila.fecha),
        total: fila.total,
        estado: fila.estado,
        id_cliente: fila.id_usuario,
      })),
      total,
      pagina: paginaFinal,
      limite: limiteFinal,
      total_paginas: Math.ceil(total / limiteFinal),
    };
  }

  /** Consulta de una orden por su identificador para personal autorizado (CA-ORD-05-04). */
  async detallePedidoParaPersonal(codigo: string): Promise<DetallePedidoPersonal> {
    const orden = await this.repo.buscarPorCodigo(codigo);
    if (!orden) {
      throw recursoNoEncontrado();
    }
    return { ...(await this.armarDetalle(orden)), id_cliente: orden.id_usuario };
  }

  /** Solo expone lo necesario para la vista (HU-SEG-06): ni clave primaria ni datos de pago. */
  private async armarDetalle(orden: CabeceraOrden): Promise<DetallePedido> {
    const lineas = await this.repo.listarLineas(orden.id_orden);
    return {
      codigo: orden.codigo_visible,
      fecha: fechaIso(orden.fecha),
      estado: orden.estado,
      origen: orden.origen,
      direccion: orden.direccion,
      sub_total: orden.sub_total,
      descuento: orden.descuento,
      total: orden.total,
      observaciones: orden.observaciones,
      lineas: lineas.map((linea) => ({
        producto: linea.nombre_producto,
        variante: linea.variante_copia,
        precio_aplicado: linea.precio_aplicado,
        cantidad: linea.cantidad,
      })),
    };
  }
}
