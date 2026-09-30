import { AppError } from '../../../core/middlewares/errorHandler';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import { SolicitudPagoConfirmadoDto } from '../dtos/ordenes.dto';
import {
  NotificadorEstadoOrden,
  NuevaOrdenConfirmada,
  OrdenCreada,
  ResultadoCreacionOrden,
  SolicitudPagoConfirmado,
} from '../interfaces/m08.interfaces';
import { CodigoPedidoService } from './codigo-pedido.service';
import { avisarCliente } from './aviso-cliente';

// ==============================================================================
// M08 - CREACIÓN DE LA ORDEN AL CONFIRMARSE EL PAGO (HU-ORD-01)
// Punto de entrada para M07: no tiene ruta HTTP. M07 conserva la solicitud SOL mientras
// no haya confirmación (RF-ORD-01-06) y, al confirmarse el pago por la pasarela o por un
// empleado (CA-ORD-01-03), llama a `crearDesdePagoConfirmado()`. La llamada se puede
// repetir sin riesgo: una solicitud genera una sola orden (CA-ORD-01-05), así que M07
// puede reintentar o conciliar después de un fallo.
// ==============================================================================

/** Partes de la fecha en Colombia; la orden guarda el día de Colombia, no el del servidor. */
const formatoFechaColombia = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** AAAA-MM-DD del momento indicado según la hora de Colombia. */
function fechaColombia(momento: Date): string {
  const partes = Object.fromEntries(formatoFechaColombia.formatToParts(momento).map((p) => [p.type, p.value]));
  return `${partes.year}-${partes.month}-${partes.day}`;
}

/** Importe validado («95900.5») en centavos enteros, para compararlo sin errores de coma flotante. */
function aCentavos(importe: string): number {
  const [enteros = '0', decimales = ''] = importe.split('.');
  return Number(enteros) * 100 + Number(decimales.padEnd(2, '0'));
}

/** Error de PostgreSQL con su código SQLSTATE y la restricción que lo produjo. */
interface ErrorPostgres {
  readonly code: string;
  readonly constraint?: string;
}

function esErrorPostgres(error: unknown, codigo: string): error is ErrorPostgres {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === codigo;
}

/** Mensaje cuando la solicitud remite a un registro que no existe (clave foránea). */
const REFERENCIAS_INEXISTENTES: Readonly<Record<string, string>> = {
  fk_orden_usuario: 'El cliente de la solicitud no existe',
  fk_orden_cotizacion: 'La cotización de origen no existe',
  fk_historial_estado_autor: 'El empleado que verificó el pago no existe',
};

/**
 * Traduce la solicitud validada a las filas de la orden. Los importes se copian tal cual
 * (D07) y el orden de los descuentos de cada línea es su orden de aplicación (RF-ORD-02-02).
 */
function armarNuevaOrden(d: SolicitudPagoConfirmadoDto, fecha: string): NuevaOrdenConfirmada {
  const pago = d.confirmacion;
  return {
    orden: {
      id_usuario: d.idCliente,
      origen: d.origen,
      id_cotizacion: d.idCotizacion,
      carrito_o_cotizacion: d.origen === 'cotizacion' ? 'cotizacion_aprobada' : 'carrito_directo',
      transaccion_pago_id: pago.medio === 'pasarela' ? pago.transaccionId : null,
      codigo_solicitud: d.codigoSolicitud,
      modo_entrega: d.modoEntrega,
      costo_entrega: d.costoEntrega,
      direccion: d.direccion,
      sub_total: d.subTotal,
      descuento: d.descuento,
      total: d.total,
      base_sin_impuesto: d.baseSinImpuesto,
      importe_iva: d.importeIva,
      tasa_iva: d.tasaIva,
      observaciones: d.observaciones,
      fecha,
    },
    lineas: d.lineas.map((l) => ({
      linea: {
        nombre_producto: l.nombreProducto,
        variante_copia: l.varianteCopia,
        precio_aplicado: l.precioAplicado,
        cantidad: l.cantidad,
        color_solicitado: l.colorSolicitado,
        precio_inicial: l.precioInicial,
        id_variante_ref: l.idVarianteRef,
        es_entonado: l.esEntonado,
        base_consumida: l.baseConsumida,
      },
      descuentos: l.descuentos.map((descuento, i) => ({
        orden_aplicacion: i + 1,
        origen: descuento.origen,
        porcentaje: descuento.porcentaje,
        importe: descuento.importe,
      })),
    })),
    // Pasarela: lo registra el sistema con su transacción. Pago directo: el empleado que lo verificó.
    historial:
      pago.medio === 'pasarela'
        ? { idAutor: null, referenciaExterna: pago.transaccionId }
        : { idAutor: pago.idEmpleado, referenciaExterna: pago.referencia },
  };
}

export class CreacionOrdenService {
  constructor(
    private readonly repo: OrdenesRepository,
    private readonly notificador: NotificadorEstadoOrden,
    private readonly codigos: CodigoPedidoService = new CodigoPedidoService(),
    private readonly reloj: () => Date = () => new Date()
  ) {}

  /**
   * Crea la orden de una solicitud con el pago confirmado (CA-ORD-01-01) y devuelve su
   * código PC-AAAA-NNNNN. Si la solicitud ya tenía orden, la devuelve con `creada: false`
   * (CA-ORD-01-05). La orden nace en «Orden confirmada» y el cliente recibe un correo (D05).
   *
   * Errores: datos inválidos (ZodError → 400 VALIDATION_ERROR), 409 PAGO_INSUFICIENTE,
   * 409 TRANSACCION_YA_USADA, 409 SOLICITUD_DE_OTRO_CLIENTE y 400 REFERENCIA_INEXISTENTE.
   */
  async crearDesdePagoConfirmado(solicitud: SolicitudPagoConfirmado): Promise<ResultadoCreacionOrden> {
    const datos = SolicitudPagoConfirmadoDto.parse(solicitud);
    const pago = datos.confirmacion;
    const transaccionId = pago.medio === 'pasarela' ? pago.transaccionId : null;

    const previa = await this.ordenPrevia(datos, transaccionId);
    if (previa) {
      return previa;
    }

    // D06: un pago inferior al total no permite crear la orden.
    if (aCentavos(pago.montoConfirmado) < aCentavos(datos.total)) {
      throw new AppError(
        'El pago confirmado no cubre el total de la solicitud, así que no se crea la orden',
        409,
        'PAGO_INSUFICIENTE',
        { total: datos.total, montoConfirmado: pago.montoConfirmado }
      );
    }

    const momento = this.reloj();
    let creada: OrdenCreada;
    try {
      creada = await this.repo.crearOrdenConfirmada(armarNuevaOrden(datos, fechaColombia(momento)), (consecutivo) =>
        this.codigos.formatear(consecutivo, momento)
      );
    } catch (error) {
      // CA-ORD-01-05: otra confirmación de la misma solicitud se registró mientras tanto.
      if (esErrorPostgres(error, '23505')) {
        const ganadora = await this.ordenPrevia(datos, transaccionId);
        if (ganadora) {
          return ganadora;
        }
      }
      if (esErrorPostgres(error, '23503')) {
        throw new AppError(
          REFERENCIAS_INEXISTENTES[error.constraint ?? ''] ?? 'Un dato de la solicitud remite a un registro que no existe',
          400,
          'REFERENCIA_INEXISTENTE'
        );
      }
      throw error;
    }

    avisarCliente(this.repo, this.notificador, {
      idUsuario: datos.idCliente,
      codigo: creada.codigo,
      estado: 'orden_confirmada',
      fecha: creada.fecha,
      comentarios: `Recibimos la confirmación del pago de tu solicitud ${datos.codigoSolicitud}. Tu pedido quedó registrado.`,
    });

    return { codigo: creada.codigo, codigoSolicitud: datos.codigoSolicitud, estado: 'orden_confirmada', creada: true };
  }

  /**
   * La orden que ya generó esta operación, si existe (CA-ORD-01-05). Una transacción de
   * pago que ya usó otra solicitud, o una solicitud que ya es de otro cliente, se rechazan:
   * son datos contradictorios que M07 debe revisar.
   */
  private async ordenPrevia(
    datos: SolicitudPagoConfirmadoDto,
    transaccionId: string | null
  ): Promise<ResultadoCreacionOrden | undefined> {
    const filas = await this.repo.buscarPorOperacion(datos.codigoSolicitud, transaccionId);
    const deLaSolicitud = filas.find((f) => f.codigo_solicitud === datos.codigoSolicitud);
    if (deLaSolicitud) {
      if (deLaSolicitud.id_usuario !== datos.idCliente) {
        throw new AppError('La solicitud ya generó una orden de otro cliente', 409, 'SOLICITUD_DE_OTRO_CLIENTE');
      }
      return {
        codigo: deLaSolicitud.codigo_visible,
        codigoSolicitud: datos.codigoSolicitud,
        estado: deLaSolicitud.estado,
        creada: false,
      };
    }
    if (filas.length > 0) {
      throw new AppError('La transacción de pago ya está asociada a otra solicitud', 409, 'TRANSACCION_YA_USADA');
    }
    return undefined;
  }
}
