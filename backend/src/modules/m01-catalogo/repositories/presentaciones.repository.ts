import { Kysely } from 'kysely';
import { Database, Presentacion, NewPresentacion, PresentacionUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE PRESENTACIONES
// Único punto de acceso SQL (Kysely) para la tabla `presentacion`.
// ==============================================================================

export class PresentacionesRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewPresentacion): Promise<Presentacion> {
    return this.db.insertInto('presentacion').values(data).returningAll().executeTakeFirstOrThrow();
  }

  async listar(): Promise<Presentacion[]> {
    return this.db.selectFrom('presentacion').selectAll().orderBy('volumen', 'asc').execute();
  }

  async obtenerPorId(id: number): Promise<Presentacion | undefined> {
    return this.db.selectFrom('presentacion').selectAll().where('id_presentacion', '=', id).executeTakeFirst();
  }

  async obtenerPorNombre(nombre: string, excluirId?: number): Promise<Presentacion | undefined> {
    let query = this.db.selectFrom('presentacion').selectAll().where('nombre', '=', nombre);
    if (excluirId !== undefined) {
      query = query.where('id_presentacion', '!=', excluirId);
    }
    return query.executeTakeFirst();
  }

  async actualizar(id: number, data: PresentacionUpdate): Promise<Presentacion | undefined> {
    return this.db
      .updateTable('presentacion')
      .set(data)
      .where('id_presentacion', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db.updateTable('presentacion').set({ estado }).where('id_presentacion', '=', id).execute();
  }
}
