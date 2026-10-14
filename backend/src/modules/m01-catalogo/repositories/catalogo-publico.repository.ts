import { Kysely, sql } from 'kysely';
import { Database, Producto, Color, EnumClaseColor } from '../../../core/db/types';
import { TamanoImagen, VersionesImagen } from '../interfaces/m01.interfaces';
import {
  colorPreparable,
  comboAgotado,
  esCombo,
  productoElegible,
  variantesPreparables,
  variantesVendibles,
} from './elegibilidad-publica';

// ==============================================================================
// M01 - REPOSITORIO DE CONSULTA PÚBLICA (HU-CAT-06)
// Solo expone productos públicamente elegibles y variantes vendibles, con las
// reglas únicas de elegibilidad-publica.ts (RF-CAT-09-02). El listado se pagina
// (RNF-CAT-06-01).
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
  hexadecimal: string | null;
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
  id_marca: number | null;
  marca: string | null;
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

/** Variante candidata a consumirse al preparar un color (RF-CAT-12-05). */
export interface FilaVarianteEntonada {
  id_variante: number;
  id_base: number | null;
  base: string | null;
  precio_vigente: string;
}

/** Columna de `imagen` que corresponde a cada tamaño público (RNF-CAT-07-01). */
const COLUMNA_POR_TAMANO = { original: 'i.datos', miniatura: 'i.miniatura', optimizada: 'i.optimizada' } as const;

/** Versión pedida de una imagen pública; `contenido` es null si esa versión aún no se generó. */
export interface VersionImagenPublica {
  contenido: Buffer | null;
  mime_type: string;
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
      .select(['c.id_categoria', 'c.nombre as categoria_nombre', 's.id_subcategoria', 's.nombre as subcategoria_nombre'])
      .orderBy('c.orden', 'asc')
      .orderBy('c.nombre', 'asc')
      .orderBy('c.id_categoria', 'asc')
      .orderBy('s.orden', 'asc')
      .orderBy('s.nombre', 'asc')
      .orderBy('s.id_subcategoria', 'asc')
      .execute();
  }

  /**
   * RF-CAT-06-01 / RF-CAT-14-05: página del listado con su resumen calculado sobre
   * las mismas variantes vendibles que ofrece la ficha (M01-09): precio desde,
   * cantidad de colores y estado agotado no pueden contradecir la ficha.
   */
  async listarProductos(filtros: FiltrosProductosPublicos): Promise<FilaProductoResumenPublico[]> {
    return this.aplicarFiltros(filtros)
      .select((eb) => [esCombo(eb).as('es_combo'), comboAgotado(eb).as('agotado')])
      .leftJoin('marca as m', 'm.id_marca', 'p.id_marca')
      .select(['p.id_producto', 'p.nombre', 'p.id_marca', 'm.nombre as marca', 'p.clase_color', 'p.patrocinado'])
      .select((eb) =>
        variantesVendibles(eb.ref('p.id_producto'))
          .select(({ fn }) => fn.min('vv.precio_vigente').as('precio'))
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
      .select((eb) =>
        eb.fn
          .coalesce(
            eb
              .case()
              .when('p.clase_color', '=', 'colores_fijos')
              .then(
                variantesVendibles(eb.ref('p.id_producto'))
                  .where('vv.id_color', 'is not', null)
                  .select(({ fn }) => fn.count<number>('vv.id_color').distinct().as('total'))
              )
              .when('p.clase_color', '=', 'entonable')
              .then(
                eb
                  .selectFrom('color as c')
                  .select(({ fn }) => fn.count<number>('c.id_color').as('total'))
                  .where('c.estado', '=', 'activo')
                  .where((ebColor) => colorPreparable(ebColor, eb.ref('p.id_producto')))
              )
              .else(eb.lit(0))
              .end(),
            eb.lit(0)
          )
          .as('cantidad_colores')
      )
      .orderBy('p.nombre', 'asc')
      .limit(filtros.limite)
      .offset(filtros.offset)
      .execute() as Promise<FilaProductoResumenPublico[]>;
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

  /** RF-CAT-09-02 / RF-CAT-03-07: variantes vendibles de la ficha, por volumen de presentación. */
  async listarVariantesPublicas(idProducto: number): Promise<FilaVariantePublica[]> {
    return variantesVendibles(idProducto, this.db)
      .select([
        'vv.id_variante',
        'vv.id_presentacion',
        'pv.nombre as presentacion',
        'pv.volumen',
        'vv.id_color',
        'cv.nombre as color',
        'cv.codigo as codigo_color',
        'cv.hexadecimal',
        'vv.id_base',
        'bv.nombre as base',
        'vv.precio_vigente',
        'vv.existencia_referencial',
      ])
      .orderBy('pv.volumen', 'asc')
      .execute();
  }

  /**
   * RF-CAT-06-03/04: colores activos que el producto puede vender. Colores fijos:
   * los de sus variantes vendibles. Entonable: los preparables sobre una base
   * vendible del producto, o «sin base» (RF-CAT-12-06/13, CA-CAT-12-05/06).
   */
  async listarColoresActivosDeProducto(idProducto: number, claseColor: EnumClaseColor): Promise<Color[]> {
    if (claseColor === 'sin_color') return [];
    return this.db
      .selectFrom('color as c')
      .selectAll('c')
      .where('c.estado', '=', 'activo')
      .where((eb) =>
        claseColor === 'colores_fijos'
          ? eb.exists(variantesVendibles(idProducto).where('vv.id_color', '=', eb.ref('c.id_color')).select('vv.id_variante'))
          : colorPreparable(eb, idProducto)
      )
      .execute();
  }

  /**
   * RF-CAT-12-05/12: variantes vendibles en una presentación sobre las que se
   * prepara un color activo. El servicio exige que sea exactamente una.
   */
  async listarVariantesEntonables(idProducto: number, idColor: number, idPresentacion: number): Promise<FilaVarianteEntonada[]> {
    return variantesPreparables(idProducto, idColor, this.db)
      .where('vv.id_presentacion', '=', idPresentacion)
      .where((eb) =>
        eb.exists(eb.selectFrom('color as ca').where('ca.id_color', '=', idColor).where('ca.estado', '=', 'activo').select('ca.id_color'))
      )
      .select(['vv.id_variante', 'vv.id_base', 'bv.nombre as base', 'vv.precio_vigente'])
      .orderBy('vv.id_variante', 'asc')
      .execute();
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
    let query = this.db.selectFrom('producto as p').where(productoElegible);
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
