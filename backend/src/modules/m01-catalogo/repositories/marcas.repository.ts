import { Kysely } from 'kysely';
import { Database, Marca } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE MARCAS (versión mínima)
// Solo lo que HU-CAT-11 necesita para validar que una línea se asocie a una marca
// existente. El CRUD completo de marcas se agrega al implementar HU-CAT-04.
// ==============================================================================

export class MarcasRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async obtenerPorId(id: number): Promise<Marca | undefined> {
    return this.db
      .selectFrom('marca')
      .selectAll()
      .where('id_marca', '=', id)
      .executeTakeFirst();
  }
}
