import { Kysely, sql, SqlBool } from 'kysely';
import { Database } from '../../../core/db/types';
import {
  CabeceraOrden,
  ContactoCliente,
  FilaConteoEstado,
  FilaContactoOrden,
  FilaDescuentoLinea,
  FilaHistorialEstado,
  FilaLineaOrden,
  FilaNotaOrden,
  FilaResumenOrden,
  FilaResumenOrdenGestion,
  FiltrosGestionOrdenes,
  OrdenListado,
  SolicitudCambioEstado,
} from '../interfaces/m08.interfaces';

// ==============================================================================
// M08 - REPOSITORIO DE ÓRDENES (HU-ORD-03, 04, 05, 07, 08, 09, 10 y 11)
// Las líneas se leen de `linea_orden`, que guarda la copia de la compra, sin unir con
// el catálogo vivo (ADR-05, CA-ORD-02-01). Del titular solo se leen los datos de
// contacto que pide el personal (CA-ORD-09-01), nunca credenciales.
// Escrituras: solo el estado de la orden y la inserción en `historial_estado_orden`,
// `nota_orden` y `contacto_orden`. Ninguna de esas tres tablas se actualiza ni se borra.
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
        'codigo_solicitud',
        'modo_entrega',
        'costo_entrega',
        'direccion',
        'sub_total',
        'descuento',
        'total',
        'base_sin_impuesto',
        'importe_iva',
        'tasa_iva',
        'observaciones',
        'fecha',
      ])
      .where('codigo_visible', '=', codigo)
      .executeTakeFirst();
  }

  /**
   * Líneas de la orden en el orden en que se registraron, con la copia histórica completa
   * (HU-ORD-02). Del catálogo vivo solo se lee el estado de la variante y del producto
   * referenciados, para saber si siguen disponibles (RF-ORD-04-03); nada de lo mostrado
   * sale del catálogo.
   */
  async listarLineas(idOrden: number): Promise<FilaLineaOrden[]> {
    return this.db
      .selectFrom('linea_orden as l')
      .leftJoin('variante as v', 'v.id_variante', 'l.id_variante_ref')
      .leftJoin('producto as p', 'p.id_producto', 'v.id_producto')
      .select([
        'l.id_linea_orden',
        'l.nombre_producto',
        'l.variante_copia',
        'l.precio_aplicado',
        'l.cantidad',
        'l.color_solicitado',
        'l.precio_inicial',
        'l.id_variante_ref',
        'l.es_entonado',
        'l.base_consumida',
        'v.estado as variante_estado',
        'p.id_producto as producto_id',
        'p.estado as producto_estado',
        'p.publicado as producto_publicado',
      ])
      .where('l.id_orden', '=', idOrden)
      .orderBy('l.id_linea_orden', 'asc')
      .execute();
  }

  /** Descuentos de las líneas indicadas, en su orden de aplicación (RF-ORD-02-02). */
  async listarDescuentos(idsLineas: ReadonlyArray<number>): Promise<FilaDescuentoLinea[]> {
    if (idsLineas.length === 0) {
      return [];
    }
    return this.db
      .selectFrom('linea_orden_descuento')
      .select(['id_linea_orden', 'orden_aplicacion', 'origen', 'porcentaje', 'importe'])
      .where('id_linea_orden', 'in', [...idsLineas])
      .orderBy('id_linea_orden', 'asc')
      .orderBy('orden_aplicacion', 'asc')
      .execute();
  }

  /** Contacto del titular para el personal (CA-ORD-09-01). Sin contraseña ni datos de rol. */
  async buscarContactoCliente(idUsuario: number): Promise<ContactoCliente | undefined> {
    return this.db
      .selectFrom('usuario')
      .select(['nombre', 'correo', 'telefono'])
      .where('id_usuario', '=', idUsuario)
      .executeTakeFirst();
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

  /**
   * Página del listado del personal (HU-ORD-05, HU-ORD-08, HU-ORD-11). `recientes`
   * ordena de la más nueva a la más antigua; `antiguedad`, al revés (CA-ORD-05-07).
   * Cada fila trae el nombre del titular (RF-ORD-05-05) y su último cambio de estado.
   */
  async listarParaPersonal(
    filtros: FiltrosGestionOrdenes,
    limite: number,
    offset: number,
    orden: OrdenListado = 'recientes'
  ): Promise<FilaResumenOrdenGestion[]> {
    const direccion = orden === 'antiguedad' ? 'asc' : 'desc';
    return this.baseGestion(filtros)
      .select(['o.codigo_visible', 'o.fecha', 'o.total', 'o.estado', 'o.id_usuario', 'o.modo_entrega'])
      .select((eb) =>
        eb
          .selectFrom('usuario as titular')
          .whereRef('titular.id_usuario', '=', 'o.id_usuario')
          .select('titular.nombre')
          .as('nombre_cliente')
      )
      .select((eb) =>
        eb
          .selectFrom('historial_estado_orden as h')
          .whereRef('h.id_orden', '=', 'o.id_orden')
          .select(({ fn }) => fn.max('h.fecha').as('fecha'))
          .as('ultimo_cambio')
      )
      .orderBy('o.fecha', direccion)
      .orderBy('o.id_orden', direccion)
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

  /** Número de órdenes por estado para los contadores del panel (CA-ORD-05-05). */
  async contarPorEstado(): Promise<FilaConteoEstado[]> {
    const filas = await this.db
      .selectFrom('orden')
      .select(({ fn }) => ['estado', fn.countAll<string>().as('total')])
      .groupBy('estado')
      .execute();
    return filas.map((f) => ({ estado: f.estado, total: Number(f.total) }));
  }

  /** Historial de estados en orden cronológico, con el nombre del autor (CA-ORD-09-02). */
  async listarHistorial(idOrden: number): Promise<FilaHistorialEstado[]> {
    return this.db
      .selectFrom('historial_estado_orden as h')
      .leftJoin('usuario as u', 'u.id_usuario', 'h.id_usuario_autor')
      .select(['h.estado_anterior', 'h.estado_nuevo', 'u.nombre as autor', 'h.motivo', 'h.fecha'])
      .where('h.id_orden', '=', idOrden)
      .orderBy('h.fecha', 'asc')
      .orderBy('h.id_historial_estado_orden', 'asc')
      .execute();
  }

  /** Notas internas en orden cronológico, con el nombre de quien las escribió (CA-ORD-10-02). */
  async listarNotas(idOrden: number): Promise<FilaNotaOrden[]> {
    return this.db
      .selectFrom('nota_orden as n')
      .innerJoin('usuario as u', 'u.id_usuario', 'n.id_usuario_autor')
      .select(['n.texto', 'u.nombre as autor', 'n.fecha'])
      .where('n.id_orden', '=', idOrden)
      .orderBy('n.fecha', 'asc')
      .orderBy('n.id_nota_orden', 'asc')
      .execute();
  }

  /** Contactos con el cliente en orden cronológico (CA-ORD-09-03). */
  async listarContactos(idOrden: number): Promise<FilaContactoOrden[]> {
    return this.db
      .selectFrom('contacto_orden as c')
      .innerJoin('usuario as u', 'u.id_usuario', 'c.id_usuario_autor')
      .select(['c.medio', 'c.detalle', 'u.nombre as autor', 'c.fecha'])
      .where('c.id_orden', '=', idOrden)
      .orderBy('c.fecha', 'asc')
      .orderBy('c.id_contacto_orden', 'asc')
      .execute();
  }

  /**
   * Cambia el estado y registra la transición en el historial, en una sola transacción
   * (CA-ORD-03-04). El `UPDATE` solo afecta a la orden si sigue en `estadoActual`: si otra
   * persona la cambió entre la lectura y la escritura no se modifica nada y se devuelve
   * `undefined` (CA-ORD-05-08). Devuelve el momento registrado en el historial.
   */
  async cambiarEstado(s: SolicitudCambioEstado): Promise<Date | undefined> {
    return this.enTransaccion(async (trx) => {
      const resultado = await trx
        .updateTable('orden')
        .set({ estado: s.estadoNuevo })
        .where('id_orden', '=', s.idOrden)
        .where('estado', '=', s.estadoActual)
        .executeTakeFirst();
      if (Number(resultado.numUpdatedRows) === 0) {
        return undefined;
      }

      const registro = await trx
        .insertInto('historial_estado_orden')
        .values({
          id_orden: s.idOrden,
          estado_anterior: s.estadoActual,
          estado_nuevo: s.estadoNuevo,
          id_usuario_autor: s.idAutor,
          motivo: s.motivo,
        })
        .returning('fecha')
        .executeTakeFirstOrThrow();
      return registro.fecha;
    });
  }

  /** Añade una nota interna (HU-ORD-10). No existe operación para editarla ni borrarla. */
  async crearNota(idOrden: number, idAutor: number, texto: string): Promise<FilaNotaOrden> {
    return this.enTransaccion(async (trx) => {
      const { fecha } = await trx
        .insertInto('nota_orden')
        .values({ id_orden: idOrden, id_usuario_autor: idAutor, texto })
        .returning('fecha')
        .executeTakeFirstOrThrow();
      const { nombre } = await this.nombreDeUsuario(trx, idAutor);
      return { texto, autor: nombre, fecha };
    });
  }

  /** Registra un contacto con el cliente iniciado desde la orden (CA-ORD-09-03). */
  async registrarContacto(
    idOrden: number,
    idAutor: number,
    medio: string,
    detalle: string | null
  ): Promise<FilaContactoOrden> {
    return this.enTransaccion(async (trx) => {
      const { fecha } = await trx
        .insertInto('contacto_orden')
        .values({ id_orden: idOrden, id_usuario_autor: idAutor, medio, detalle })
        .returning('fecha')
        .executeTakeFirstOrThrow();
      const { nombre } = await this.nombreDeUsuario(trx, idAutor);
      return { medio, detalle, autor: nombre, fecha };
    });
  }

  private async nombreDeUsuario(db: Kysely<Database>, idUsuario: number): Promise<{ nombre: string }> {
    return db.selectFrom('usuario').select('nombre').where('id_usuario', '=', idUsuario).executeTakeFirstOrThrow();
  }

  /**
   * Ejecuta en una transacción nueva o, si el repositorio ya trabaja dentro de una, en
   * esa misma. Así las pruebas de integración pueden deshacer todo al terminar.
   */
  private enTransaccion<T>(trabajo: (db: Kysely<Database>) => Promise<T>): Promise<T> {
    return this.db.isTransaction ? trabajo(this.db) : this.db.transaction().execute(trabajo);
  }

  /**
   * Base del listado del personal. Cada filtro presente se suma con AND. El periodo
   * compara con la columna DATE sin conversión de zona horaria (extremos incluidos).
   * Correo y teléfono se comprueban con EXISTS sobre `usuario`, sin traer sus columnas.
   */
  private baseGestion(f: FiltrosGestionOrdenes) {
    let q = this.db.selectFrom('orden as o');

    if (f.codigo) q = q.where('o.codigo_visible', 'ilike', patronContiene(f.codigo));
    if (f.estado) q = q.where('o.estado', '=', f.estado);
    if (f.idCliente !== undefined) q = q.where('o.id_usuario', '=', f.idCliente);
    if (f.excluirIdOrden !== undefined) q = q.where('o.id_orden', '<>', f.excluirIdOrden);
    if (f.desde) q = q.where(sql<SqlBool>`o.fecha >= ${f.desde}::date`);
    if (f.hasta) q = q.where(sql<SqlBool>`o.fecha <= ${f.hasta}::date`);

    const correo = f.correoCliente;
    if (correo) {
      q = q.where((eb) =>
        eb.exists(
          eb
            .selectFrom('usuario as u')
            .whereRef('u.id_usuario', '=', 'o.id_usuario')
            .where(sql<SqlBool>`lower(u.correo) = lower(${correo})`)
            .select('u.id_usuario')
        )
      );
    }

    const telefono = f.telefonoCliente;
    if (telefono) {
      q = q.where((eb) =>
        eb.exists(
          eb
            .selectFrom('usuario as u')
            .whereRef('u.id_usuario', '=', 'o.id_usuario')
            .where(sql<SqlBool>`regexp_replace(coalesce(u.telefono, ''), '\\s', '', 'g') = ${telefono}`)
            .select('u.id_usuario')
        )
      );
    }

    return q;
  }
}
