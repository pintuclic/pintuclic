// ==============================================================================
// M08 - CÓDIGO VISIBLE DEL PEDIDO (HU-ORD-06, D04)
// Formato PC-AAAA-NNNNN: año según la fecha de Colombia al generarse la orden y
// consecutivo corrido que no se reinicia con el año ni se reutiliza (#180, #426).
// Este servicio solo da formato: el número lo aporta la fuente única que defina el
// líder técnico (secuencia o contador, ver PROPUESTA_MODELO_DATOS_M08.md §4).
// ==============================================================================

const ZONA_COLOMBIA = 'America/Bogota';
const PREFIJO = 'PC';
const DIGITOS_MINIMOS = 5;

const formatoAnioColombia = new Intl.DateTimeFormat('en-US', { timeZone: ZONA_COLOMBIA, year: 'numeric' });

export class CodigoPedidoService {
  /** Año de la fecha en Colombia, no en UTC ni en la zona del servidor (#180, esc. 1 y 2). */
  anioColombia(fecha: Date): number {
    return Number(formatoAnioColombia.format(fecha));
  }

  /**
   * Arma el código del pedido. Rellena con ceros hasta 5 cifras; por encima conserva
   * todas las cifras en lugar de truncar o reiniciar, porque #179 deja abierta la regla
   * de presentación a partir de 100000.
   */
  formatear(consecutivo: number, fecha: Date): string {
    if (!Number.isSafeInteger(consecutivo) || consecutivo < 1) {
      throw new RangeError('El consecutivo del pedido debe ser un entero positivo');
    }
    return `${PREFIJO}-${this.anioColombia(fecha)}-${String(consecutivo).padStart(DIGITOS_MINIMOS, '0')}`;
  }
}
