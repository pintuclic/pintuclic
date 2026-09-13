import { Kysely, sql, SqlBool, RawBuilder } from 'kysely';
import { Database, EnumClaseColor } from '../../../core/db/types';
import { FiltrosBusqueda, OrdenBusqueda, TerminoSinResultado, FacetasBusqueda, FacetaValor } from '../interfaces/m02.interfaces';

interface FilaFaceta {
  id: number;
  nombre: string;
  cantidad: string | number | bigint;
}

// ==============================================================================
// M02 - REPOSITORIO DE BÚSQUEDA Y FILTROS (HU-BUS-01, HU-BUS-02)
// Búsqueda en servidor (RF-BUS-01-02), sin autenticación, sobre productos
// activos+publicados. Insensible a mayúsculas y acentos y tolerante a errores
// tipográficos (RF-BUS-01-03) usando `unaccent` + `pg_trgm` (word_similarity).
// El producto aparece una sola vez porque se filtra la tabla `producto` con
// subconsultas EXISTS, sin joins que multipliquen filas (RF-BUS-01-04 / RF-BUS-02-03).
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

  /** Productos que coinciden con el término y los filtros, ordenados y paginados. */
  async buscar(
    termino: string | undefined,
    filtros: FiltrosBusqueda | undefined,
    orden: OrdenBusqueda,
    limite: number,
    offset: number
  ): Promise<FilaProductoBusqueda[]> {
    let q = this.base(termino, filtros).select(['p.id_producto', 'p.nombre', 'p.id_marca', 'p.clase_color']);

    // ponytail: precio del producto = mínimo de sus variantes activas (precio base).
    // El precio final tras descuentos/IVA y por empresa depende de M06 (CA-BUS-03-05).
    const precioProducto = sql<number>`(
      select min(v.precio_vigente) from variante v
      where v.id_producto = p.id_producto and v.estado = 'activo'
    )`;

    // Todos los criterios cierran con nombre asc como desempate estable para que
    // consultas idénticas mantengan el orden entre páginas (RF-BUS-03-03 / CA-BUS-03-03).
    switch (orden) {
      case 'precio_asc':
        q = q.orderBy(precioProducto, 'asc').orderBy('p.nombre', 'asc');
        break;
      case 'precio_desc':
        q = q.orderBy(precioProducto, 'desc').orderBy('p.nombre', 'asc');
        break;
      case 'novedad':
        // ponytail: `producto` no tiene columna de fecha; el id serial es proxy de
        // novedad. Cambiar por una fecha de alta si el esquema la incorpora.
        q = q.orderBy('p.id_producto', 'desc');
        break;
      case 'relevancia':
      default:
        // Sin término la relevancia carece de señal y equivale al orden alfabético.
        q = termino
          ? q.orderBy(this.relevanciaPonderada(termino), 'desc').orderBy('p.nombre', 'asc')
          : q.orderBy('p.nombre', 'asc');
        break;
    }

    return q.limit(limite).offset(offset).execute();
  }

  async contar(termino: string | undefined, filtros: FiltrosBusqueda | undefined): Promise<number> {
    const fila = await this.base(termino, filtros)
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }

  /**
   * Facetas del catálogo (HU-BUS-02, RF-BUS-02-02): por cada dimensión, los valores
   * que producen resultados con su conteo de productos, aplicando término + filtros
   * vigentes (conjuntivo). Cada dimensión se agrega sobre la misma base filtrada.
   * ponytail: color solo cuenta preparados (variante con ese color); los entonables
   * quedan fuera del conteo — ampliar a la carta de la marca si se requiere paridad
   * exacta con el filtro de color.
   */
  async facetas(termino: string | undefined, filtros: FiltrosBusqueda | undefined): Promise<FacetasBusqueda> {
    const t = termino;
    const f = filtros;

    const [marcas, lineas, resinas, subcategorias, categorias, presentaciones, colores] = await Promise.all([
      this.base(t, f)
        .innerJoin('marca as m', 'm.id_marca', 'p.id_marca')
        .select(({ fn }) => ['m.id_marca as id', 'm.nombre', fn.count<string>('p.id_producto').distinct().as('cantidad')])
        .groupBy(['m.id_marca', 'm.nombre'])
        .execute(),
      this.base(t, f)
        .innerJoin('linea as l', 'l.id_linea', 'p.id_linea')
        .select(({ fn }) => ['l.id_linea as id', 'l.nombre', fn.count<string>('p.id_producto').distinct().as('cantidad')])
        .groupBy(['l.id_linea', 'l.nombre'])
        .execute(),
      this.base(t, f)
        .innerJoin('tipo_resina as tr', 'tr.id_tipo_resina', 'p.id_tipo_resina')
        .select(({ fn }) => ['tr.id_tipo_resina as id', 'tr.nombre', fn.count<string>('p.id_producto').distinct().as('cantidad')])
        .groupBy(['tr.id_tipo_resina', 'tr.nombre'])
        .execute(),
      this.base(t, f)
        .innerJoin('producto_subcategoria as ps', 'ps.id_producto', 'p.id_producto')
        .innerJoin('subcategorias as s', 's.id_subcategoria', 'ps.id_subcategoria')
        .select(({ fn }) => ['s.id_subcategoria as id', 's.nombre', fn.count<string>('p.id_producto').distinct().as('cantidad')])
        .groupBy(['s.id_subcategoria', 's.nombre'])
        .execute(),
      this.base(t, f)
        .innerJoin('producto_subcategoria as ps', 'ps.id_producto', 'p.id_producto')
        .innerJoin('subcategorias as s', 's.id_subcategoria', 'ps.id_subcategoria')
        .innerJoin('categoria as c', 'c.id_categoria', 's.id_categoria')
        .select(({ fn }) => ['c.id_categoria as id', 'c.nombre', fn.count<string>('p.id_producto').distinct().as('cantidad')])
        .groupBy(['c.id_categoria', 'c.nombre'])
        .execute(),
      this.base(t, f)
        .innerJoin('variante as v', 'v.id_producto', 'p.id_producto')
        .innerJoin('presentacion as pr', 'pr.id_presentacion', 'v.id_presentacion')
        .where('v.estado', '=', 'activo')
        .select(({ fn }) => ['pr.id_presentacion as id', 'pr.nombre', fn.count<string>('p.id_producto').distinct().as('cantidad')])
        .groupBy(['pr.id_presentacion', 'pr.nombre'])
        .execute(),
      this.base(t, f)
        .innerJoin('variante as v', 'v.id_producto', 'p.id_producto')
        .innerJoin('color as c', 'c.id_color', 'v.id_color')
        .where('v.estado', '=', 'activo')
        .select(({ fn }) => ['c.id_color as id', 'c.nombre', fn.count<string>('p.id_producto').distinct().as('cantidad')])
        .groupBy(['c.id_color', 'c.nombre'])
        .execute(),
    ]);

    return {
      categorias: this.ordenarFaceta(categorias),
      subcategorias: this.ordenarFaceta(subcategorias),
      marcas: this.ordenarFaceta(marcas),
      lineas: this.ordenarFaceta(lineas),
      resinas: this.ordenarFaceta(resinas),
      colores: this.ordenarFaceta(colores),
      presentaciones: this.ordenarFaceta(presentaciones),
    };
  }

  /** Normaliza el conteo y ordena por cantidad desc y nombre asc (estable). */
  private ordenarFaceta(filas: FilaFaceta[]): FacetaValor[] {
    return filas
      .map((f) => ({ id: f.id, nombre: f.nombre, cantidad: Number(f.cantidad) }))
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre));
  }

  /** Registra un evento de búsqueda sin resultado (HU-BUS-06). Sin identidad (M20). */
  async registrarSinResultado(termino: string): Promise<void> {
    await this.db.insertInto('busqueda_sin_resultado').values({ termino }).execute();
  }

  /**
   * Términos sin resultado desde `desde`, agregados por término y ordenados por
   * frecuencia (RF-BUS-06-02 / CA-BUS-06-01). No expone identidad (CA-BUS-06-02).
   */
  async listarSinResultado(desde: Date): Promise<TerminoSinResultado[]> {
    const filas = await this.db
      .selectFrom('busqueda_sin_resultado')
      .select(({ fn }) => ['termino', fn.count<string>('id_busqueda').as('repeticiones')])
      .where('fecha', '>=', desde)
      .groupBy('termino')
      .orderBy('repeticiones', 'desc')
      .orderBy('termino', 'asc')
      .execute();
    return filas.map((f) => ({ termino: f.termino, repeticiones: Number(f.repeticiones) }));
  }

  /**
   * Base de la consulta: productos activos+publicados, más el término (HU-BUS-01)
   * y los filtros del catálogo (HU-BUS-02). Cada lista de filtro es un OR interno
   * (`in`) y entre filtros distintos es AND. Todo se resuelve sobre `producto` con
   * `EXISTS` para devolver productos, no variantes (RF-BUS-02-03). Sin anotación de
   * tipo: se deja inferir el builder de Kysely (encadenar `.where` conserva el tipo).
   */
  private base(termino: string | undefined, f: FiltrosBusqueda | undefined) {
    let q = this.db.selectFrom('producto as p').where('p.estado', '=', 'activo').where('p.publicado', '=', true);

    if (termino) q = q.where(this.predicado(termino));
    if (!f) return q;

    if (f.idMarca?.length) q = q.where('p.id_marca', 'in', f.idMarca);
    if (f.idLinea?.length) q = q.where('p.id_linea', 'in', f.idLinea);
    if (f.idTipoResina?.length) q = q.where('p.id_tipo_resina', 'in', f.idTipoResina);

    if (f.idSubcategoria?.length) {
      const ids = f.idSubcategoria;
      q = q.where((eb) =>
        eb.exists(
          eb
            .selectFrom('producto_subcategoria as ps')
            .whereRef('ps.id_producto', '=', 'p.id_producto')
            .where('ps.id_subcategoria', 'in', ids)
            .select('ps.id_producto')
        )
      );
    }

    if (f.idCategoria?.length) {
      const ids = f.idCategoria;
      q = q.where((eb) =>
        eb.exists(
          eb
            .selectFrom('producto_subcategoria as ps')
            .innerJoin('subcategorias as s', 's.id_subcategoria', 'ps.id_subcategoria')
            .whereRef('ps.id_producto', '=', 'p.id_producto')
            .where('s.id_categoria', 'in', ids)
            .select('ps.id_producto')
        )
      );
    }

    if (f.idPresentacion?.length) {
      const ids = f.idPresentacion;
      q = q.where((eb) =>
        eb.exists(
          eb
            .selectFrom('variante as v')
            .whereRef('v.id_producto', '=', 'p.id_producto')
            .where('v.estado', '=', 'activo')
            .where('v.id_presentacion', 'in', ids)
            .select('v.id_variante')
        )
      );
    }

    if (f.idColor?.length) {
      const ids = f.idColor;
      q = q.where((eb) =>
        eb.or([
          // Preparado: el producto tiene una variante activa con ese color.
          eb.exists(
            eb
              .selectFrom('variante as v')
              .whereRef('v.id_producto', '=', 'p.id_producto')
              .where('v.estado', '=', 'activo')
              .where('v.id_color', 'in', ids)
              .select('v.id_variante')
          ),
          // Entonable: el producto se entona y el color existe en la carta de su marca.
          eb.and([
            eb('p.clase_color', '=', 'entonable'),
            eb.exists(
              eb
                .selectFrom('color as c')
                .whereRef('c.id_marca', '=', 'p.id_marca')
                .where('c.estado', '=', 'activo')
                .where('c.id_color', 'in', ids)
                .select('c.id_color')
            ),
          ]),
        ])
      );
    }

    // Rango de precio (RF-BUS-02-04). ponytail: opera sobre `variante.precio_vigente`
    // (precio base). El precio final tras descuentos + IVA depende de M06 (aún
    // inexistente); integrar aquí cuando M06 exponga el precio aplicable por cliente.
    if (f.precioMin !== undefined || f.precioMax !== undefined) {
      const min = f.precioMin;
      const max = f.precioMax;
      q = q.where((eb) =>
        eb.exists(
          eb
            .selectFrom('variante as v')
            .whereRef('v.id_producto', '=', 'p.id_producto')
            .where('v.estado', '=', 'activo')
            .$if(min !== undefined, (qb) => qb.where(sql<SqlBool>`v.precio_vigente >= ${min}`))
            .$if(max !== undefined, (qb) => qb.where(sql<SqlBool>`v.precio_vigente <= ${max}`))
            .select('v.id_variante')
        )
      );
    }

    return q;
  }

  /**
   * Relevancia ponderada (RF-BUS-03-02): nombre > marca > línea > color >
   * descripción, con un bonus por coincidencia exacta del nombre para priorizar
   * el resultado exacto sobre el aproximado. Cada campo aporta su `word_similarity`
   * normalizada (unaccent + lower) multiplicada por su peso.
   */
  private relevanciaPonderada(t: string): RawBuilder<number> {
    const nt = sql`unaccent(lower(${t}))`;
    const sim = (col: RawBuilder<unknown>): RawBuilder<number> => sql<number>`word_similarity(${nt}, unaccent(lower(${col})))`;
    return sql<number>`(
      case when unaccent(lower(p.nombre)) = ${nt} then 100 else 0 end
      + 5 * ${sim(sql.ref('p.nombre'))}
      + 4 * coalesce((select ${sim(sql.ref('m.nombre'))} from marca m where m.id_marca = p.id_marca), 0)
      + 3 * coalesce((select ${sim(sql.ref('l.nombre'))} from linea l where l.id_linea = p.id_linea), 0)
      + 2 * coalesce((
          select max(word_similarity(${nt}, unaccent(lower(c.nombre))))
          from variante v join color c on c.id_color = v.id_color
          where v.id_producto = p.id_producto and v.estado = 'activo'
        ), 0)
      + 1 * ${sim(sql`coalesce(p.descripcion, '')`)}
    )`;
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
