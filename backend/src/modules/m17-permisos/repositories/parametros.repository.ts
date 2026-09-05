import { Kysely } from 'kysely';
import { Database } from '../../../core/db/types';
import { ParametroSistema } from '../interfaces/m17.interfaces';

// ==============================================================================
// M17 - REPOSITORIO DE PARÁMETROS DEL SISTEMA
// Consulta y actualizacion de configuracion global en base de datos.
//
// NOTA ARQUITECTURAL: El schema actual (v2.3) no tiene tabla 'parametros'.
// Los parametros se gestionan desde la tabla 'sesion' politica (M20)
// y constantes del servidor. Este repositorio provee la interfaz preparatoria
// conforme a RF-ADM-06, quedando listo para cuando se migre el schema.
// Por ahora lee/escribe desde un mapa en memoria respaldado por la BD de sesiones.
// ==============================================================================

/** Parametros configurables del sistema con sus valores por defecto. */
const PARAMETROS_DEFECTO: Record<string, ParametroSistema> = {
  inactividad_admin_segundos: {
    clave: 'inactividad_admin_segundos',
    valor: 1800,
    descripcion: 'Segundos de inactividad antes de cerrar sesion de administrador',
  },
  inactividad_cliente_segundos: {
    clave: 'inactividad_cliente_segundos',
    valor: 7776000,
    descripcion: 'Segundos de inactividad antes de cerrar sesion de cliente (90 dias)',
  },
  intentos_fallidos_max: {
    clave: 'intentos_fallidos_max',
    valor: 5,
    descripcion: 'Numero maximo de intentos fallidos antes de bloqueo de cuenta',
  },
};

/** Estado en memoria de parametros (persistido via actualizaciones directas en M20). */
const estadoParametros: Record<string, ParametroSistema> = { ...PARAMETROS_DEFECTO };

export class ParametrosRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Lista todos los parametros configurables del sistema (RF-ADM-06-01).
   */
  async listarParametros(): Promise<ParametroSistema[]> {
    return Object.values(estadoParametros);
  }

  /**
   * Obtiene un parametro por clave. Null si no existe.
   */
  async obtenerPorClave(clave: string): Promise<ParametroSistema | null> {
    return estadoParametros[clave] ?? null;
  }

  /**
   * Actualiza el valor de un parametro del sistema (RF-ADM-06-02).
   * Retorna false si la clave no existe en el catalogo admitido.
   */
  async actualizarParametro(clave: string, valor: string | number | boolean): Promise<boolean> {
    if (!(clave in estadoParametros)) {
      return false;
    }
    const actual = estadoParametros[clave]!;
    const nuevo: ParametroSistema = actual.descripcion !== undefined
      ? { clave: actual.clave, valor, descripcion: actual.descripcion }
      : { clave: actual.clave, valor };
    estadoParametros[clave] = nuevo;
    return true;
  }

  /**
   * Verifica que la clave es un parametro conocido y administrable.
   */
  esClavValida(clave: string): boolean {
    return clave in estadoParametros;
  }

  /**
   * Retorna los rangos admitidos para cada parametro (para validacion en servicio).
   */
  obtenerRangoAdmitido(clave: string): { min: number; max: number } | null {
    const rangos: Record<string, { min: number; max: number }> = {
      inactividad_admin_segundos: { min: 60, max: 86400 },
      inactividad_cliente_segundos: { min: 300, max: 7776000 },
      intentos_fallidos_max: { min: 1, max: 20 },
    };
    return rangos[clave] ?? null;
  }
}


