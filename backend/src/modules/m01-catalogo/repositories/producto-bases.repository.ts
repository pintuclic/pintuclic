import { Kysely } from 'kysely';
import { Database, Base } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE PRODUCTO_BASE (HU-CAT-12 flujo 2)
// Bases declaradas que ofrece un producto entonable.
// ==============================================================================

export class ProductoBasesRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async asignar(idProducto: number, idBase: number): Promise<void> {
    await this.db.insertInto('producto_base').values({ id_producto: idProducto, id_base: idBase }).execute();
  }

  async quitar(idProducto: number, idBase: number): Promise<void> {
    await this.db
      .deleteFrom('producto_base')
      .where('id_producto', '=', idProducto)
      .where('id_base', '=', idBase)
      .execute();
  }

  async existe(idProducto: number, idBase: number): Promise<boolean> {
    const fila = await this.db
      .selectFrom('producto_base')
      .select('id_base')
      .where('id_producto', '=', idProducto)
      .where('id_base', '=', idBase)
      .executeTakeFirst();
    return fila !== undefined;
  }

  /** Bases declaradas por el producto (join a `base`). */
  async listarBases(idProducto: number): Promise<Base[]> {
    return this.db
      .selectFrom('producto_base')
      .innerJoin('base', 'base.id_base', 'producto_base.id_base')
      .selectAll('base')
      .where('producto_base.id_producto', '=', idProducto)
      .orderBy('base.nombre', 'asc')
      .execute();
  }

  /** Variantes del producto que usan esa base (para impedir quitar una base en uso). */
  async contarVariantesConBase(idProducto: number, idBase: number): Promise<number> {
    const fila = await this.db
      .selectFrom('variante')
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .where('id_producto', '=', idProducto)
      .where('id_base', '=', idBase)
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }
}
