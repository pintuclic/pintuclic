import { Kysely, sql, SqlBool } from 'kysely';
import { Database } from '../../../core/db/types';
import {
  CabeceraOrden,
  FilaLineaOrden,
  FilaResumenOrden,
  FilaResumenOrdenGestion,
  FiltrosGestionOrdenes,
} from '../interfaces/m08.interfaces';

// ==============================================================================
// M08 - REPOSITORIO DE ÓRDENES (HU-ORD-04, HU-ORD-05, HU-ORD-07)
// Solo lectura. Las líneas se leen de `linea_orden`, que guarda la copia de la
// compra, sin unir con el catálogo vivo (ADR-05, CA-ORD-02-01).
// ==============================================================================

/** Escapa los comodines de LIKE para que el texto del usuario se busque de forma literal. */
function patronContiene(texto: string): string {
  return `%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export class OrdenesRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /** Cabecera de la orden con ese código visible, sea de quien sea (la titularidad la decide el servicio). */
  async buscarPorCodigo(codigo: string): Promise<CabeceraOrden | undefined> {
    return this.db
      .selectFrom('orden')
      .select([
        'id_orden',
        'codigo_visible',
        'id_usuario',
        'origen',
        'estado',
        'direccion',
        'sub_total',
        'descuento',
        'total',
        'observaciones',
        'fecha',
      ])
      .where('codigo_visible', '=', codigo)
      .executeTakeFirst();
  }

  /** Líneas de la orden en el orden en que se registraron. */
  async listarLineas(idOrden: number): Promise<FilaLineaOrden[]> {
    return this.db
      .selectFrom('linea_orden')
      .select(['nombre_producto', 'variante_copia', 'precio_aplicado', 'cantidad'])
      .where('id_orden', '=', idOrden)
      .orderBy('id_linea_orden', 'asc')
      .execute();
  }

  /**
   * Pedidos de un único cliente, más recientes primero (CA-ORD-07-01). El filtro por
   * `id_usuario` va siempre en la consulta: nunca se leen órdenes ajenas (CA-SEG-06-05).
   * El término busca en el código visible y en los productos copiados (CA-ORD-07-03).
   */
  async listarDeCliente(idUsuario: number, termino: string | undefined): Promise<FilaResumenOrden[]> {
    let q = this.db
      .selectFrom('orden as o')
      .select(['o.codigo_visible', 'o.fecha', 'o.total', 'o.estado'])
      .where('o.id_usuario', '=', idUsuario);

    if (termino) {
      const patron = patronContiene(termino);
      q = q.where((eb) =>
        eb.or([
          eb('o.codigo_visible', 'ilike', patron),
          eb.exists(
            eb
              .selectFrom('linea_orden as l')
              .whereRef('l.id_orden', '=', 'o.id_orden')
              .where((sub) =>
                sub.or([sub('l.nombre_producto', 'ilike', patron), sub('l.variante_copia', 'ilike', patron)])
              )
              .select('l.id_linea_orden')
          ),
        ])
      );
    }

    return q.orderBy('o.fecha', 'desc').orderBy('o.id_orden', 'desc').execute();
  }

  /** Página del listado del personal, más recientes primero (HU-ORD-05, CA-ORD-05-04). */
  async listarParaPersonal(
    filtros: FiltrosGestionOrdenes,
    limite: number,
    offset: number
  ): Promise<FilaResumenOrdenGestion[]> {
    return this.baseGestion(filtros)
      .select(['o.codigo_visible', 'o.fecha', 'o.total', 'o.estado', 'o.id_usuario'])
      .orderBy('o.fecha', 'desc')
      .orderBy('o.id_orden', 'desc')
      .limit(limite)
      .offset(offset)
      .execute();
  }

  async contarParaPersonal(filtros: FiltrosGestionOrdenes): Promise<number> {
    const fila = await this.baseGestion(filtros)
      .select(({ fn }) => fn.countAll<string>().as('total'))
      .executeTakeFirst();
    return Number(fila?.total ?? 0);
  }

  /**
   * Base del listado del personal. Cada filtro presente se suma con AND. El periodo
   * compara con la columna DATE sin conversión de zona horaria (extremos incluidos).
   */
  private baseGestion(f: FiltrosGestionOrdenes) {
    let q = this.db.selectFrom('orden as o');

    if (f.codigo) q = q.where('o.codigo_visible', 'ilike', patronContiene(f.codigo));
    if (f.estado) q = q.where('o.estado', '=', f.estado);
    if (f.idCliente !== undefined) q = q.where('o.id_usuario', '=', f.idCliente);
    if (f.desde) q = q.where(sql<SqlBool>`o.fecha >= ${f.desde}::date`);
    if (f.hasta) q = q.where(sql<SqlBool>`o.fecha <= ${f.hasta}::date`);

    return q;
  }
}
