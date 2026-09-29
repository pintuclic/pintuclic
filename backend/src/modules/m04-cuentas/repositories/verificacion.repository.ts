import { randomUUID } from 'crypto';
import { Kysely } from 'kysely';
import { Database, CodigoVerificacion as DbCodigoVerificacion } from '../../../core/db/types';
import { RegistroCodigoOTP, TipoCodigoOTP } from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - REPOSITORIO DE CÓDIGOS DE VERIFICACIÓN OTP
// Almacén seguro con TTL de 15 minutos y límite de intentos (HU-CUE-01, HU-CUE-05)
// Persistencia híbrida (Kysely + Fallback en memoria)
// ==============================================================================

const VIGENCIA_CODIGO_MINUTOS = 15;
const MAX_INTENTOS_POR_DEFECTO = 3;

export class VerificacionRepository {
  private readonly memoriaCodigos: Map<string, RegistroCodigoOTP> = new Map();

  constructor(private readonly db?: Kysely<Database>) {}

  private generarClave(correo: string, tipo: TipoCodigoOTP): string {
    return `${correo.trim().toLowerCase()}:${tipo}`;
  }

  private mapearDesdeDb(row: DbCodigoVerificacion): RegistroCodigoOTP {
    return {
      id: row.id_codigo,
      correo: row.correo,
      codigo: row.codigo,
      tipo: row.tipo,
      expiracion: row.expiracion instanceof Date ? row.expiracion : new Date(row.expiracion),
      intentos: row.intentos,
      max_intentos: row.max_intentos,
      datos_temporales: (row.datos_temporales as Record<string, unknown> | null) ?? null,
    };
  }

  /**
   * Guarda o reemplaza un código OTP con vigencia y datos opcionales.
   */
  async guardarCodigo(
    correo: string,
    codigo: string,
    tipo: TipoCodigoOTP,
    datosTemporales?: Record<string, unknown> | null,
    vigenciaMinutos: number = VIGENCIA_CODIGO_MINUTOS
  ): Promise<RegistroCodigoOTP> {
    const normalizado = correo.trim().toLowerCase();
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + vigenciaMinutos * 60 * 1000);

    if (this.db) {
      // Eliminar o invalidar anteriores del mismo usuario y tipo
      await this.db
        .deleteFrom('codigo_verificacion')
        .where('correo', '=', normalizado)
        .where('tipo', '=', tipo)
        .execute();

      const insertado = await this.db
        .insertInto('codigo_verificacion')
        .values({
          id_codigo: randomUUID(),
          correo: normalizado,
          codigo: codigo.trim(),
          tipo,
          expiracion,
          intentos: 0,
          max_intentos: MAX_INTENTOS_POR_DEFECTO,
          datos_temporales: datosTemporales ? JSON.stringify(datosTemporales) : null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.mapearDesdeDb(insertado);
    }

    const clave = this.generarClave(correo, tipo);
    const registro: RegistroCodigoOTP = {
      id: randomUUID(),
      correo: normalizado,
      codigo: codigo.trim(),
      tipo,
      expiracion,
      intentos: 0,
      max_intentos: MAX_INTENTOS_POR_DEFECTO,
      datos_temporales: datosTemporales ?? null,
    };

    this.memoriaCodigos.set(clave, registro);
    return registro;
  }

  /**
   * Obtiene el código OTP activo si no ha expirado.
   */
  async obtenerCodigo(correo: string, tipo: TipoCodigoOTP): Promise<RegistroCodigoOTP | null> {
    const normalizado = correo.trim().toLowerCase();

    if (this.db) {
      const fila = await this.db
        .selectFrom('codigo_verificacion')
        .selectAll()
        .where('correo', '=', normalizado)
        .where('tipo', '=', tipo)
        .where('expiracion', '>', new Date())
        .executeTakeFirst();

      return fila ? this.mapearDesdeDb(fila) : null;
    }

    const clave = this.generarClave(correo, tipo);
    const registro = this.memoriaCodigos.get(clave);

    if (!registro) {
      return null;
    }

    // Verificar si expiró
    if (registro.expiracion.getTime() < Date.now()) {
      this.memoriaCodigos.delete(clave);
      return null;
    }

    return registro;
  }

  /**
   * Incrementa el contador de intentos fallidos.
   */
  async incrementarIntentos(correo: string, tipo: TipoCodigoOTP): Promise<number> {
    const normalizado = correo.trim().toLowerCase();

    if (this.db) {
      const fila = await this.db
        .selectFrom('codigo_verificacion')
        .selectAll()
        .where('correo', '=', normalizado)
        .where('tipo', '=', tipo)
        .executeTakeFirst();

      if (!fila) {
        return 0;
      }

      const nuevosIntentos = fila.intentos + 1;
      if (nuevosIntentos >= fila.max_intentos) {
        await this.db
          .deleteFrom('codigo_verificacion')
          .where('id_codigo', '=', fila.id_codigo)
          .execute();
        return nuevosIntentos;
      }

      await this.db
        .updateTable('codigo_verificacion')
        .set({ intentos: nuevosIntentos })
        .where('id_codigo', '=', fila.id_codigo)
        .execute();

      return nuevosIntentos;
    }

    const clave = this.generarClave(correo, tipo);
    const registro = this.memoriaCodigos.get(clave);

    if (!registro) {
      return 0;
    }

    registro.intentos += 1;
    if (registro.intentos >= registro.max_intentos) {
      this.memoriaCodigos.delete(clave);
      return registro.intentos;
    }

    return registro.intentos;
  }

  /**
   * Invalida y elimina el código tras su uso exitoso (un solo uso, RF-CUE-05-02).
   */
  async consumirCodigo(correo: string, tipo: TipoCodigoOTP): Promise<boolean> {
    const normalizado = correo.trim().toLowerCase();

    if (this.db) {
      const res = await this.db
        .deleteFrom('codigo_verificacion')
        .where('correo', '=', normalizado)
        .where('tipo', '=', tipo)
        .executeTakeFirst();

      return Number(res.numDeletedRows) > 0;
    }

    const clave = this.generarClave(correo, tipo);
    return this.memoriaCodigos.delete(clave);
  }

  /**
   * Barrido de registros caducados.
   */
  async limpiarExpirados(): Promise<void> {
    if (this.db) {
      await this.db
        .deleteFrom('codigo_verificacion')
        .where('expiracion', '<', new Date())
        .execute();
      return;
    }

    const ahora = Date.now();
    for (const [clave, reg] of this.memoriaCodigos.entries()) {
      if (reg.expiracion.getTime() < ahora) {
        this.memoriaCodigos.delete(clave);
      }
    }
  }
}
