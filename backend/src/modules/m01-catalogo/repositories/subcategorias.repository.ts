import { Kysely } from 'kysely';
import { dejaDeVerse } from './elegibilidad-publica';
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
   * RF-CAT-01-04 / CA-CAT-01-06: productos que dejarán de verse si esta
   * subcategoría se desactiva; los que conservan otra clasificación activa
   * siguen visibles (M01-02).
   */
  async contarProductosAfectados(idSubcategoria: number): Promise<number> {
    const fila = await this.db
      .selectFrom('producto as p')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where((eb) => dejaDeVerse(eb, { idSubcategoria }))
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }
}
