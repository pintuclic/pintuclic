import { Kysely, ExpressionBuilder, Expression, SqlBool, sql } from 'kysely';
import { Database, Producto, ProductoTable, Color, ColorTable, EnumClaseColor } from '../../../core/db/types';
import { TamanoImagen, VersionesImagen } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - REPOSITORIO DE CONSULTA PÚBLICA (HU-CAT-06)
// Solo expone productos públicamente elegibles (productoElegible, RF-CAT-09-02). Consultas de solo
// lectura con joins; el listado se pagina (RNF-CAT-06-01).
// ==============================================================================

export interface FiltrosProductosPublicos {
  idSubcategoria?: number;
  busqueda?: string;
  ids?: number[];
  limite: number;
  offset: number;
}

/** Fila de subcategoría con su categoría, para agrupar en el servicio. */
export interface FilaCategoriaSubcategoria {
  id_categoria: number;
  categoria_nombre: string;
  id_subcategoria: number;
  subcategoria_nombre: string;
}

export interface FilaVariantePublica {
  id_variante: number;
  id_presentacion: number;
  presentacion: string;
  volumen: string;
  id_color: number | null;
  color: string | null;
  codigo_color: string | null;
  cie_l: string | number | null;
  cie_a: string | number | null;
  cie_b: string | number | null;
  id_base: number | null;
  base: string | null;
  precio_vigente: string;
  existencia_referencial: number;
}

export interface FilaImagenPublica {
  id_imagen: number;
  id_producto: number;
  id_variante: number | null;
  id_color: number | null;
  mime_type: string;
  orden: number;
  es_principal: boolean;
}

export interface FilaProductoResumenPublico {
  id_producto: number;
  nombre: string;
  id_marca: number;
  marca: string;
  clase_color: EnumClaseColor;
  precio_desde: string | null;
  id_imagen_principal: number | null;
  cantidad_colores: string | number;
  patrocinado: boolean;
  es_combo: boolean;
  agotado: boolean;
}

/** Producto público con su estado de combo (HU-CAT-13). */
export type ProductoPublico = Producto & { es_combo: boolean; agotado: boolean };
/** Columna de `imagen` que corresponde a cada tamaño público (RNF-CAT-07-01). */
const COLUMNA_POR_TAMANO = { original: 'i.datos', miniatura: 'i.miniatura', optimizada: 'i.optimizada' } as const;

/** Versión pedida de una imagen pública; `contenido` es null si esa versión aún no se generó. */
export interface VersionImagenPublica {
  contenido: Buffer | null;
  mime_type: string;
}

type EbProducto = ExpressionBuilder<Database & { p: ProductoTable }, 'p'>;
type EbColor = ExpressionBuilder<Database & { c: ColorTable }, 'c'>;

/** Variante entonable que resuelve la base consumida por un color (RF-CAT-12-05). */
export interface FilaVarianteEntonada {
  id_variante: number;
  id_base: number;
  base: string;
  precio_vigente: string;
}

/**
 * RF-CAT-12-04/06: variantes del producto sobre las que puede prepararse el
 * color `c`. La base debe estar declarada para el color (color_base), ofrecida
 * por el producto (producto_base) y activa, y la variante y su presentación
 * deben estar activas. Es la única definición de "color preparable" del módulo:
 * la usan la carta, el conteo de colores del listado y la resolución de la base.
 */
function variantesPreparables(eb: EbColor, idProducto: Expression<number> | number) {
  return eb
    .selectFrom('variante as ve')
    .innerJoin('color_base as cb', (j) => j.onRef('cb.id_base', '=', 've.id_base').onRef('cb.id_color', '=', 'c.id_color'))
    .innerJoin('producto_base as pb', (j) => j.onRef('pb.id_producto', '=', 've.id_producto').onRef('pb.id_base', '=', 've.id_base'))
    .innerJoin('base as ba', 'ba.id_base', 've.id_base')
    .innerJoin('presentacion as pre', 'pre.id_presentacion', 've.id_presentacion')
    .where('ve.id_producto', '=', idProducto)
    .where('ve.estado', '=', 'activo')
    .where('ba.estado', '=', 'activo')
    .where('pre.estado', '=', 'activo');
}

/** RF-CAT-12-06: el color `c` tiene al menos una base vendible en el producto. */
function colorPreparable(eb: EbColor, idProducto: Expression<number> | number) {
  return eb.exists(variantesPreparables(eb, idProducto).select('ve.id_variante'));
}

/**
 * RF-CAT-01-04 / RF-CAT-09-02: elegibilidad pública única de un producto. Además
 * de estar activo y publicado, su marca y su línea (si tiene) deben estar
 * activas, debe conservar al menos una subcategoría activa bajo una categoría
 * activa y al menos una variante activa vendible. Se aplica igual en listado,
 * ficha, categorías, carta, imágenes y complementarios.
 */
function productoElegible(eb: EbProducto): Expression<SqlBool> {
  return eb.and([
    eb('p.estado', '=', 'activo'),
    eb('p.publicado', '=', true),
    eb.exists(
      eb
        .selectFrom('marca as m')
        .whereRef('m.id_marca', '=', 'p.id_marca')
        .where('m.estado', '=', 'activo')
        .select('m.id_marca')
    ),
    eb.or([
      eb('p.id_linea', 'is', null),
      eb.exists(
        eb
          .selectFrom('linea as l')
          .whereRef('l.id_linea', '=', 'p.id_linea')
          .where('l.estado', '=', 'activo')
          .select('l.id_linea')
      ),
    ]),
    eb.exists(
      eb
        .selectFrom('producto_subcategoria as pse')
        .innerJoin('subcategorias as se', 'se.id_subcategoria', 'pse.id_subcategoria')
        .innerJoin('categoria as ce', 'ce.id_categoria', 'se.id_categoria')
        .whereRef('pse.id_producto', '=', 'p.id_producto')
        .where('se.estado', '=', 'activo')
        .where('ce.estado', '=', 'activo')
        .select('pse.id_producto')
    ),
    eb.exists(
      eb
        .selectFrom('variante as ve')
        .innerJoin('presentacion as pre', 'pre.id_presentacion', 've.id_presentacion')
        .leftJoin('color as coe', 'coe.id_color', 've.id_color')
        .leftJoin('base as bae', 'bae.id_base', 've.id_base')
        .whereRef('ve.id_producto', '=', 'p.id_producto')
        .where('ve.estado', '=', 'activo')
        .where('pre.estado', '=', 'activo')
        .where((e) => e.or([e('ve.id_color', 'is', null), e('coe.estado', '=', 'activo')]))
        .where((e) => e.or([e('ve.id_base', 'is', null), e('bae.estado', '=', 'activo')]))
        .select('ve.id_variante')
    ),
  ]);
}

/** HU-CAT-13: el producto está registrado como combo. */
function esCombo(eb: EbProducto) {
  return eb
    .exists(eb.selectFrom('combo as cb').whereRef('cb.id_producto', '=', 'p.id_producto').select('cb.id_combo'))
    .$castTo<boolean>();
}

/** CA-CAT-13-06 / RF-CAT-13-04: combo sin ninguna variante activa con unidades disponibles. */
function comboAgotado(eb: EbProducto) {
  return eb
    .and([
      esCombo(eb),
      eb.not(
        eb.exists(
          eb
            .selectFrom('variante as vx')
            .whereRef('vx.id_producto', '=', 'p.id_producto')
            .where('vx.estado', '=', 'activo')
            .where('vx.existencia_referencial', '>', 0)
            .select('vx.id_variante')
        )
      ),
    ])
    .$castTo<boolean>();
}

export class CatalogoPublicoRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /** Subconsulta con los ids de productos públicamente elegibles. */
  private idsElegibles() {
    return this.db.selectFrom('producto as p').where(productoElegible).select('p.id_producto');
  }

  /**
   * RF-CAT-06-02 / CA-CAT-06-04: categorías/subcategorías activas con al menos un
   * producto elegible, en el orden administrado desde el panel (RF-CAT-01-01) con
   * desempate estable por nombre e id.
   */
  async listarCategoriasConProductos(): Promise<FilaCategoriaSubcategoria[]> {
    return this.db
      .selectFrom('subcategorias as s')
      .innerJoin('categoria as c', 'c.id_categoria', 's.id_categoria')
      .where('s.estado', '=', 'activo')
      .where('c.estado', '=', 'activo')
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('producto_subcategoria as ps')
            .whereRef('ps.id_subcategoria', '=', 's.id_subcategoria')
            .where('ps.id_producto', 'in', this.idsElegibles())
            .select('ps.id_producto')
        )
      )
      .select([
        'c.id_categoria',
        'c.nombre as categoria_nombre',
        's.id_subcategoria',
        's.nombre as subcategoria_nombre',
      ])
      .orderBy('c.orden', 'asc')
      .orderBy('c.nombre', 'asc')
      .orderBy('c.id_categoria', 'asc')
      .orderBy('s.orden', 'asc')
      .orderBy('s.nombre', 'asc')
      .orderBy('s.id_subcategoria', 'asc')
      .execute();
  }

  /** RF-CAT-06-01 / RNF-CAT-06-01: productos activos+publicados, filtrables y paginados con resumen sin N+1. */
  async listarProductos(filtros: FiltrosProductosPublicos): Promise<FilaProductoResumenPublico[]> {
    const query = this.aplicarFiltros(filtros)
      .select((eb) => [esCombo(eb).as('es_combo'), comboAgotado(eb).as('agotado')])
      .innerJoin('marca as m', 'm.id_marca', 'p.id_marca')
      .select([
        'p.id_producto',
        'p.nombre',
        'p.id_marca',
        'm.nombre as marca',
        'p.clase_color',
        'p.patrocinado',
      ])
      .select((eb) =>
        eb
          .selectFrom('variante as v')
          .select(({ fn }) => fn.min('v.precio_vigente').as('precio'))
          .whereRef('v.id_producto', '=', 'p.id_producto')
          .where('v.estado', '=', 'activo')
          .as('precio_desde')
      )
      .select((eb) =>
        eb
          .selectFrom('imagen as i')
          .select('i.id_imagen')
          .whereRef('i.id_producto', '=', 'p.id_producto')
          .where('i.es_principal', '=', true)
          .limit(1)
          .as('id_imagen_principal')
      )
      .select((eb) => {
        return eb.fn.coalesce(
          eb
            .case()
            .when('p.clase_color', '=', 'colores_fijos')
            .then(
              eb
                .selectFrom('variante as v')
                .select(({ fn }) => fn.count<number>('v.id_color').distinct().as('count'))
                .whereRef('v.id_producto', '=', 'p.id_producto')
                .where('v.estado', '=', 'activo')
                .where('v.id_color', 'is not', null)
            )
            .when('p.clase_color', '=', 'entonable')
            .then(
              eb
                .selectFrom('color as c')
                .select(({ fn }) => fn.count<number>('c.id_color').as('count'))
                .where('c.estado', '=', 'activo')
                .where((ebColor) => colorPreparable(ebColor, eb.ref('p.id_producto')))
            )
            .else(eb.lit(0))
            .end(),
          eb.lit(0)
        ).as('cantidad_colores');
      })
      .orderBy('p.nombre', 'asc')
      .limit(filtros.limite)
      .offset(filtros.offset);

    return query.execute() as unknown as Promise<FilaProductoResumenPublico[]>;
  }

  async contarProductos(filtros: FiltrosProductosPublicos): Promise<number> {
    const fila = await this.aplicarFiltros(filtros)
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }

  /** CA-CAT-06-03 / RF-CAT-09-02: la ficha solo existe si el producto es públicamente elegible. */
  async obtenerProductoPublico(id: number): Promise<ProductoPublico | undefined> {
    return this.db
      .selectFrom('producto as p')
      .selectAll('p')
      .select((eb) => [esCombo(eb).as('es_combo'), comboAgotado(eb).as('agotado')])
      .where('p.id_producto', '=', id)
      .where(productoElegible)
      .executeTakeFirst();
  }

  /**
   * RF-CAT-09-02: variantes vendibles. Además de su propio estado, exige la
   * presentación activa y, si la tienen, el color y la base activos.
   */
  async listarVariantesPublicas(idProducto: number): Promise<FilaVariantePublica[]> {
    return this.db
      .selectFrom('variante as v')
      .innerJoin('presentacion as pr', 'pr.id_presentacion', 'v.id_presentacion')
      .leftJoin('color as co', 'co.id_color', 'v.id_color')
      .leftJoin('base as ba', 'ba.id_base', 'v.id_base')
      .where('v.id_producto', '=', idProducto)
      .where('v.estado', '=', 'activo')
      .where('pr.estado', '=', 'activo')
      .where((eb) => eb.or([eb('v.id_color', 'is', null), eb('co.estado', '=', 'activo')]))
      .where((eb) => eb.or([eb('v.id_base', 'is', null), eb('ba.estado', '=', 'activo')]))
      .select([
        'v.id_variante',
        'v.id_presentacion',
        'pr.nombre as presentacion',
        'pr.volumen',
        'v.id_color',
        'co.nombre as color',
        'co.codigo as codigo_color',
        'co.cie_l',
        'co.cie_a',
        'co.cie_b',
        'v.id_base',
        'ba.nombre as base',
        'v.precio_vigente',
        'v.existencia_referencial',
      ])
      .orderBy('pr.volumen', 'asc')
      .execute();
  }

  /**
   * RF-CAT-06-03/04: colores activos que el producto puede vender. Colores fijos:
   * los de sus variantes activas. Entonable: los preparables sobre una base
   * vendible del producto (RF-CAT-12-06, CA-CAT-12-05/06).
   */
  async listarColoresActivosDeProducto(idProducto: number, claseColor: EnumClaseColor): Promise<Color[]> {
    if (claseColor === 'sin_color') return [];

    let query = this.db.selectFrom('color as c')
      .selectAll('c')
      .where('c.estado', '=', 'activo');

    if (claseColor === 'colores_fijos') {
      query = query.where((eb) =>
        eb.exists(
          eb.selectFrom('variante as v')
            .innerJoin('presentacion as pr', 'pr.id_presentacion', 'v.id_presentacion')
            .whereRef('v.id_color', '=', 'c.id_color')
            .where('v.id_producto', '=', idProducto)
            .where('v.estado', '=', 'activo')
            .where('pr.estado', '=', 'activo')
            .select('v.id_variante')
        )
      );
    } else if (claseColor === 'entonable') {
      query = query.where((eb) => colorPreparable(eb, idProducto));
    }

    return query.execute();
  }

  /**
   * RF-CAT-08-02/03 / CA-CAT-08-02: productos elegibles de una categoría (bajo una
   * subcategoría activa) que no sean combos agotados, patrocinados primero y el
   * resto al azar, excluyendo uno.
   */
  async complementariosPorCategoria(idCategoria: number, excluirId: number, limite: number): Promise<Producto[]> {
    return this.db
      .selectFrom('producto as p')
      .selectAll('p')
      .where(productoElegible)
      .where((eb) => eb.not(comboAgotado(eb)))
      .where('p.id_producto', '!=', excluirId)
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
      .orderBy('p.patrocinado', 'desc')
      .orderBy(sql`random()`)
      .limit(limite)
      .execute();
  }

  /**
   * RF-CAT-12-05 / CA-CAT-12-04: variante de base que se consume al pedir un
   * color activo en una presentación de un producto entonable. Si el color
   * admite varias bases vendibles, se elige de forma estable la de menor id.
   */
  async resolverVarianteEntonada(
    idProducto: number,
    idColor: number,
    idPresentacion: number
  ): Promise<FilaVarianteEntonada | undefined> {
    return this.db
      .selectFrom('color as c')
      .innerJoinLateral(
        (eb) =>
          variantesPreparables(eb, idProducto)
            .where('ve.id_presentacion', '=', idPresentacion)
            .select(['ve.id_variante', 'ba.id_base', 'ba.nombre as base', 've.precio_vigente'])
            .orderBy('ba.id_base', 'asc')
            .limit(1)
            .as('vp'),
        (join) => join.onTrue()
      )
      .select(['vp.id_variante', 'vp.id_base', 'vp.base', 'vp.precio_vigente'])
      .where('c.id_color', '=', idColor)
      .where('c.estado', '=', 'activo')
      .executeTakeFirst();
  }

  /**
   * RF-CAT-08-01: categoría complementaria heredada de las categorías activas
   * del producto (por su orden administrado), o null si ninguna la declara.
   */
  async categoriaComplementariaHeredada(idProducto: number): Promise<number | null> {
    const fila = await this.db
      .selectFrom('producto_subcategoria as ps')
      .innerJoin('subcategorias as s', 's.id_subcategoria', 'ps.id_subcategoria')
      .innerJoin('categoria as c', 'c.id_categoria', 's.id_categoria')
      .select('c.id_categoria_complementaria')
      .where('ps.id_producto', '=', idProducto)
      .where('s.estado', '=', 'activo')
      .where('c.estado', '=', 'activo')
      .where('c.id_categoria_complementaria', 'is not', null)
      .orderBy('c.orden', 'asc')
      .orderBy('c.id_categoria', 'asc')
      .executeTakeFirst();
    return fila?.id_categoria_complementaria ?? null;
  }

  /** RF-CAT-08-02/03 (fallback): patrocinados elegibles que no sean combos agotados, al azar, excluyendo uno. */
  async patrocinados(excluirId: number, limite: number): Promise<Producto[]> {
    return this.db
      .selectFrom('producto as p')
      .selectAll('p')
      .where(productoElegible)
      .where((eb) => eb.not(comboAgotado(eb)))
      .where('p.patrocinado', '=', true)
      .where('p.id_producto', '!=', excluirId)
      .orderBy(sql`random()`)
      .limit(limite)
      .execute();
  }

  async listarImagenesPublicas(idProducto: number): Promise<FilaImagenPublica[]> {
    return this.db
      .selectFrom('imagen')
      .select(['id_imagen', 'id_producto', 'id_variante', 'id_color', 'mime_type', 'orden', 'es_principal'])
      .where('id_producto', '=', idProducto)
      .orderBy('orden', 'asc')
      .orderBy('id_imagen', 'asc')
      .execute();
  }

  /**
   * RF-CAT-06-01 / RF-CAT-07-03 / RNF-CAT-07-01: lee solo la versión pedida de
   * una imagen, y solo si su producto es públicamente elegible.
   */
  async obtenerVersionImagenPublica(idImagen: number, tamano: TamanoImagen): Promise<VersionImagenPublica | undefined> {
    return this.db
      .selectFrom('imagen as i')
      .select([`${COLUMNA_POR_TAMANO[tamano]} as contenido`, 'i.mime_type'])
      .where('i.id_imagen', '=', idImagen)
      .where('i.id_producto', 'in', this.idsElegibles())
      .executeTakeFirst();
  }

  /** RNF-CAT-07-01: guarda las versiones generadas de una imagen previa a v4.0. */
  async guardarVersionesImagen(idImagen: number, versiones: VersionesImagen): Promise<void> {
    await this.db.updateTable('imagen').set(versiones).where('id_imagen', '=', idImagen).execute();
  }

  private aplicarFiltros(filtros: FiltrosProductosPublicos) {
    let query = this.db
      .selectFrom('producto as p')
      .where(productoElegible);
    if (filtros.ids && filtros.ids.length > 0) {
      query = query.where('p.id_producto', 'in', filtros.ids);
    }
    if (filtros.idSubcategoria !== undefined) {
      const idSub = filtros.idSubcategoria;
      query = query.where((eb) =>
        eb.exists(
          eb
            .selectFrom('producto_subcategoria as ps')
            .innerJoin('subcategorias as s', 's.id_subcategoria', 'ps.id_subcategoria')
            .innerJoin('categoria as c', 'c.id_categoria', 's.id_categoria')
            .whereRef('ps.id_producto', '=', 'p.id_producto')
            .where('ps.id_subcategoria', '=', idSub)
            .where('s.estado', '=', 'activo')
            .where('c.estado', '=', 'activo')
            .select('ps.id_producto')
        )
      );
    }
    if (filtros.busqueda) {
      query = query.where('p.nombre', 'ilike', `%${filtros.busqueda}%`);
    }
    return query;
  }
}

