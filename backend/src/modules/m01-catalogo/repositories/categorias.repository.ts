import { Kysely } from 'kysely';
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
   * Cuenta los productos activos que dejarán de verse en el catálogo público si
   * esta categoría se desactiva (RF-CAT-01-04, CA-CAT-01-05/06): los que hoy
   * están en alguna de sus subcategorías activas (producto_subcategoria) y no
   * conservan ninguna otra subcategoría activa bajo otra categoría activa.
   */
  async contarProductosAfectados(idCategoria: number): Promise<number> {
    const fila = await this.db
      .selectFrom('producto as p')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where('p.estado', '=', 'activo')
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('producto_subcategoria as ps')
            .innerJoin('subcategorias as s', 's.id_subcategoria', 'ps.id_subcategoria')
            .whereRef('ps.id_producto', '=', 'p.id_producto')
            .where('s.id_categoria', '=', idCategoria)
            .where('s.estado', '=', 'activo')
            .select('ps.id_producto')
        )
      )
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('producto_subcategoria as ps2')
              .innerJoin('subcategorias as s2', 's2.id_subcategoria', 'ps2.id_subcategoria')
              .innerJoin('categoria as c2', 'c2.id_categoria', 's2.id_categoria')
              .whereRef('ps2.id_producto', '=', 'p.id_producto')
              .where('s2.id_categoria', '!=', idCategoria)
              .where('s2.estado', '=', 'activo')
              .where('c2.estado', '=', 'activo')
              .select('ps2.id_producto')
          )
        )
      )
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
