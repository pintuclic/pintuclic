import { Kysely } from 'kysely';
import {
  AvisoPrivacidad,
  Database,
  EnumEstadoSolicitudSupresion,
  SolicitudSupresion,
} from '../../../core/db/types';
import { ConsentimientoRegistrado } from '../interfaces/privacidad.interfaces';

/**
 * Repositorio de protección de datos personales (M20 - HU-SEG-05).
 *
 * Único punto del submódulo que habla con PostgreSQL. Cubre las tres tablas del
 * esquema v2.3: `aviso_privacidad`, `consentimiento_usuario` y `solicitud_supresion`.
 */
export class PrivacidadRepository {
  constructor(private readonly db: Kysely<Database>) {}

  /**
   * Aviso de privacidad vigente (RF-SEG-05-03).
   *
   * Si hubiera más de uno marcado como vigente por un error de datos, se toma el de
   * mayor identificador: es preferible servir el más reciente que fallar y dejar el
   * registro de usuarios bloqueado.
   */
  async obtenerAvisoVigente(): Promise<AvisoPrivacidad | undefined> {
    return this.db
      .selectFrom('aviso_privacidad')
      .selectAll()
      .where('es_vigente', '=', true)
      .orderBy('id_aviso_privacidad', 'desc')
      .executeTakeFirst();
  }

  async obtenerAvisoPorVersion(version: string): Promise<AvisoPrivacidad | undefined> {
    return this.db
      .selectFrom('aviso_privacidad')
      .selectAll()
      .where('version', '=', version)
      .executeTakeFirst();
  }

  /**
   * Registra la aceptación de una versión concreta del aviso (RF-SEG-05-01, RF-SEG-05-02).
   *
   * `uq_usuario_aviso` impide duplicar la aceptación de una misma versión: si el usuario
   * ya la había aceptado, se conserva la fecha original. El consentimiento es un hecho
   * histórico y no debe reescribirse.
   *
   * @returns `true` si se creó un registro nuevo; `false` si ya existía.
   */
  async registrarConsentimiento(idUsuario: number, idAviso: number): Promise<boolean> {
    const fila = await this.db
      .insertInto('consentimiento_usuario')
      .values({ id_usuario: idUsuario, id_aviso_privacidad: idAviso })
      .onConflict((oc) => oc.columns(['id_usuario', 'id_aviso_privacidad']).doNothing())
      .returning('id_consentimiento')
      .executeTakeFirst();

    return fila !== undefined;
  }

  /**
   * Histórico completo de consentimientos del usuario, del más reciente al más antiguo.
   */
  async listarConsentimientos(idUsuario: number): Promise<ConsentimientoRegistrado[]> {
    const filas = await this.db
      .selectFrom('consentimiento_usuario as cu')
      .innerJoin('aviso_privacidad as ap', 'ap.id_aviso_privacidad', 'cu.id_aviso_privacidad')
      .select(['ap.version', 'cu.fecha'])
      .where('cu.id_usuario', '=', idUsuario)
      .orderBy('cu.fecha', 'desc')
      .execute();

    return filas.map((fila) => ({
      version: fila.version,
      fecha: fila.fecha.toISOString(),
    }));
  }

  /**
   * Comprueba si el usuario aceptó una versión concreta del aviso.
   */
  async obtenerFechaAceptacion(idUsuario: number, idAviso: number): Promise<Date | undefined> {
    const fila = await this.db
      .selectFrom('consentimiento_usuario')
      .select('fecha')
      .where('id_usuario', '=', idUsuario)
      .where('id_aviso_privacidad', '=', idAviso)
      .executeTakeFirst();

    return fila?.fecha;
  }

  /**
   * Solicitud de supresión sin resolver del usuario, si la tiene.
   * Evita que un mismo titular acumule peticiones idénticas en trámite.
   */
  async obtenerSolicitudAbierta(idUsuario: number): Promise<SolicitudSupresion | undefined> {
    return this.db
      .selectFrom('solicitud_supresion')
      .selectAll()
      .where('id_usuario', '=', idUsuario)
      .where('estado', 'in', ['pendiente', 'en_proceso'])
      .orderBy('fecha_solicitud', 'desc')
      .executeTakeFirst();
  }

  async crearSolicitudSupresion(idUsuario: number): Promise<SolicitudSupresion> {
    return this.db
      .insertInto('solicitud_supresion')
      .values({ id_usuario: idUsuario })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async listarSolicitudesDeUsuario(idUsuario: number): Promise<SolicitudSupresion[]> {
    return this.db
      .selectFrom('solicitud_supresion')
      .selectAll()
      .where('id_usuario', '=', idUsuario)
      .orderBy('fecha_solicitud', 'desc')
      .execute();
  }

  async listarSolicitudesPendientes(): Promise<SolicitudSupresion[]> {
    return this.db
      .selectFrom('solicitud_supresion')
      .selectAll()
      .where('estado', 'in', ['pendiente', 'en_proceso'])
      .orderBy('fecha_solicitud', 'asc')
      .execute();
  }

  /**
   * Resuelve una solicitud. `fecha_resolucion` solo se sella cuando la petición sale
   * de trámite; `en_proceso` la deja abierta.
   */
  async resolverSolicitud(
    idSolicitud: number,
    estado: EnumEstadoSolicitudSupresion
  ): Promise<SolicitudSupresion | undefined> {
    const enTramite = estado === 'en_proceso';

    return this.db
      .updateTable('solicitud_supresion')
      .set({
        estado,
        fecha_resolucion: enTramite ? null : new Date(),
      })
      .where('id_solicitud_supresion', '=', idSolicitud)
      .returningAll()
      .executeTakeFirst();
  }

  /**
   * Cuenta las órdenes de venta asociadas al usuario.
   *
   * Es la bifurcación "¿Tiene órdenes de ventas asociadas?" del diagrama de HU-SEG-05:
   * si las tiene, la información comercial debe conservarse por obligación legal y solo
   * puede desvincularse de la identidad del titular (RF-SEG-05-07).
   */
  async contarOrdenesDeUsuario(idUsuario: number): Promise<number> {
    const fila = await this.db
      .selectFrom('orden')
      .select((eb) => eb.fn.countAll<string>().as('total'))
      .where('id_usuario', '=', idUsuario)
      .executeTakeFirst();

    return Number(fila?.total ?? 0);
  }
}
