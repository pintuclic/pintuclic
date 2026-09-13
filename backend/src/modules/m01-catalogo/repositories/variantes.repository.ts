import { Kysely } from 'kysely';
import { Database, Variante, NewVariante, VarianteUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE VARIANTES
// Único punto de acceso SQL (Kysely) para la tabla `variante`.
// ==============================================================================

export class VariantesRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewVariante): Promise<Variante> {
    return this.db.insertInto('variante').values(data).returningAll().executeTakeFirstOrThrow();
  }

  async listarPorProducto(idProducto: number): Promise<Variante[]> {
    return this.db
      .selectFrom('variante')
      .selectAll()
      .where('id_producto', '=', idProducto)
      .orderBy('id_variante', 'asc')
      .execute();
  }

  async obtenerPorId(id: number): Promise<Variante | undefined> {
    return this.db.selectFrom('variante').selectAll().where('id_variante', '=', id).executeTakeFirst();
  }

  /** RF-CAT-03-06 / CA-CAT-03-08: unicidad del código de proveedor (SAMIT). */
  async obtenerPorCodigoProveedor(codigo: string, excluirId?: number): Promise<Variante | undefined> {
    let query = this.db.selectFrom('variante').selectAll().where('codigo_proveedor', '=', codigo);
    if (excluirId !== undefined) {
      query = query.where('id_variante', '!=', excluirId);
    }
    return query.executeTakeFirst();
  }

  /** RF-CAT-03-03 / CA-CAT-03-02: detecta una variante con la misma forma (producto+base+color+presentación). */
  async existeForma(
    idProducto: number,
    idBase: number | null,
    idColor: number | null,
    idPresentacion: number,
    excluirId?: number
  ): Promise<boolean> {
    let query = this.db
      .selectFrom('variante')
      .select('id_variante')
      .where('id_producto', '=', idProducto)
      .where('id_presentacion', '=', idPresentacion);
    query = idBase === null ? query.where('id_base', 'is', null) : query.where('id_base', '=', idBase);
    query = idColor === null ? query.where('id_color', 'is', null) : query.where('id_color', '=', idColor);
    if (excluirId !== undefined) {
      query = query.where('id_variante', '!=', excluirId);
    }
    return (await query.executeTakeFirst()) !== undefined;
  }

  async actualizar(id: number, data: VarianteUpdate): Promise<Variante | undefined> {
    return this.db
      .updateTable('variante')
      .set(data)
      .where('id_variante', '=', id)
      .returningAll()
      .executeTakeFirst();
  }

  async cambiarEstado(id: number, estado: 'activo' | 'inactivo'): Promise<void> {
    await this.db.updateTable('variante').set({ estado }).where('id_variante', '=', id).execute();
  }
}
