import { Kysely } from 'kysely';
import {
  Database,
  Carrito,
  NewCarrito,
  CarritoUpdate,
} from '../../../core/db/types';

// ==============================================================================
// M05 - REPOSITORIO DE CABECERA DE CARRITO (Kysely + PostgreSQL)
// Operaciones sobre la tabla 'carrito' — identificación de visitante y cliente
// ==============================================================================

export class CarritoRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Busca el carrito activo de un visitante anónimo por su token opaco (RF-CAR-01-03).
   */
  async buscarPorToken(tokenVisitante: string): Promise<Carrito | undefined> {
    return this.db
      .selectFrom('carrito')
      .selectAll()
      .where('token_visitante', '=', tokenVisitante)
      .executeTakeFirst();
  }

  /**
   * Busca el carrito activo asociado a un cliente autenticado (HU-CAR-04).
   */
  async buscarPorUsuario(idUsuario: number): Promise<Carrito | undefined> {
    return this.db
      .selectFrom('carrito')
      .selectAll()
      .where('id_usuario', '=', idUsuario)
      .executeTakeFirst();
  }

  /**
   * Busca un carrito por su identificador primario.
   */
  async buscarPorId(idCarrito: number): Promise<Carrito | undefined> {
    return this.db
      .selectFrom('carrito')
      .selectAll()
      .where('id_carrito', '=', idCarrito)
      .executeTakeFirst();
  }

  /**
   * Crea un nuevo carrito (visitante o cliente).
   */
  async crear(datos: NewCarrito): Promise<Carrito> {
    return this.db
      .insertInto('carrito')
      .values(datos)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  /**
   * Actualiza datos de la cabecera del carrito (ej: asociar id_usuario tras login).
   */
  async actualizar(idCarrito: number, cambios: CarritoUpdate): Promise<Carrito | undefined> {
    return this.db
      .updateTable('carrito')
      .set(cambios)
      .where('id_carrito', '=', idCarrito)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Actualiza la fecha de última actividad del carrito (mantiene sesión de carrito viva).
   */
  async refrescarActividad(idCarrito: number): Promise<void> {
    await this.db
      .updateTable('carrito')
      .set({ fecha_ultima_actividad: new Date() })
      .where('id_carrito', '=', idCarrito)
      .execute();
  }

  /**
   * Elimina un carrito completo y en cascada todas sus líneas (ON DELETE CASCADE en BD).
   */
  async eliminar(idCarrito: number): Promise<void> {
    await this.db
      .deleteFrom('carrito')
      .where('id_carrito', '=', idCarrito)
      .execute();
  }
}
