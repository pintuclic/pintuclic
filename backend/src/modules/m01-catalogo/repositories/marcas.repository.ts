import { Kysely } from 'kysely';
import { Database, NewMarca, MarcaUpdate } from '../../../core/db/types';
import { MarcaResumen, MarcaLogotipo } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - REPOSITORIO DE MARCAS (HU-CAT-04)
// El logotipo (BYTEA) nunca viaja en listados ni fichas: se sirve aparte
// (`obtenerLogotipo`) para no inflar las respuestas JSON del catálogo.
// ==============================================================================

const COLUMNAS_RESUMEN = ['id_marca', 'nombre', 'logotipo_mime_type', 'estado'] as const;

export class MarcasRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewMarca): Promise<MarcaResumen> {
    return this.db
      .insertInto('marca')
      .values(data)
      .returning(COLUMNAS_RESUMEN)
      .executeTakeFirstOrThrow();
  }

  async listar(): Promise<MarcaResumen[]> {
    return this.db.selectFrom('marca').select(COLUMNAS_RESUMEN).orderBy('nombre', 'asc').execute();
  }

  async obtenerPorId(id: number): Promise<MarcaResumen | undefined> {
    return this.db
      .selectFrom('marca')
      .select(COLUMNAS_RESUMEN)
      .where('id_marca', '=', id)
      .executeTakeFirst();
  }

  /** RF-CAT-04-02: unicidad del nombre de marca. */
  async obtenerPorNombre(nombre: string, excluirId?: number): Promise<MarcaResumen | undefined> {
    let query = this.db.selectFrom('marca').select(COLUMNAS_RESUMEN).where('nombre', '=', nombre);
    if (excluirId !== undefined) {
      query = query.where('id_marca', '!=', excluirId);
    }
    return query.executeTakeFirst();
  }

  async obtenerLogotipo(id: number): Promise<MarcaLogotipo | undefined> {
    return this.db
      .selectFrom('marca')
      .select(['logotipo', 'logotipo_mime_type'])
      .where('id_marca', '=', id)
      .executeTakeFirst();
  }

  async actualizar(id: number, data: MarcaUpdate): Promise<MarcaResumen | undefined> {
    return this.db
      .updateTable('marca')
      .set(data)
      .where('id_marca', '=', id)
      .returning(COLUMNAS_RESUMEN)
      .executeTakeFirst();
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db.updateTable('marca').set({ estado }).where('id_marca', '=', id).execute();
  }

  /**
   * RF-CAT-04-03: desactiva la marca y, en cascada, sus líneas, bases, colores,
   * productos y las variantes de esos productos, todo en una sola transacción
   * para no dejar cambios parciales si una escritura falla.
   */
  async desactivarEnCascada(id: number): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx.updateTable('marca').set({ estado: 'inactivo' }).where('id_marca', '=', id).execute();
      await trx.updateTable('linea').set({ estado: 'inactivo' }).where('id_marca', '=', id).execute();
      await trx.updateTable('base').set({ estado: 'inactivo' }).where('id_marca', '=', id).execute();
      await trx.updateTable('color').set({ estado: 'inactivo' }).where('id_marca', '=', id).execute();
      await trx.updateTable('producto').set({ estado: 'inactivo' }).where('id_marca', '=', id).execute();
    });
  }
}
