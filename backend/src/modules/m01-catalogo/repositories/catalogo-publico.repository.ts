import { Kysely } from 'kysely';
import { Database, Producto } from '../../../core/db/types';

// ==============================================================================
// M01 - REPOSITORIO DE CONSULTA PÚBLICA (HU-CAT-06)
// Solo expone elementos activos y publicados (RF-CAT-09-02). Consultas de solo
// lectura con joins; el listado se pagina (RNF-CAT-06-01).
// ==============================================================================

export interface FiltrosProductosPublicos {
  idSubcategoria?: number;
  busqueda?: string;
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
}

export class CatalogoPublicoRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /** RF-CAT-06-02 / CA-CAT-06-04: categorías/subcategorías activas con al menos un producto activo+publicado. */
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
            .innerJoin('producto as p', 'p.id_producto', 'ps.id_producto')
            .whereRef('ps.id_subcategoria', '=', 's.id_subcategoria')
            .where('p.estado', '=', 'activo')
            .where('p.publicado', '=', true)
            .select('ps.id_producto')
        )
      )
      .select([
        'c.id_categoria',
        'c.nombre as categoria_nombre',
        's.id_subcategoria',
        's.nombre as subcategoria_nombre',
      ])
      .orderBy('c.nombre', 'asc')
      .orderBy('s.nombre', 'asc')
      .execute();
  }

  /** RF-CAT-06-01 / RNF-CAT-06-01: productos activos+publicados, filtrables y paginados con resumen sin N+1. */
  async listarProductos(filtros: FiltrosProductosPublicos): Promise<FilaProductoResumenPublico[]> {
    let query = this.aplicarFiltros(filtros)
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
                .whereRef('c.id_marca', '=', 'p.id_marca')
                .where('c.estado', '=', 'activo')
                .where((ebColor) =>
                  ebColor.exists(
                    ebColor
                      .selectFrom('variante as v2')
                      .innerJoin('base as b2', 'b2.id_base', 'v2.id_base')
                      .whereRef('v2.id_producto', '=', 'p.id_producto')
                      .where('v2.estado', '=', 'activo')
                      .where('b2.estado', '=', 'activo')
                  )
                )
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

  /** CA-CAT-06-03: la ficha solo existe si el producto está activo y publicado. */
  async obtenerProductoPublico(id: number): Promise<Producto | undefined> {
    return this.db
      .selectFrom('producto')
      .selectAll()
      .where('id_producto', '=', id)
      .where('estado', '=', 'activo')
      .where('publicado', '=', true)
      .executeTakeFirst();
  }

  async listarVariantesPublicas(idProducto: number): Promise<any[]> {
    return this.db
      .selectFrom('variante as v')
      .innerJoin('presentacion as pr', 'pr.id_presentacion', 'v.id_presentacion')
      .leftJoin('color as co', 'co.id_color', 'v.id_color')
      .leftJoin('base as ba', 'ba.id_base', 'v.id_base')
      .where('v.id_producto', '=', idProducto)
      .where('v.estado', '=', 'activo')
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

  /** Recupera colores activos para el paginado en memoria, evaluando la disponibilidad según clase. */
  async listarColoresActivosDeProducto(idProducto: number, idMarca: number, claseColor: EnumClaseColor): Promise<any[]> {
    if (claseColor === 'sin_color') return [];

    let query = this.db.selectFrom('color as c')
      .selectAll('c')
      .where('c.estado', '=', 'activo');

    if (claseColor === 'colores_fijos') {
      query = query.where((eb) =>
        eb.exists(
          eb.selectFrom('variante as v')
            .whereRef('v.id_color', '=', 'c.id_color')
            .where('v.id_producto', '=', idProducto)
            .where('v.estado', '=', 'activo')
        )
      );
    } else if (claseColor === 'entonable') {
      query = query.where('c.id_marca', '=', idMarca).where((eb) =>
        eb.exists(
          eb.selectFrom('variante as v')
            .innerJoin('base as b', 'b.id_base', 'v.id_base')
            .where('v.id_producto', '=', idProducto)
            .where('v.estado', '=', 'activo')
            .where('b.estado', '=', 'activo')
        )
      );
    }

    return query.execute();
  }

  /** RF-CAT-08-02: productos activos+publicados de una categoría, patrocinados primero, excluyendo uno. */
  async complementariosPorCategoria(idCategoria: number, excluirId: number, limite: number): Promise<Producto[]> {
    return this.db
      .selectFrom('producto as p')
      .selectAll('p')
      .where('p.estado', '=', 'activo')
      .where('p.publicado', '=', true)
      .where('p.id_producto', '!=', excluirId)
      .where((eb) =>
        eb.exists(
          eb
            .selectFrom('producto_subcategoria as ps')
            .innerJoin('subcategorias as s', 's.id_subcategoria', 'ps.id_subcategoria')
            .whereRef('ps.id_producto', '=', 'p.id_producto')
            .where('s.id_categoria', '=', idCategoria)
            .select('ps.id_producto')
        )
      )
      .orderBy('p.patrocinado', 'desc')
      .orderBy('p.nombre', 'asc')
      .limit(limite)
      .execute();
  }

  /** RF-CAT-08-02 (fallback): productos patrocinados activos+publicados, excluyendo uno. */
  async patrocinados(excluirId: number, limite: number): Promise<Producto[]> {
    return this.db
      .selectFrom('producto')
      .selectAll()
      .where('estado', '=', 'activo')
      .where('publicado', '=', true)
      .where('patrocinado', '=', true)
      .where('id_producto', '!=', excluirId)
      .orderBy('nombre', 'asc')
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

  private aplicarFiltros(filtros: FiltrosProductosPublicos) {
    let query = this.db
      .selectFrom('producto as p')
      .where('p.estado', '=', 'activo')
      .where('p.publicado', '=', true);
    if (filtros.idSubcategoria !== undefined) {
      const idSub = filtros.idSubcategoria;
      query = query.where((eb) =>
        eb.exists(
          eb
            .selectFrom('producto_subcategoria as ps')
            .whereRef('ps.id_producto', '=', 'p.id_producto')
            .where('ps.id_subcategoria', '=', idSub)
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

