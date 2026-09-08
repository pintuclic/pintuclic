import { Kysely } from 'kysely';
import { Database, Linea, NewLinea, LineaUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE LÍNEAS COMERCIALES
// Único punto de acceso SQL (Kysely) para la tabla `linea`.
// ==============================================================================

export class LineasRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewLinea): Promise<Linea> {
    return this.db
      .insertInto('linea')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async listarPorMarca(idMarca: number): Promise<Linea[]> {
    return this.db
      .selectFrom('linea')
      .selectAll()
      .where('id_marca', '=', idMarca)
      .orderBy('nombre', 'asc')
      .execute();
  }

  async obtenerPorId(id: number): Promise<Linea | undefined> {
    return this.db
      .selectFrom('linea')
      .selectAll()
      .where('id_linea', '=', id)
      .executeTakeFirst();
  }

  /** RF-CAT-11-02: unicidad del nombre dentro de la misma marca (no entre marcas distintas). */
  async obtenerPorNombreYMarca(nombre: string, idMarca: number, excluirId?: number): Promise<Linea | undefined> {
    let query = this.db
      .selectFrom('linea')
      .selectAll()
      .where('nombre', '=', nombre)
      .where('id_marca', '=', idMarca);
    if (excluirId !== undefined) {
      query = query.where('id_linea', '!=', excluirId);
    }
    return query.executeTakeFirst();
  }

  async actualizar(id: number, data: LineaUpdate): Promise<Linea | undefined> {
    return this.db
      .updateTable('linea')
      .set(data)
      .where('id_linea', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db
      .updateTable('linea')
      .set({ estado })
      .where('id_linea', '=', id)
      .execute();
  }

  /** RF-CAT-11-03: productos que dejarán de verse si esta línea se desactiva. */
  async contarProductosAfectados(idLinea: number): Promise<number> {
    const fila = await this.db
      .selectFrom('producto')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where('id_linea', '=', idLinea)
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }
}
