import { Expression, ExpressionBuilder, QueryCreator, SqlBool, expressionBuilder } from 'kysely';
import { Database, ColorTable, ProductoTable } from '../../../core/db/types';

// ==============================================================================
// M01 - REGLAS DE VISIBILIDAD PÚBLICA (RF-CAT-09-02)
// Única definición de "variante vendible", "producto elegible", "combo agotado"
// y "color preparable". La usan el listado (precio, colores, agotado), la ficha,
// la carta, las imágenes, los complementarios y el impacto de desactivar
// categorías, de modo que todos respondan con el mismo criterio (M01-02/08/09).
// Las subconsultas se construyen fuera del ámbito del llamador y se correlacionan
// recibiendo la referencia del producto o del color como expresión. Cuando una
// regla es la consulta principal, el repositorio entrega su conexión como origen
// (el constructor por defecto solo arma subconsultas, no las ejecuta).
// ==============================================================================

export type EbProducto = ExpressionBuilder<Database & { p: ProductoTable }, 'p'>;
export type EbColor = ExpressionBuilder<Database & { c: ColorTable }, 'c'>;

type Id = Expression<number> | number;

/** Desde dónde se arma la consulta: la conexión (consulta principal) o el constructor de subconsultas. */
export type OrigenConsulta = Pick<QueryCreator<Database>, 'selectFrom'>;

const consulta: OrigenConsulta = expressionBuilder<Database, never>();

/**
 * RF-CAT-09-02 / RF-CAT-06-01: variantes que la ficha ofrece a la venta. Además
 * de su propio estado exigen la presentación activa y, si los tienen, el color
 * y la base activos. Alias: `vv` (variante), `pv` (presentación), `cv` (color)
 * y `bv` (base).
 */
export function variantesVendibles(idProducto: Id, origen: OrigenConsulta = consulta) {
  return origen
    .selectFrom('variante as vv')
    .innerJoin('presentacion as pv', 'pv.id_presentacion', 'vv.id_presentacion')
    .leftJoin('color as cv', 'cv.id_color', 'vv.id_color')
    .leftJoin('base as bv', 'bv.id_base', 'vv.id_base')
    .where('vv.id_producto', '=', idProducto)
    .where('vv.estado', '=', 'activo')
    .where('pv.estado', '=', 'activo')
    .where((eb) => eb.or([eb('vv.id_color', 'is', null), eb('cv.estado', '=', 'activo')]))
    .where((eb) => eb.or([eb('vv.id_base', 'is', null), eb('bv.estado', '=', 'activo')]));
}

/**
 * RF-CAT-01-04 / RF-CAT-09-02: un producto es visible si está activo y
 * publicado, su marca y su línea (si tiene) están activas, conserva al menos una
 * subcategoría activa bajo una categoría activa y tiene alguna variante vendible.
 * Solo un combo puede no tener marca (RF-CAT-13-09).
 */
export function productoElegible(eb: EbProducto): Expression<SqlBool> {
  return eb.and([
    eb('p.estado', '=', 'activo'),
    eb('p.publicado', '=', true),
    eb.or([
      eb.and([eb('p.id_marca', 'is', null), esCombo(eb)]),
      eb.exists(
        eb.selectFrom('marca as m').whereRef('m.id_marca', '=', 'p.id_marca').where('m.estado', '=', 'activo').select('m.id_marca')
      ),
    ]),
    eb.or([
      eb('p.id_linea', 'is', null),
      eb.exists(
        eb.selectFrom('linea as l').whereRef('l.id_linea', '=', 'p.id_linea').where('l.estado', '=', 'activo').select('l.id_linea')
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
    eb.exists(variantesVendibles(eb.ref('p.id_producto')).select('vv.id_variante')),
  ]);
}

/** HU-CAT-13: el producto está registrado como combo. */
export function esCombo(eb: EbProducto) {
  return eb
    .exists(eb.selectFrom('combo as cb').whereRef('cb.id_producto', '=', 'p.id_producto').select('cb.id_combo'))
    .$castTo<boolean>();
}

/**
 * RF-CAT-13-04 / CA-CAT-13-06: combo sin unidades en ninguna de las variantes
 * que la ficha ofrece. Una variante no vendible con existencia no lo hace
 * disponible (M01-08 B).
 */
export function comboAgotado(eb: EbProducto) {
  return eb
    .and([
      esCombo(eb),
      eb.not(
        eb.exists(
          variantesVendibles(eb.ref('p.id_producto')).where('vv.existencia_referencial', '>', 0).select('vv.id_variante')
        )
      ),
    ])
    .$castTo<boolean>();
}

/**
 * RF-CAT-12-04/06/12/13: variantes vendibles de entonado (sin color propio)
 * sobre las que se prepara el color. Una variante con base sirve si la base está
 * declarada para el color en color_base; una variante sin base sirve a un color
 * declarado «sin base» (productos transparentes). La base sale del catálogo de
 * colores, no de quien prepara la mezcla.
 */
export function variantesPreparables(idProducto: Id, idColor: Id, origen: OrigenConsulta = consulta) {
  return variantesVendibles(idProducto, origen).where('vv.id_color', 'is', null).where((eb) =>
    eb.or([
      eb.and([
        eb('vv.id_base', 'is not', null),
        eb.exists(
          eb
            .selectFrom('color_base as cb')
            .whereRef('cb.id_base', '=', 'vv.id_base')
            .where('cb.id_color', '=', idColor)
            .select('cb.id_base')
        ),
      ]),
      eb.and([
        eb('vv.id_base', 'is', null),
        eb.exists(
          eb.selectFrom('color as cs').where('cs.id_color', '=', idColor).where('cs.sin_base', '=', true).select('cs.id_color')
        ),
      ]),
    ])
  );
}

/** RF-CAT-06-04 / RF-CAT-12-06: el color `c` puede prepararse en el producto. */
export function colorPreparable(eb: EbColor, idProducto: Id) {
  return eb.exists(variantesPreparables(idProducto, eb.ref('c.id_color')).select('vv.id_variante'));
}

/** Lo que se va a desactivar: una categoría (con sus subcategorías) o una subcategoría. */
export type RetiroClasificacion = { readonly idCategoria: number } | { readonly idSubcategoria: number };

/**
 * RF-CAT-01-04 / CA-CAT-01-05/06 (M01-02): el producto es visible hoy, está
 * clasificado en lo que se retira y no conserva ninguna otra subcategoría
 * activa bajo una categoría activa; es decir, dejaría de verse. Un producto ya
 * oculto (no publicado, sin variante vendible, con marca o línea inactiva) no
 * se cuenta.
 */
export function dejaDeVerse(eb: EbProducto, retiro: RetiroClasificacion): Expression<SqlBool> {
  const idProducto = eb.ref('p.id_producto');
  return eb.and([
    productoElegible(eb),
    eb.exists(
      consulta
        .selectFrom('producto_subcategoria as pr')
        .innerJoin('subcategorias as sr', 'sr.id_subcategoria', 'pr.id_subcategoria')
        .where('pr.id_producto', '=', idProducto)
        .where('sr.estado', '=', 'activo')
        .where((e) =>
          'idCategoria' in retiro ? e('sr.id_categoria', '=', retiro.idCategoria) : e('sr.id_subcategoria', '=', retiro.idSubcategoria)
        )
        .select('pr.id_producto')
    ),
    eb.not(
      eb.exists(
        consulta
          .selectFrom('producto_subcategoria as pq')
          .innerJoin('subcategorias as sq', 'sq.id_subcategoria', 'pq.id_subcategoria')
          .innerJoin('categoria as cq', 'cq.id_categoria', 'sq.id_categoria')
          .where('pq.id_producto', '=', idProducto)
          .where('sq.estado', '=', 'activo')
          .where('cq.estado', '=', 'activo')
          .where((e) =>
            'idCategoria' in retiro ? e('sq.id_categoria', '!=', retiro.idCategoria) : e('sq.id_subcategoria', '!=', retiro.idSubcategoria)
          )
          .select('pq.id_producto')
      )
    ),
  ]);
}
