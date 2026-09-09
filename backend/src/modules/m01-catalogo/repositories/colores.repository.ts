import { Kysely } from 'kysely';
import { Database, Color, NewColor, ColorUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE COLORES
// Único punto de acceso SQL (Kysely) para la tabla `color`.
// ==============================================================================

export class ColoresRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewColor): Promise<Color> {
    return this.db.insertInto('color').values(data).returningAll().executeTakeFirstOrThrow();
  }

  /** RF-CAT-05-01: lista los colores de una marca; búsqueda opcional por nombre o código. */
  async listarPorMarca(idMarca: number, busqueda?: string): Promise<Color[]> {
    let query = this.db.selectFrom('color').selectAll().where('id_marca', '=', idMarca);
    if (busqueda) {
      const patron = `%${busqueda}%`;
      query = query.where((eb) => eb.or([eb('nombre', 'ilike', patron), eb('codigo', 'ilike', patron)]));
    }
    return query.orderBy('nombre', 'asc').execute();
  }

  async obtenerPorId(id: number): Promise<Color | undefined> {
    return this.db.selectFrom('color').selectAll().where('id_color', '=', id).executeTakeFirst();
  }

  /** RF-CAT-05-01 / CA-CAT-05-01: unicidad del nombre dentro de la misma marca. */
  async obtenerPorNombreYMarca(nombre: string, idMarca: number, excluirId?: number): Promise<Color | undefined> {
    let query = this.db
      .selectFrom('color')
      .selectAll()
      .where('nombre', '=', nombre)
      .where('id_marca', '=', idMarca);
    if (excluirId !== undefined) {
      query = query.where('id_color', '!=', excluirId);
    }
    return query.executeTakeFirst();
  }

  async actualizar(id: number, data: ColorUpdate): Promise<Color | undefined> {
    return this.db.updateTable('color').set(data).where('id_color', '=', id).returningAll().executeTakeFirst();
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db.updateTable('color').set({ estado }).where('id_color', '=', id).execute();
  }

  /** RF-CAT-04-03: desactiva en cascada todos los colores de una marca. */
  async desactivarColoresDeMarca(idMarca: number): Promise<void> {
    await this.db.updateTable('color').set({ estado: 'inactivo' }).where('id_marca', '=', idMarca).execute();
  }
}
