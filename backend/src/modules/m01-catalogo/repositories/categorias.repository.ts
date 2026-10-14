import { Kysely } from 'kysely';
import { dejaDeVerse } from './elegibilidad-publica';
import { Database, Categoria, NewCategoria, CategoriaUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE CATEGORÍAS
// Único punto de acceso SQL (Kysely) para la tabla `categoria`.
// ==============================================================================

export class CategoriasRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewCategoria): Promise<Categoria> {
    return this.db
      .insertInto('categoria')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async listar(): Promise<Categoria[]> {
    return this.db
      .selectFrom('categoria')
      .selectAll()
      .orderBy('orden', 'asc')
      .orderBy('id_categoria', 'asc')
      .execute();
  }

  async obtenerPorId(id: number): Promise<Categoria | undefined> {
    return this.db
      .selectFrom('categoria')
      .selectAll()
      .where('id_categoria', '=', id)
      .executeTakeFirst();
  }

  /** RF-CAT-01-03: unicidad del nombre a nivel raíz. */
  async obtenerPorNombre(nombre: string, excluirId?: number): Promise<Categoria | undefined> {
    let query = this.db.selectFrom('categoria').selectAll().where('nombre', '=', nombre);
    if (excluirId !== undefined) {
      query = query.where('id_categoria', '!=', excluirId);
    }
    return query.executeTakeFirst();
  }

  async actualizar(id: number, data: CategoriaUpdate): Promise<Categoria | undefined> {
    return this.db
      .updateTable('categoria')
      .set(data)
      .where('id_categoria', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db
      .updateTable('categoria')
      .set({ estado })
      .where('id_categoria', '=', id)
      .execute();
  }

  /** Cuenta las subcategorías activas que quedarán desactivadas en cascada. */
  async contarSubcategoriasActivas(idCategoria: number): Promise<number> {
    const fila = await this.db
      .selectFrom('subcategorias')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where('id_categoria', '=', idCategoria)
      .where('estado', '=', 'activo')
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }

  /**
   * RF-CAT-01-04 / CA-CAT-01-05: productos que dejarán de verse en el catálogo
   * público si esta categoría y sus subcategorías se desactivan (M01-02).
   */
  async contarProductosAfectados(idCategoria: number): Promise<number> {
    const fila = await this.db
      .selectFrom('producto as p')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where((eb) => dejaDeVerse(eb, { idCategoria }))
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }


  /** Desactiva en cascada todas las subcategorías activas de la categoría (RF-CAT-01-04). */
  async desactivarSubcategoriasDe(idCategoria: number): Promise<void> {
    await this.db
      .updateTable('subcategorias')
      .set({ estado: 'inactivo' })
      .where('id_categoria', '=', idCategoria)
      .execute();
  }
}
