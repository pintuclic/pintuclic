import {
  EventoAccesoDenegado,
  MotivoDenegacion,
  MotivoSesionInvalida,
} from '../interfaces/seguridad.interfaces';

/**
 * Registro técnico de eventos de seguridad (RF-SEG-03-07, RF-SEG-06-07).
 *
 * ⚠️ ALCANCE PROVISIONAL: la persistencia definitiva de estos eventos corresponde a
 * la tabla de auditoría de HU-SEG-04, que el equipo mantiene EN PAUSA a la espera de
 * la decisión sobre el modelo de datos. Hasta entonces los eventos se emiten al
 * registro técnico del servidor con la misma forma (actor, operación, fecha) que
 * exige CA-SEG-03-05, de modo que sustituir este sumidero por el repositorio de
 * auditoría no obligue a tocar a los consumidores.
 *
 * Invariante: este registro NUNCA recibe contraseñas, hashes ni datos personales
 * del cuerpo de la petición (RF-SEG-01-03, CA-SEG-01-03, CA-SEG-06-06).
 */
export class RegistroSeguridadService {
  /**
   * Deja constancia de un acceso denegado por el validador central.
   */
  registrarAccesoDenegado(idUsuario: number | null, operacion: string, motivo: MotivoDenegacion): void {
    const evento: EventoAccesoDenegado = {
      idUsuario,
      operacion,
      motivo,
      fecha: new Date().toISOString(),
    };

    console.warn('[M20][ACCESO_DENEGADO]', JSON.stringify(evento));
  }

  /**
   * Deja constancia de por qué se rechazó una sesión persistida.
   *
   * El motivo exacto (caducada, cerrada, revocada, desconocida) solo existe aquí: al
   * navegador siempre le llega la misma respuesta, para no revelar si la sesión fue
   * revocada por un administrador o simplemente venció (RF-SEG-03-05).
   */
  registrarSesionInvalida(idUsuario: number, operacion: string, motivo: MotivoSesionInvalida): void {
    console.warn(
      '[M20][SESION_INVALIDA]',
      JSON.stringify({ idUsuario, operacion, motivo, fecha: new Date().toISOString() })
    );
  }

  /**
   * Deja constancia del detalle técnico de un error interno sin exponerlo al
   * navegador (RF-SEG-06-07, CA-SEG-06-02).
   */
  registrarErrorTecnico(operacion: string, detalle: string): void {
    console.error(
      '[M20][ERROR_TECNICO]',
      JSON.stringify({ operacion, detalle, fecha: new Date().toISOString() })
    );
  }
}
