import { Kysely, sql } from 'kysely';
import { Database, Color, NewColor, ColorUpdate } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE COLORES
// Único punto de acceso SQL (Kysely) para la tabla `color`, catálogo único del
// sistema (RF-CAT-05-01).
// ==============================================================================

export interface FiltroColores {
  busqueda?: string;
  limite: number;
  offset: number;
}

export class ColoresRepository {
  constructor(private readonly db: Kysely<Database>) {}

  async crear(data: NewColor): Promise<Color> {
    return this.db.insertInto('color').values(data).returningAll().executeTakeFirstOrThrow();
  }

  /** RF-CAT-05-01: página del catálogo, con búsqueda opcional por nombre o código. */
  async listar(filtro: FiltroColores): Promise<{ colores: Color[]; total: number }> {
    const base = this.db.selectFrom('color').where((eb) => {
      if (!filtro.busqueda) return eb.lit(true);
      const patron = `%${filtro.busqueda}%`;
      return eb.or([eb('nombre', 'ilike', patron), eb('codigo', 'ilike', patron)]);
    });
    const [colores, conteo] = await Promise.all([
      base.selectAll().orderBy('nombre', 'asc').orderBy('id_color', 'asc').limit(filtro.limite).offset(filtro.offset).execute(),
      base.select(({ fn }) => fn.countAll<string>().as('total')).executeTakeFirst(),
    ]);
    return { colores, total: Number(conteo?.total ?? 0) };
  }

  async obtenerPorId(id: number): Promise<Color | undefined> {
    return this.db.selectFrom('color').selectAll().where('id_color', '=', id).executeTakeFirst();
  }

  /** RF-CAT-05-01: otro color con el mismo nombre o el mismo código (sin distinguir mayúsculas). */
  async buscarDuplicado(nombre: string, codigo: string | null, excluirId?: number): Promise<Color | undefined> {
    let query = this.db
      .selectFrom('color')
      .selectAll()
      .where((eb) =>
        eb.or([
          eb(sql`lower(nombre)`, '=', nombre.toLowerCase()),
          ...(codigo !== null ? [eb(sql`lower(codigo)`, '=', codigo.toLowerCase())] : []),
        ])
      );
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

  /**
   * RF-CAT-05-05: desactiva el color y sus variantes activas de colores fijos
   * (variante con id_color y sin base) en una sola transacción.
   */
  async desactivarConVariantesFijas(id: number): Promise<void> {
    await this.db.transaction().execute(async (trx) => {
      await trx.updateTable('color').set({ estado: 'inactivo' }).where('id_color', '=', id).execute();
      await trx
        .updateTable('variante')
        .set({ estado: 'inactivo' })
        .where('id_color', '=', id)
        .where('id_base', 'is', null)
        .where('estado', '=', 'activo')
        .execute();
    });
  }
}
