import { Kysely } from 'kysely';
import { Database, TipoResina, NewTipoResina, TipoResinaUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE TIPOS DE RESINA
// Único punto de acceso SQL (Kysely) para la tabla `tipo_resina`.
// ==============================================================================

export class TipoResinasRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewTipoResina): Promise<TipoResina> {
    return this.db.insertInto('tipo_resina').values(data).returningAll().executeTakeFirstOrThrow();
  }

  async listar(): Promise<TipoResina[]> {
    return this.db.selectFrom('tipo_resina').selectAll().orderBy('nombre', 'asc').execute();
  }

  async obtenerPorId(id: number): Promise<TipoResina | undefined> {
    return this.db.selectFrom('tipo_resina').selectAll().where('id_tipo_resina', '=', id).executeTakeFirst();
  }

  async obtenerPorNombre(nombre: string, excluirId?: number): Promise<TipoResina | undefined> {
    let query = this.db.selectFrom('tipo_resina').selectAll().where('nombre', '=', nombre);
    if (excluirId !== undefined) {
      query = query.where('id_tipo_resina', '!=', excluirId);
    }
    return query.executeTakeFirst();
  }

  async actualizar(id: number, data: TipoResinaUpdate): Promise<TipoResina | undefined> {
    return this.db
      .updateTable('tipo_resina')
      .set(data)
      .where('id_tipo_resina', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db.updateTable('tipo_resina').set({ estado }).where('id_tipo_resina', '=', id).execute();
  }
}
