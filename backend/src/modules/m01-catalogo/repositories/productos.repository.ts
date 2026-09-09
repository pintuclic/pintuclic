import { Kysely } from 'kysely';
import { Database, Producto, NewProducto, ProductoUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE PRODUCTOS
// Único punto de acceso SQL (Kysely) para `producto` y su relación N:M con
// subcategorías (`producto_subcategoria`).
// ==============================================================================

export class ProductosRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /** Crea el producto y sus subcategorías en una sola transacción (RF-CAT-02-02). */
  async crear(data: NewProducto, idSubcategorias: number[]): Promise<Producto> {
    return this.db.transaction().execute(async (trx) => {
      const producto = await trx.insertInto('producto').values(data).returningAll().executeTakeFirstOrThrow();
      await trx
        .insertInto('producto_subcategoria')
        .values(idSubcategorias.map((id) => ({ id_producto: producto.id_producto, id_subcategoria: id })))
        .execute();
      return producto;
    });
  }

  /** RF-CAT-02-01: consulta y búsqueda de productos (por nombre y/o marca). */
  async listar(filtros?: { busqueda?: string; idMarca?: number }): Promise<Producto[]> {
    let query = this.db.selectFrom('producto').selectAll();
    if (filtros?.idMarca !== undefined) {
      query = query.where('id_marca', '=', filtros.idMarca);
    }
    if (filtros?.busqueda) {
      query = query.where('nombre', 'ilike', `%${filtros.busqueda}%`);
    }
    return query.orderBy('nombre', 'asc').execute();
  }

  async obtenerPorId(id: number): Promise<Producto | undefined> {
    return this.db.selectFrom('producto').selectAll().where('id_producto', '=', id).executeTakeFirst();
  }

  async listarSubcategorias(idProducto: number): Promise<number[]> {
    const filas = await this.db
      .selectFrom('producto_subcategoria')
      .select('id_subcategoria')
      .where('id_producto', '=', idProducto)
      .orderBy('id_subcategoria', 'asc')
      .execute();
    return filas.map((f) => f.id_subcategoria);
  }

  /** Actualiza el producto y, si se indican, reemplaza sus subcategorías (transacción). */
  async actualizar(id: number, data: ProductoUpdate, idSubcategorias?: number[]): Promise<Producto | undefined> {
    return this.db.transaction().execute(async (trx) => {
      let producto: Producto | undefined;
      if (Object.keys(data).length > 0) {
        producto = await trx
          .updateTable('producto')
          .set(data)
          .where('id_producto', '=', id)
          .returningAll()
          .executeTakeFirst();
      } else {
        producto = await trx.selectFrom('producto').selectAll().where('id_producto', '=', id).executeTakeFirst();
      }
      if (!producto) return undefined;

      if (idSubcategorias !== undefined) {
        await trx.deleteFrom('producto_subcategoria').where('id_producto', '=', id).execute();
        await trx
          .insertInto('producto_subcategoria')
          .values(idSubcategorias.map((sc) => ({ id_producto: id, id_subcategoria: sc })))
          .execute();
      }
      return producto;
    });
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db.updateTable('producto').set({ estado }).where('id_producto', '=', id).execute();
  }

  async cambiarPublicado(id: number, publicado: boolean): Promise<void> {
    await this.db.updateTable('producto').set({ publicado }).where('id_producto', '=', id).execute();
  }

  /** RF-CAT-02-03: cuántas variantes tiene el producto (para bloquear el cambio de clase). */
  async contarVariantes(idProducto: number): Promise<number> {
    const fila = await this.db
      .selectFrom('variante')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where('id_producto', '=', idProducto)
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }

  /** RF-CAT-02-05: cuántas variantes activas tiene el producto (para poder publicarlo). */
  async contarVariantesActivas(idProducto: number): Promise<number> {
    const fila = await this.db
      .selectFrom('variante')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where('id_producto', '=', idProducto)
      .where('estado', '=', 'activo')
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }

  /** RF-CAT-09-03: imágenes del producto (aviso de impacto). */
  async contarImagenes(idProducto: number): Promise<number> {
    const fila = await this.db
      .selectFrom('imagen')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where('id_producto', '=', idProducto)
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }

  /** RF-CAT-09-03: productos activos de una marca (aviso de impacto). */
  async contarActivosPorMarca(idMarca: number): Promise<number> {
    const fila = await this.db
      .selectFrom('producto')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where('id_marca', '=', idMarca)
      .where('estado', '=', 'activo')
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }

  /** RF-CAT-04-03: desactiva en cascada todos los productos de una marca. */
  async desactivarProductosDeMarca(idMarca: number): Promise<void> {
    await this.db.updateTable('producto').set({ estado: 'inactivo' }).where('id_marca', '=', idMarca).execute();
  }
}
