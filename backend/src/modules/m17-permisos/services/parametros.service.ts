import { ParametrosRepository } from '../repositories/parametros.repository';
import { ParametroSistema } from '../interfaces/m17.interfaces';

// ==============================================================================
// M17 - SERVICIO DE PARÁMETROS DEL SISTEMA (RF-ADM-06)
// Lectura y actualizacion de configuracion global con validacion de rangos.
// ==============================================================================

export class ParametrosService {
  constructor(private readonly parametrosRepo: ParametrosRepository) {}

  /**
   * Lista todos los parametros configurables del sistema (RF-ADM-06-01).
   */
  async listarParametros(): Promise<ParametroSistema[]> {
    return this.parametrosRepo.listarParametros();
  }

  /**
   * Actualiza un parametro del sistema con validacion de clave y rango (RF-ADM-06-02).
   *
   * Reglas:
   * - La clave debe existir en el catalogo de parametros admitidos.
   * - Si el parametro tiene rango numerico definido, el valor debe caer dentro de el.
   * - Los valores booleanos y de texto no tienen rango numerico.
   */
  async actualizarParametro(clave: string, valor: string | number | boolean): Promise<{
    ok: boolean;
    parametro?: ParametroSistema;
    error?: string;
  }> {
    // Verificar que la clave existe
    if (!this.parametrosRepo.esClavValida(clave)) {
      return { ok: false, error: `La clave '${clave}' no es un parametro configurable del sistema` };
    }

    // Validar rango si el valor es numerico
    if (typeof valor === 'number') {
      const rango = this.parametrosRepo.obtenerRangoAdmitido(clave);
      if (rango !== null) {
        if (valor < rango.min || valor > rango.max) {
          return {
            ok: false,
            error: `El valor para '${clave}' debe estar entre ${rango.min} y ${rango.max}`,
          };
        }
      }

      if (!Number.isInteger(valor) && Number.isInteger(rango?.min)) {
        return { ok: false, error: `El valor para '${clave}' debe ser un numero entero` };
      }
    }

    await this.parametrosRepo.actualizarParametro(clave, valor);
    const parametro = await this.parametrosRepo.obtenerPorClave(clave);

    if (parametro) return { ok: true, parametro };
    return { ok: true };
  }
}

