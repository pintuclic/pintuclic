import { EnumEstadoOrden } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import {
  CabeceraOrden,
  DetallePedido,
  DetallePedidoPersonal,
  FiltrosGestionOrdenes,
  GrupoPedido,
  OrdenListado,
  PaginaOrdenesGestion,
  PedidosCliente,
  RegistroAccesosDenegados,
  ResumenEstadosOrdenes,
  ResumenPedido,
} from '../interfaces/m08.interfaces';

// ==============================================================================
// M08 - SERVICIO DE CONSULTA DE ÓRDENES (HU-ORD-04, 05, 06, 07, 08, 09 y 11)
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
 * no se registre Entregado (D02, CA-ORD-03-06). Equivalencia por confirmar.
 */
const GRUPO_POR_ESTADO: Record<EnumEstadoOrden, GrupoPedido> = {
  pendiente: 'en_curso',
  pagado: 'en_curso',
  en_preparacion: 'en_curso',
  enviado: 'finalizados',
  entregado: 'finalizados',
  cancelado: 'finalizados',
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
   * Listado del personal con filtros (HU-ORD-05, HU-ORD-08). El permiso se exige en la
   * ruta. Paginación como en M02. Cada fila indica cuántos días lleva esperando
   * (CA-ORD-05-07; provisional, ver `ResumenOrdenGestion`).
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
        return {
          codigo: fila.codigo_visible,
          fecha,
          total: fila.total,
          estado: fila.estado,
          id_cliente: fila.id_usuario,
          dias_esperando: diasEntre(fecha, hoy),
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
   * Incluye el contacto del cliente (CA-ORD-09-01).
   */
  async detallePedidoParaPersonal(codigo: string): Promise<DetallePedidoPersonal> {
    const orden = await this.repo.buscarPorCodigo(codigo);
    if (!orden) {
      throw recursoNoEncontrado();
    }
    const [detalle, contacto] = await Promise.all([
      this.armarDetalle(orden),
      this.repo.buscarContactoCliente(orden.id_usuario),
    ]);
    return { ...detalle, id_cliente: orden.id_usuario, cliente: contacto ?? null };
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
