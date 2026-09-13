import { Kysely } from 'kysely';
import {
  Database,
  EnumMotivoCierreSesion,
  EnumTipoSesion,
  Sesion,
} from '../../../core/db/types';

/** Un `id_sesion` con forma distinta a un UUID ni siquiera llega a consultarse. */
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esIdentificadorDeSesion(valor: string): boolean {
  return FORMATO_UUID.test(valor);
}

/**
 * Repositorio de la tabla `sesion` (M20 - HU-SEG-02).
 *
 * Es el único punto del módulo que escribe el estado de sesión. Aísla al servicio de
 * Kysely y garantiza que las transiciones de estado del diagrama
 * `HU-SEG-02_gestion_sesion.png` ocurran en un solo lugar.
 */
export class SesionRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Abre una sesión nueva (nodo 2 del diagrama) y devuelve su identificador.
   * Cada llamada crea una fila independiente: por eso el mismo usuario puede tener
   * varias sesiones simultáneas en distintos dispositivos (RF-SEG-02-05).
   */
  async abrir(idUsuario: number, tipo: EnumTipoSesion, expiracion: Date): Promise<string> {
    const fila = await this.db
      .insertInto('sesion')
      .values({
        id_usuario: idUsuario,
        tipo_sesion: tipo,
        fecha_expiracion: expiracion,
      })
      .returning('id_sesion')
      .executeTakeFirstOrThrow();

    return fila.id_sesion;
  }

  async obtener(idSesion: string): Promise<Sesion | undefined> {
    if (!esIdentificadorDeSesion(idSesion)) {
      return undefined;
    }

    return this.db
      .selectFrom('sesion')
      .selectAll()
      .where('id_sesion', '=', idSesion)
      .executeTakeFirst();
  }

  /**
   * Renueva la vigencia ante una operación del usuario (nodo 5 del diagrama):
   * actualiza el último acceso y corre la expiración hacia adelante (RF-SEG-02-03).
   */
  async renovar(idSesion: string, ahora: Date, expiracion: Date): Promise<void> {
    await this.db
      .updateTable('sesion')
      .set({ fecha_ultimo_acceso: ahora, fecha_expiracion: expiracion })
      .where('id_sesion', '=', idSesion)
      .where('estado', '=', 'activa')
      .execute();
  }

  /**
   * Cierra una sesión concreta (nodo 4.A del diagrama, RF-SEG-02-04).
   * Solo actúa sobre sesiones activas, de modo que repetir la llamada es inocuo.
   */
  async cerrar(idSesion: string, motivo: EnumMotivoCierreSesion): Promise<boolean> {
    if (!esIdentificadorDeSesion(idSesion)) {
      return false;
    }

    const resultado = await this.db
      .updateTable('sesion')
      .set({ estado: motivo === 'inactividad' ? 'expirada' : 'cerrada', motivo_cierre: motivo })
      .where('id_sesion', '=', idSesion)
      .where('estado', '=', 'activa')
      .executeTakeFirst();

    return Number(resultado.numUpdatedRows) > 0;
  }

  /**
   * Invalida TODAS las sesiones activas de un usuario (nodo 6.A del diagrama).
   *
   * Es la pieza que exigen RF-SEG-01-06 (cambio de contraseña) y RF-SEG-02-06
   * (cuenta desactivada o permisos retirados).
   *
   * @param exceptuar Sesión que debe sobrevivir; útil para que quien cambia su propia
   *                  contraseña no se expulse a sí mismo del dispositivo en uso.
   * @returns Número de sesiones invalidadas.
   */
  async cerrarTodasDelUsuario(
    idUsuario: number,
    motivo: EnumMotivoCierreSesion,
    exceptuar?: string
  ): Promise<number> {
    let consulta = this.db
      .updateTable('sesion')
      .set({ estado: 'revocada', motivo_cierre: motivo })
      .where('id_usuario', '=', idUsuario)
      .where('estado', '=', 'activa');

    if (exceptuar && esIdentificadorDeSesion(exceptuar)) {
      consulta = consulta.where('id_sesion', '!=', exceptuar);
    }

    const resultado = await consulta.executeTakeFirst();
    return Number(resultado.numUpdatedRows);
  }

  /**
   * Sesiones vigentes de un usuario, de la más reciente a la más antigua.
   * No expone datos sensibles: solo metadatos del propio dueño de la sesión.
   */
  async listarActivas(idUsuario: number): Promise<Sesion[]> {
    return this.db
      .selectFrom('sesion')
      .selectAll()
      .where('id_usuario', '=', idUsuario)
      .where('estado', '=', 'activa')
      .orderBy('fecha_ultimo_acceso', 'desc')
      .execute();
  }
}
