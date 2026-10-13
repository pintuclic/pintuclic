import { Kysely } from 'kysely';
import { Database, Base } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE COLOR_BASE (HU-CAT-12 flujo 3)
// Combinaciones declaradas color↔base sobre las que puede prepararse un color.
// ==============================================================================

export class ColorBasesRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async asignar(idColor: number, idBase: number): Promise<void> {
    await this.db.insertInto('color_base').values({ id_color: idColor, id_base: idBase }).execute();
  }

  async quitar(idColor: number, idBase: number): Promise<void> {
    await this.db.deleteFrom('color_base').where('id_color', '=', idColor).where('id_base', '=', idBase).execute();
  }

  async existe(idColor: number, idBase: number): Promise<boolean> {
    const fila = await this.db
      .selectFrom('color_base')
      .select('id_base')
      .where('id_color', '=', idColor)
      .where('id_base', '=', idBase)
      .executeTakeFirst();
    return fila !== undefined;
  }

  /** Bases declaradas para el color (join a `base`). */
  async listarBases(idColor: number): Promise<Base[]> {
    return this.db
      .selectFrom('color_base')
      .innerJoin('base', 'base.id_base', 'color_base.id_base')
      .selectAll('base')
      .where('color_base.id_color', '=', idColor)
      .orderBy('base.nombre', 'asc')
      .execute();
  }
}
