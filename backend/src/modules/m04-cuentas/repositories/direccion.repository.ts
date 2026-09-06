import { randomUUID } from 'crypto';
import { Kysely, sql } from 'kysely';
import { Database, DireccionCliente as DbDireccionCliente } from '../../../core/db/types';
import { DireccionCliente } from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - REPOSITORIO DE DIRECCIONES DEL CLIENTE (HU-CUE-07)
// Gestión de múltiples direcciones y designación de predeterminada (Kysely + Fallback)
// ==============================================================================

export class DireccionRepository {
  private readonly memoriaDirecciones: Map<string, DireccionCliente> = new Map();

  constructor(private readonly db?: Kysely<Database>) {}

  private mapearDesdeDb(row: DbDireccionCliente): DireccionCliente {
    return {
      id_direccion: row.id_direccion,
      id_usuario: row.id_usuario,
      direccion: row.direccion,
      barrio: row.barrio,
      apartamento_casa: row.apartamento_casa,
      nombre_apellido: row.nombre_apellido,
      telefono: row.telefono,
      es_predeterminada: row.es_predeterminada,
      latitud: row.latitud !== null && row.latitud !== undefined ? Number(row.latitud) : null,
      longitud: row.longitud !== null && row.longitud !== undefined ? Number(row.longitud) : null,
      fecha_creacion: row.fecha_creacion instanceof Date ? row.fecha_creacion.toISOString() : String(row.fecha_creacion),
      fecha_actualizacion: row.fecha_actualizacion instanceof Date ? row.fecha_actualizacion.toISOString() : String(row.fecha_actualizacion),
    };
  }

  /**
   * Registra una nueva dirección para el usuario.
   */
  async crear(
    datos: Omit<DireccionCliente, 'id_direccion' | 'fecha_creacion' | 'fecha_actualizacion'>
  ): Promise<DireccionCliente> {
    if (datos.es_predeterminada) {
      await this.desmarcarPredeterminadas(datos.id_usuario);
    }

    if (this.db) {
      const id = randomUUID();
      const insertada = await this.db
        .insertInto('direccion_cliente')
        .values({
          id_direccion: id,
          id_usuario: datos.id_usuario,
          direccion: datos.direccion,
          barrio: datos.barrio,
          apartamento_casa: datos.apartamento_casa ?? null,
          nombre_apellido: datos.nombre_apellido,
          telefono: datos.telefono,
          es_predeterminada: datos.es_predeterminada,
          latitud: datos.latitud ?? null,
          longitud: datos.longitud ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.mapearDesdeDb(insertada);
    }

    const ahora = new Date().toISOString();
    const id = randomUUID();
    const nuevaDireccion: DireccionCliente = {
      ...datos,
      id_direccion: id,
      fecha_creacion: ahora,
      fecha_actualizacion: ahora,
    };
    this.memoriaDirecciones.set(id, nuevaDireccion);
    return nuevaDireccion;
  }

  /**
   * Lista todas las direcciones pertenecientes a un usuario (HU-SEG-03).
   */
  async listarPorUsuario(idUsuario: number): Promise<DireccionCliente[]> {
    if (this.db) {
      const filas = await this.db
        .selectFrom('direccion_cliente')
        .selectAll()
        .where('id_usuario', '=', idUsuario)
        .orderBy('fecha_creacion', 'desc')
        .execute();

      return filas.map((f) => this.mapearDesdeDb(f));
    }

    return Array.from(this.memoriaDirecciones.values()).filter(
      (dir) => dir.id_usuario === idUsuario
    );
  }

  /**
   * Busca una dirección por su identificador.
   */
  async buscarPorId(idDireccion: string): Promise<DireccionCliente | null> {
    if (this.db) {
      const fila = await this.db
        .selectFrom('direccion_cliente')
        .selectAll()
        .where('id_direccion', '=', idDireccion)
        .executeTakeFirst();

      return fila ? this.mapearDesdeDb(fila) : null;
    }

    return this.memoriaDirecciones.get(idDireccion) ?? null;
  }

  /**
   * Actualiza los datos de una dirección asegurando pertenencia.
   */
  async actualizar(
    idDireccion: string,
    idUsuario: number,
    cambios: Partial<DireccionCliente>
  ): Promise<DireccionCliente | null> {
    if (this.db) {
      const existente = await this.buscarPorId(idDireccion);
      if (!existente || existente.id_usuario !== idUsuario) {
        return null;
      }

      if (cambios.es_predeterminada) {
        await this.desmarcarPredeterminadas(idUsuario);
      }

      const actualizada = await this.db
        .updateTable('direccion_cliente')
        .set({
          direccion: cambios.direccion,
          barrio: cambios.barrio,
          apartamento_casa: cambios.apartamento_casa,
          nombre_apellido: cambios.nombre_apellido,
          telefono: cambios.telefono,
          es_predeterminada: cambios.es_predeterminada,
          latitud: cambios.latitud,
          longitud: cambios.longitud,
          fecha_actualizacion: sql`NOW()`,
        })
        .where('id_direccion', '=', idDireccion)
        .where('id_usuario', '=', idUsuario)
        .returningAll()
        .executeTakeFirst();

      return actualizada ? this.mapearDesdeDb(actualizada) : null;
    }

    const dir = this.memoriaDirecciones.get(idDireccion);
    if (!dir || dir.id_usuario !== idUsuario) {
      return null;
    }

    if (cambios.es_predeterminada) {
      await this.desmarcarPredeterminadas(idUsuario);
    }

    const actualizada: DireccionCliente = {
      ...dir,
      ...cambios,
      id_direccion: idDireccion,
      id_usuario: idUsuario,
      fecha_actualizacion: new Date().toISOString(),
    };

    this.memoriaDirecciones.set(idDireccion, actualizada);
    return actualizada;
  }

  /**
   * Elimina una dirección comprobando que pertenezca al usuario.
   */
  async eliminar(idDireccion: string, idUsuario: number): Promise<boolean> {
    if (this.db) {
      const res = await this.db
        .deleteFrom('direccion_cliente')
        .where('id_direccion', '=', idDireccion)
        .where('id_usuario', '=', idUsuario)
        .executeTakeFirst();

      return Number(res.numDeletedRows) > 0;
    }

    const dir = this.memoriaDirecciones.get(idDireccion);
    if (!dir || dir.id_usuario !== idUsuario) {
      return false;
    }
    return this.memoriaDirecciones.delete(idDireccion);
  }

  /**
   * Desmarca la condición de predeterminada en todas las direcciones del usuario (CA-CUE-07-02).
   */
  async desmarcarPredeterminadas(idUsuario: number): Promise<void> {
    if (this.db) {
      await this.db
        .updateTable('direccion_cliente')
        .set({ es_predeterminada: false, fecha_actualizacion: sql`NOW()` })
        .where('id_usuario', '=', idUsuario)
        .execute();
      return;
    }

    for (const [id, dir] of this.memoriaDirecciones.entries()) {
      if (dir.id_usuario === idUsuario && dir.es_predeterminada) {
        this.memoriaDirecciones.set(id, {
          ...dir,
          es_predeterminada: false,
          fecha_actualizacion: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Marca una dirección específica como predeterminada y desmarca las restantes.
   */
  async marcarPredeterminada(idDireccion: string, idUsuario: number): Promise<boolean> {
    if (this.db) {
      const existente = await this.buscarPorId(idDireccion);
      if (!existente || existente.id_usuario !== idUsuario) {
        return false;
      }

      await this.desmarcarPredeterminadas(idUsuario);

      const res = await this.db
        .updateTable('direccion_cliente')
        .set({ es_predeterminada: true, fecha_actualizacion: sql`NOW()` })
        .where('id_direccion', '=', idDireccion)
        .where('id_usuario', '=', idUsuario)
        .executeTakeFirst();

      return Number(res.numUpdatedRows) > 0;
    }

    const dir = this.memoriaDirecciones.get(idDireccion);
    if (!dir || dir.id_usuario !== idUsuario) {
      return false;
    }

    await this.desmarcarPredeterminadas(idUsuario);
    this.memoriaDirecciones.set(idDireccion, {
      ...dir,
      es_predeterminada: true,
      fecha_actualizacion: new Date().toISOString(),
    });
    return true;
  }
}
