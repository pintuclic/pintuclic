import { Kysely } from 'kysely';
import { Database, Subcategoria, NewSubcategoria, SubcategoriaUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE SUBCATEGORÍAS
// Único punto de acceso SQL (Kysely) para la tabla `subcategorias`.
// ==============================================================================

export class SubcategoriasRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewSubcategoria): Promise<Subcategoria> {
    return this.db
      .insertInto('subcategorias')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async listarPorCategoria(idCategoria: number): Promise<Subcategoria[]> {
    return this.db
      .selectFrom('subcategorias')
      .selectAll()
      .where('id_categoria', '=', idCategoria)
      .orderBy('orden', 'asc')
      .orderBy('id_subcategoria', 'asc')
      .execute();
  }

  async obtenerPorId(id: number): Promise<Subcategoria | undefined> {
    return this.db
      .selectFrom('subcategorias')
      .selectAll()
      .where('id_subcategoria', '=', id)
      .executeTakeFirst();
  }

  /** RF-CAT-01-03: unicidad del nombre bajo la misma categoría padre (no entre padres distintos). */
  async obtenerPorNombreYCategoria(
    nombre: string,
    idCategoria: number,
    excluirId?: number
  ): Promise<Subcategoria | undefined> {
    let query = this.db
      .selectFrom('subcategorias')
      .selectAll()
      .where('nombre', '=', nombre)
      .where('id_categoria', '=', idCategoria);
    if (excluirId !== undefined) {
      query = query.where('id_subcategoria', '!=', excluirId);
    }
    return query.executeTakeFirst();
  }

  async actualizar(id: number, data: SubcategoriaUpdate): Promise<Subcategoria | undefined> {
    return this.db
      .updateTable('subcategorias')
      .set(data)
      .where('id_subcategoria', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db
      .updateTable('subcategorias')
      .set({ estado })
      .where('id_subcategoria', '=', id)
      .execute();
  }

  /**
   * Cuenta los productos activos que dejarán de verse si esta subcategoría se
   * desactiva (RF-CAT-01-04, CA-CAT-01-06): los clasificados en ella
   * (producto_subcategoria) que no conservan otra subcategoría activa bajo una
   * categoría activa.
   */
  async contarProductosAfectados(idSubcategoria: number): Promise<number> {
    const fila = await this.db
      .selectFrom('producto_subcategoria as ps')
      .innerJoin('producto as p', 'p.id_producto', 'ps.id_producto')
      .select(({ fn }) => fn.count<string>('ps.id_producto').distinct().as('total'))
      .where('ps.id_subcategoria', '=', idSubcategoria)
      .where('p.estado', '=', 'activo')
      .where((eb) =>
        eb.not(
          eb.exists(
            eb
              .selectFrom('producto_subcategoria as ps2')
              .innerJoin('subcategorias as s2', 's2.id_subcategoria', 'ps2.id_subcategoria')
              .innerJoin('categoria as c2', 'c2.id_categoria', 's2.id_categoria')
              .whereRef('ps2.id_producto', '=', 'ps.id_producto')
              .where('ps2.id_subcategoria', '!=', idSubcategoria)
              .where('s2.estado', '=', 'activo')
              .where('c2.estado', '=', 'activo')
              .select('ps2.id_producto')
          )
        )
      )
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }
}
