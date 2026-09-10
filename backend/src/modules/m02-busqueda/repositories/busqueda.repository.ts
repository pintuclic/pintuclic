import { Kysely, sql, SqlBool, RawBuilder } from 'kysely';
import { Database, EnumClaseColor } from '../../../core/db/types';

// ==============================================================================
// M02 - REPOSITORIO DE BÚSQUEDA (HU-BUS-01)
// Búsqueda en servidor (RF-BUS-01-02), sin autenticación, sobre productos
// activos+publicados. Insensible a mayúsculas y acentos y tolerante a errores
// tipográficos (RF-BUS-01-03) usando `unaccent` + `pg_trgm` (word_similarity).
// El producto aparece una sola vez porque se filtra la tabla `producto` con
// subconsultas EXISTS, sin joins que multipliquen filas (RF-BUS-01-04).
//
// PRERREQUISITO DE BD (global, fuera de este módulo): las extensiones
// `unaccent` y `pg_trgm` deben estar habilitadas. Ver walkthrough M02.
// ==============================================================================

// ponytail: umbral de similitud fijo (0.3). Si arroja demasiados/pocos falsos
// positivos, exponerlo como config del módulo, no como constante mágica.
const UMBRAL_SIMILITUD = 0.3;

export interface FilaProductoBusqueda {
  id_producto: number;
  nombre: string;
  id_marca: number;
  clase_color: EnumClaseColor;
}

export class BusquedaRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /** Productos que coinciden con el término, paginados. Término vacío => catálogo completo. */
  async buscar(termino: string | undefined, limite: number, offset: number): Promise<FilaProductoBusqueda[]> {
    let q = this.base(termino).select(['p.id_producto', 'p.nombre', 'p.id_marca', 'p.clase_color']);
    // Con término: relevancia por nombre desc y desempate estable por nombre (base para HU-BUS-03).
    // Sin término: catálogo completo ordenado alfabéticamente.
    q = termino
      ? q.orderBy(this.relevanciaNombre(termino), 'desc').orderBy('p.nombre', 'asc')
      : q.orderBy('p.nombre', 'asc');
    return q.limit(limite).offset(offset).execute();
  }

  async contar(termino: string | undefined): Promise<number> {
    const fila = await this.base(termino)
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }

  private base(termino: string | undefined) {
    const q = this.db.selectFrom('producto as p').where('p.estado', '=', 'activo').where('p.publicado', '=', true);
    return termino ? q.where(this.predicado(termino)) : q;
  }

  private relevanciaNombre(t: string): RawBuilder<number> {
    return sql<number>`word_similarity(unaccent(lower(${t})), unaccent(lower(p.nombre)))`;
  }

  /**
   * Coincidencia sobre nombre, descripción, marca, línea y color (RF-BUS-01-03).
   * En color incluye tanto los preparados (variante con ese color) como los
   * entonables (producto entonable cuyo color existe en la carta de su marca),
   * cumpliendo RF-BUS-01-05.
   */
  private predicado(t: string): RawBuilder<SqlBool> {
    const coincide = (col: RawBuilder<unknown>): RawBuilder<unknown> => sql`(
      unaccent(lower(${col})) ilike '%' || unaccent(lower(${t})) || '%'
      or word_similarity(unaccent(lower(${t})), unaccent(lower(${col}))) >= ${UMBRAL_SIMILITUD}
    )`;

    return sql<SqlBool>`(
      ${coincide(sql.ref('p.nombre'))}
      or ${coincide(sql.ref('p.descripcion'))}
      or exists (
        select 1 from marca m
        where m.id_marca = p.id_marca and ${coincide(sql.ref('m.nombre'))}
      )
      or exists (
        select 1 from linea l
        where l.id_linea = p.id_linea and ${coincide(sql.ref('l.nombre'))}
      )
      or exists (
        select 1 from variante v
        join color c on c.id_color = v.id_color
        where v.id_producto = p.id_producto and v.estado = 'activo'
          and ${coincide(sql.ref('c.nombre'))}
      )
      or (
        p.clase_color = 'entonable' and exists (
          select 1 from color c2
          where c2.id_marca = p.id_marca and c2.estado = 'activo'
            and ${coincide(sql.ref('c2.nombre'))}
        )
      )
    )`;
  }
}
