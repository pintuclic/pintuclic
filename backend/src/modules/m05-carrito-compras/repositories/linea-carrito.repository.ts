import { Kysely } from 'kysely';
import {
  Database,
  LineaCarrito,
  NewLineaCarrito,
  LineaCarritoUpdate,
} from '../../../core/db/types';
import { LineaCarritoViva } from '../interfaces/m05.interfaces';

// ==============================================================================
// M05 - REPOSITORIO DE LÍNEAS DEL CARRITO (Kysely + PostgreSQL)
// Operaciones sobre 'linea_carrito' con join vivo a 'variante' para precio
// y existencia en tiempo real (RF-CAR-05-04: carrito vivo, sin precio congelado)
// ==============================================================================

export class LineaCarritoRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Lista todas las líneas vivas de un carrito enriquecidas con datos de la variante.
   * Precio y existencia se leen dinámicamente desde la tabla variante (HU-CAR-05 / RF-CAR-05-04).
   */
  async listarLineasVivas(idCarrito: number): Promise<LineaCarritoViva[]> {
    const filas = await this.db
      .selectFrom('linea_carrito')
      .innerJoin('variante', 'variante.id_variante', 'linea_carrito.id_variante')
      .select([
        'linea_carrito.id_linea_carrito',
        'linea_carrito.id_variante',
        'linea_carrito.cantidad',
        'variante.precio_vigente',
        'variante.existencia_referencial',
        'variante.estado',
      ])
      .where('linea_carrito.id_carrito', '=', idCarrito)
      .execute();

    return filas.map((fila) => {
      const precioUnitario = Number(fila.precio_vigente);
      const subtotal = (precioUnitario * fila.cantidad).toFixed(2);

      return {
        id_linea_carrito: fila.id_linea_carrito,
        id_variante: fila.id_variante,
        cantidad: fila.cantidad,
        precio_unitario_vigente: precioUnitario.toFixed(2),
        subtotal,
        existencia_referencial: fila.existencia_referencial,
        estado_variante: fila.estado,
      };
    });
  }

  /**
   * Busca una línea concreta dentro de un carrito por su variante (para acumulación HU-CAR-02).
   */
  async buscarPorVariante(
    idCarrito: number,
    idVariante: number
  ): Promise<LineaCarrito | undefined> {
    return this.db
      .selectFrom('linea_carrito')
      .selectAll()
      .where('id_carrito', '=', idCarrito)
      .where('id_variante', '=', idVariante)
      .executeTakeFirst();
  }

  /**
   * Busca una línea por su identificador primario.
   */
  async buscarPorId(idLineaCarrito: number): Promise<LineaCarrito | undefined> {
    return this.db
      .selectFrom('linea_carrito')
      .selectAll()
      .where('id_linea_carrito', '=', idLineaCarrito)
      .executeTakeFirst();
  }

  /**
   * Crea una nueva línea en el carrito.
   * La constraint uq_carrito_variante en BD previene duplicados (RF-CAR-02-0X).
   */
  async crear(datos: NewLineaCarrito): Promise<LineaCarrito> {
    return this.db
      .insertInto('linea_carrito')
      .values(datos)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Actualiza la cantidad de una línea existente.
   */
  async actualizarCantidad(
    idLineaCarrito: number,
    cambios: LineaCarritoUpdate
  ): Promise<LineaCarrito | undefined> {
    return this.db
      .updateTable('linea_carrito')
      .set(cambios)
      .where('id_linea_carrito', '=', idLineaCarrito)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Elimina una línea del carrito (HU-CAR-02: eliminar ítem).
   */
  async eliminar(idLineaCarrito: number): Promise<void> {
    await this.db
      .deleteFrom('linea_carrito')
      .where('id_linea_carrito', '=', idLineaCarrito)
      .execute();
  }

  /**
   * Transfiere todas las líneas de un carrito origen a un carrito destino (HU-CAR-04: fusión).
   * Utiliza upsert (ON CONFLICT) para acumular si la variante ya existe en el destino.
   * Operación atómica en transacción.
   */
  async transferirLineas(
    idCarritoOrigen: number,
    idCarritoDestino: number
  ): Promise<{ acumuladas: number; transferidas: number }> {
    const lineasOrigen = await this.db
      .selectFrom('linea_carrito')
      .selectAll()
      .where('id_carrito', '=', idCarritoOrigen)
      .execute();

    if (lineasOrigen.length === 0) {
      return { acumuladas: 0, transferidas: 0 };
    }

    let acumuladas = 0;
    let transferidas = 0;

    await this.db.transaction().execute(async (trx) => {
      for (const linea of lineasOrigen) {
        const existente = await trx
          .selectFrom('linea_carrito')
          .select(['id_linea_carrito', 'cantidad'])
          .where('id_carrito', '=', idCarritoDestino)
          .where('id_variante', '=', linea.id_variante)
          .executeTakeFirst();

        if (existente) {
          // Acumular cantidad en la línea ya existente del carrito destino (RF-CAR-02-0X)
          await trx
            .updateTable('linea_carrito')
            .set({ cantidad: existente.cantidad + linea.cantidad })
            .where('id_linea_carrito', '=', existente.id_linea_carrito)
            .execute();
          acumuladas++;
        } else {
          // Transferir la línea nueva al carrito destino
          await trx
            .insertInto('linea_carrito')
            .values({
              id_carrito: idCarritoDestino,
              id_variante: linea.id_variante,
              cantidad: linea.cantidad,
            })
            .execute();
          transferidas++;
        }
      }
    });

    return { acumuladas, transferidas };
  }
}
