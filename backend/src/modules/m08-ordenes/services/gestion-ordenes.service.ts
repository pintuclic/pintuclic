import { EnumEstadoOrden, EnumModoEntrega } from '../../../core/db/types';
import { AppError } from '../../../core/middlewares/errorHandler';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import {
  CabeceraOrden,
  ContactoRegistrado,
  MedioContacto,
  NotaInterna,
  NotificadorEstadoOrden,
  ResultadoCambioEstado,
} from '../interfaces/m08.interfaces';
import {
  ESTADOS_NO_HABILITADOS,
  ESTADOS_QUE_NOTIFICAN,
  ETIQUETA_ESTADO,
  esTransicionPermitida,
  requiereMotivo,
  transicionesPermitidas,
} from './ciclo-estados';
import { aContactoRegistrado, aNotaInterna } from './ordenes.service';

// ==============================================================================
// M08 - SERVICIO DE GESTIÓN DE ÓRDENES (HU-ORD-03, 05, 09 y 10)
// Operaciones del personal sobre una orden: avanzar su estado, dejar notas internas y
// registrar contactos con el cliente. Los permisos los exigen las guardas de M20 en la
// ruta; este servicio aplica las reglas del ciclo de estados (`ciclo-estados.ts`).
// ==============================================================================

/** Fecha y hora de Colombia para el correo al cliente (ej. «29/09/2026, 15:32»). */
const formatoFechaHoraColombia = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function recursoNoEncontrado(): AppError {
  return new AppError('Recurso no encontrado', 404, 'NOT_FOUND');
}

/**
 * Mensaje de una transición rechazada. Si la bloquea el modo de entrega (D02, RF-ORD-03-06)
 * lo dice, para que el empleado sepa qué hacer en su lugar.
 */
function mensajeTransicionNoPermitida(
  desde: EnumEstadoOrden,
  hacia: EnumEstadoOrden,
  modo: EnumModoEntrega | null
): string {
  if (desde === 'preparada' && modo === 'recogida' && hacia === 'despachado') {
    return 'Una orden de recogida en almacén no se despacha: al recogerla pasa directamente a «Entregado»';
  }
  if (desde === 'preparada' && modo === 'domicilio' && hacia === 'entregado') {
    return 'Una orden a domicilio primero se despacha; «Entregado» es un paso posterior y opcional';
  }
  return `Una orden en «${ETIQUETA_ESTADO[desde]}» no puede pasar a «${ETIQUETA_ESTADO[hacia]}»`;
}

export class GestionOrdenesService {
  constructor(
    private readonly repo: OrdenesRepository,
    private readonly notificador: NotificadorEstadoOrden
  ) {}

  /**
   * Registra el paso de una orden a otro estado (HU-ORD-03, CA-ORD-05-01). Varios empleados
   * pueden operar la misma orden: cada paso queda con su autor (CA-ORD-05-08) y, si otra
   * persona la cambió entre medias, se rechaza en lugar de sobrescribir su cambio.
   */
  async cambiarEstado(
    codigo: string,
    estadoNuevo: EnumEstadoOrden,
    idAutor: number,
    motivo: string | undefined
  ): Promise<ResultadoCambioEstado> {
    const orden = await this.buscarOrden(codigo);
    const estadoActual = orden.estado;

    if (estadoNuevo === estadoActual) {
      throw new AppError(`La orden ya está en «${ETIQUETA_ESTADO[estadoActual]}»`, 409, 'ESTADO_SIN_CAMBIO');
    }
    if (ESTADOS_NO_HABILITADOS.includes(estadoNuevo)) {
      throw new AppError(
        'La cancelación y la devolución todavía no están habilitadas: dependen de la política de cancelación y devolución (M11)',
        409,
        'OPERACION_NO_HABILITADA'
      );
    }
    const modo = orden.modo_entrega;
    if (!esTransicionPermitida(estadoActual, estadoNuevo, modo)) {
      throw new AppError(
        mensajeTransicionNoPermitida(estadoActual, estadoNuevo, modo),
        409,
        'TRANSICION_NO_PERMITIDA',
        { permitidas: transicionesPermitidas(estadoActual, modo) }
      );
    }

    const motivoLimpio = motivo && motivo.trim() !== '' ? motivo.trim() : null;
    if (requiereMotivo(estadoActual, estadoNuevo) && motivoLimpio === null) {
      throw new AppError(
        `Indica el motivo para volver a «${ETIQUETA_ESTADO[estadoNuevo]}»`,
        400,
        'MOTIVO_REQUERIDO'
      );
    }

    const fecha = await this.repo.cambiarEstado({
      idOrden: orden.id_orden,
      estadoActual,
      estadoNuevo,
      idAutor,
      motivo: motivoLimpio,
    });
    if (!fecha) {
      throw new AppError(
        'Otra persona cambió el estado de esta orden hace un momento. Vuelve a abrirla para ver su estado actual.',
        409,
        'ESTADO_CAMBIADO'
      );
    }

    if (ESTADOS_QUE_NOTIFICAN.includes(estadoNuevo)) {
      this.notificarCliente(orden, estadoNuevo, fecha);
    }

    return {
      codigo: orden.codigo_visible,
      estado_anterior: estadoActual,
      estado: estadoNuevo,
      fecha: fecha.toISOString(),
      transiciones_permitidas: transicionesPermitidas(estadoNuevo, modo),
    };
  }

  /** Añade una nota interna a la orden (HU-ORD-10). No hay operación para editarla ni borrarla. */
  async crearNota(codigo: string, idAutor: number, texto: string): Promise<NotaInterna> {
    const orden = await this.buscarOrden(codigo);
    return aNotaInterna(await this.repo.crearNota(orden.id_orden, idAutor, texto));
  }

  /** Deja constancia de un contacto con el cliente iniciado desde la orden (CA-ORD-09-03). */
  async registrarContacto(
    codigo: string,
    idAutor: number,
    medio: MedioContacto,
    detalle: string | undefined
  ): Promise<ContactoRegistrado> {
    const orden = await this.buscarOrden(codigo);
    const detalleLimpio = detalle && detalle.trim() !== '' ? detalle.trim() : null;
    return aContactoRegistrado(await this.repo.registrarContacto(orden.id_orden, idAutor, medio, detalleLimpio));
  }

  private async buscarOrden(codigo: string): Promise<CabeceraOrden> {
    const orden = await this.repo.buscarPorCodigo(codigo);
    if (!orden) {
      throw recursoNoEncontrado();
    }
    return orden;
  }

  /**
   * Aviso al cliente por M18 (HU-NOT-02). No bloquea la respuesta y un fallo del correo
   * no deshace el cambio de estado, que ya quedó registrado (D05).
   */
  private notificarCliente(orden: CabeceraOrden, estadoNuevo: EnumEstadoOrden, fecha: Date): void {
    void this.repo
      .buscarContactoCliente(orden.id_usuario)
      .then((cliente) => {
        if (!cliente) {
          return undefined;
        }
        return this.notificador.notificarCambioEstadoOrden({
          idUsuario: orden.id_usuario,
          destinatario: cliente.correo,
          nombreCliente: cliente.nombre,
          numeroOrden: orden.codigo_visible,
          nuevoEstado: ETIQUETA_ESTADO[estadoNuevo],
          fechaCambio: formatoFechaHoraColombia.format(fecha),
        });
      })
      .catch((error: unknown) => {
        console.error('[M08-Ordenes] Error notificando el cambio de estado de la orden:', error);
      });
  }
}
