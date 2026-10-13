import { Kysely, sql } from 'kysely';
import { Database, Combo } from '../../../core/db/types';
import { ComponenteCombo, LineaExistencia } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - REPOSITORIO DE COMBOS (HU-CAT-13)
// Único punto de acceso SQL a `combo` y `variante_combo`, y a la existencia de
// las variantes de un combo. Las operaciones de existencia reciben el ejecutor
// para poder correr dentro de la transacción de quien las invoca (M08).
// ==============================================================================

/** Conexión o transacción sobre la que operan las reservas de existencia. */
export type EjecutorCatalogo = Kysely<Database>;

export class CombosRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async obtenerPorProducto(idProducto: number): Promise<Combo | undefined> {
    return this.db.selectFrom('combo').selectAll().where('id_producto', '=', idProducto).executeTakeFirst();
  }

  async listarComponentes(idCombo: number): Promise<ComponenteCombo[]> {
    return this.db
      .selectFrom('variante_combo')
      .select(['id_variante', 'cantidad'])
      .where('id_combo', '=', idCombo)
      .orderBy('id_variante', 'asc')
      .execute();
  }

  /**
   * RF-CAT-13-01: marca el producto como combo (o actualiza el existente; la
   * restricción uq_combo_producto garantiza uno por producto) y reemplaza sus
   * componentes.
   */
  async definir(idProducto: number, excluidoDescuentos: boolean, componentes: readonly ComponenteCombo[]): Promise<Combo> {
    return this.db.transaction().execute(async (trx) => {
      const combo = await trx
        .insertInto('combo')
        .values({ id_producto: idProducto, excluido_descuentos: excluidoDescuentos })
        .onConflict((oc) => oc.column('id_producto').doUpdateSet({ excluido_descuentos: excluidoDescuentos }))
        .returningAll()
        .executeTakeFirstOrThrow();

      await trx.deleteFrom('variante_combo').where('id_combo', '=', combo.id_combo).execute();
      if (componentes.length > 0) {
        await trx
          .insertInto('variante_combo')
          .values(componentes.map((c) => ({ id_combo: combo.id_combo, id_variante: c.id_variante, cantidad: c.cantidad })))
          .execute();
      }
      return combo;
    });
  }

  /**
   * RF-CAT-13-02/03 / CA-CAT-13-05: descuenta las unidades de las líneas que
   * pertenecen a un combo; las demás variantes se venden sin control de
   * existencia. Cada UPDATE es condicional y bloquea la fila, de modo que dos
   * compras simultáneas de la última unidad no pueden completarse ambas.
   *
   * Con `ejecutor` (la transacción de la orden) opera dentro de ella y quien la
   * abrió debe revertirla si esta función informa un faltante. Sin `ejecutor`
   * abre su propia transacción y la revierte por completo ante un faltante.
   *
   * @returns el id de la primera variante sin unidades suficientes, o null.
   */
  async reservar(lineas: readonly LineaExistencia[], ejecutor?: EjecutorCatalogo): Promise<number | null> {
    if (ejecutor) return this.descontarLineas(lineas, ejecutor);
    try {
      await this.db.transaction().execute(async (trx) => {
        const faltante = await this.descontarLineas(lineas, trx);
        if (faltante !== null) throw new ExistenciaInsuficiente(faltante);
      });
      return null;
    } catch (error) {
      if (error instanceof ExistenciaInsuficiente) return error.idVariante;
      throw error;
    }
  }

  /** CA-CAT-13-07: devuelve a los combos las unidades de una orden cancelada. */
  async liberar(lineas: readonly LineaExistencia[], ejecutor: EjecutorCatalogo = this.db): Promise<void> {
    const deCombo = await this.variantesDeCombo(lineas, ejecutor);
    for (const linea of lineas.filter((l) => deCombo.has(l.id_variante))) {
      await ejecutor
        .updateTable('variante')
        .set({ existencia_referencial: sql`existencia_referencial + ${linea.cantidad}` })
        .where('id_variante', '=', linea.id_variante)
        .execute();
    }
  }

  private async descontarLineas(lineas: readonly LineaExistencia[], ejecutor: EjecutorCatalogo): Promise<number | null> {
    const deCombo = await this.variantesDeCombo(lineas, ejecutor);
    for (const linea of lineas.filter((l) => deCombo.has(l.id_variante))) {
      const resultado = await ejecutor
        .updateTable('variante')
        .set({ existencia_referencial: sql`existencia_referencial - ${linea.cantidad}` })
        .where('id_variante', '=', linea.id_variante)
        .where('existencia_referencial', '>=', linea.cantidad)
        .executeTakeFirst();
      if (resultado.numUpdatedRows === 0n) return linea.id_variante;
    }
    return null;
  }

  /** Variantes de las líneas que pertenecen a un producto combo (las únicas con existencia controlada). */
  private async variantesDeCombo(lineas: readonly LineaExistencia[], ejecutor: EjecutorCatalogo): Promise<Set<number>> {
    if (lineas.length === 0) return new Set();
    const filas = await ejecutor
      .selectFrom('variante as v')
      .innerJoin('combo as c', 'c.id_producto', 'v.id_producto')
      .select('v.id_variante')
      .where('v.id_variante', 'in', lineas.map((l) => l.id_variante))
      .execute();
    return new Set(filas.map((f) => f.id_variante));
  }
}

/** Señal interna para revertir la transacción propia de `reservar`. */
class ExistenciaInsuficiente extends Error {
  constructor(readonly idVariante: number) {
    super(`Existencia insuficiente para la variante ${idVariante}`);
  }
}
