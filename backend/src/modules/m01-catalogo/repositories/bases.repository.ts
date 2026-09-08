import { Kysely } from 'kysely';
import { Database, Base, NewBase, BaseUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE BASES
// Único punto de acceso SQL (Kysely) para la tabla `base`.
// ==============================================================================

export class BasesRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewBase): Promise<Base> {
    return this.db.insertInto('base').values(data).returningAll().executeTakeFirstOrThrow();
  }

  async listarPorMarca(idMarca: number): Promise<Base[]> {
    return this.db
      .selectFrom('base')
      .selectAll()
      .where('id_marca', '=', idMarca)
      .orderBy('nombre', 'asc')
      .execute();
  }

  async obtenerPorId(id: number): Promise<Base | undefined> {
    return this.db.selectFrom('base').selectAll().where('id_base', '=', id).executeTakeFirst();
  }

  /** RF-CAT-12-01: unicidad del nombre/código dentro de la misma marca. */
  async obtenerPorNombreYMarca(nombre: string, idMarca: number, excluirId?: number): Promise<Base | undefined> {
    let query = this.db
      .selectFrom('base')
      .selectAll()
      .where('nombre', '=', nombre)
      .where('id_marca', '=', idMarca);
    if (excluirId !== undefined) {
      query = query.where('id_base', '!=', excluirId);
    }
    return query.executeTakeFirst();
  }

  async actualizar(id: number, data: BaseUpdate): Promise<Base | undefined> {
    return this.db
      .updateTable('base')
      .set(data)
      .where('id_base', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db.updateTable('base').set({ estado }).where('id_base', '=', id).execute();
  }

  /** RF-CAT-04-03: desactiva en cascada todas las bases activas de una marca. */
  async desactivarBasesDeMarca(idMarca: number): Promise<void> {
    await this.db.updateTable('base').set({ estado: 'inactivo' }).where('id_marca', '=', idMarca).execute();
  }
}
