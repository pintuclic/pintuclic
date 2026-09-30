import { EnumEstadoOrden } from '../../../core/db/types';
import { OrdenesRepository } from '../repositories/ordenes.repository';
import { NotificadorEstadoOrden } from '../interfaces/m08.interfaces';
import { ETIQUETA_ESTADO } from './ciclo-estados';

// ==============================================================================
// M08 - AVISO AL CLIENTE POR CORREO (HU-NOT-02, D05)
// Correo solo al nacer la orden tras el pago, al despacharla y al cancelarla. El envío
// no bloquea la respuesta y un fallo del correo no deshace nada: la orden o el cambio de
// estado ya quedaron registrados, y el fallo queda en el log.
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

export interface AvisoEstadoOrden {
  readonly idUsuario: number;
  readonly codigo: string;
  readonly estado: EnumEstadoOrden;
  readonly fecha: Date;
  readonly comentarios?: string;
}

/** Pide a M18 el correo del estado de la orden sin esperar la respuesta (D05). */
export function avisarCliente(
  repo: OrdenesRepository,
  notificador: NotificadorEstadoOrden,
  aviso: AvisoEstadoOrden
): void {
  void repo
    .buscarContactoCliente(aviso.idUsuario)
    .then((cliente) => {
      if (!cliente) {
        return undefined;
      }
      return notificador.notificarCambioEstadoOrden({
        idUsuario: aviso.idUsuario,
        destinatario: cliente.correo,
        nombreCliente: cliente.nombre,
        numeroOrden: aviso.codigo,
        nuevoEstado: ETIQUETA_ESTADO[aviso.estado],
        fechaCambio: formatoFechaHoraColombia.format(aviso.fecha),
        comentarios: aviso.comentarios,
      });
    })
    .catch((error: unknown) => {
      console.error('[M08-Ordenes] Error notificando al cliente el estado de la orden:', error);
    });
}
