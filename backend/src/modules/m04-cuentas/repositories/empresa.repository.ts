import { randomUUID } from 'crypto';
import { Kysely, sql } from 'kysely';
import {
  Database,
  SolicitudEmpresa as DbSolicitudEmpresa,
  SolicitudActualizacionNit as DbSolicitudActualizacionNit,
} from '../../../core/db/types';
import {
  SolicitudEmpresa,
  SolicitudActualizacionNit,
  EstadoSolicitudEmpresa,
} from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - REPOSITORIO DE SOLICITUDES EMPRESA Y ACTUALIZACIÓN DE NIT (HU-CUE-03, 09)
// Persistencia híbrida (Kysely + Fallback en memoria)
// ==============================================================================

export class EmpresaRepository {
  private readonly memoriaSolicitudesEmpresa: Map<string, SolicitudEmpresa> = new Map();
  private readonly memoriaSolicitudesNit: Map<string, SolicitudActualizacionNit> = new Map();

  constructor(private readonly db?: Kysely<Database>) {}

  private mapearEmpresaDesdeDb(row: DbSolicitudEmpresa): SolicitudEmpresa {
    return {
      id_solicitud: row.id_solicitud,
      id_usuario: row.id_usuario,
      nombre_empresa: row.nombre_empresa,
      nombre_representante: row.nombre_representante,
      correo_empresarial: row.correo_empresarial,
      telefono: row.telefono,
      nit: row.nit,
      estado: row.estado,
      motivo_rechazo: row.motivo_rechazo,
      tipo_solicitud: row.tipo_solicitud,
      id_admin_revisor: row.id_admin_revisor,
      fecha_solicitud: row.fecha_solicitud instanceof Date ? row.fecha_solicitud.toISOString() : String(row.fecha_solicitud),
      fecha_revision: row.fecha_revision ? (row.fecha_revision instanceof Date ? row.fecha_revision.toISOString() : String(row.fecha_revision)) : null,
    };
  }

  private mapearNitDesdeDb(row: DbSolicitudActualizacionNit): SolicitudActualizacionNit {
    return {
      id_solicitud: row.id_solicitud,
      id_usuario: row.id_usuario,
      nit_anterior: row.nit_anterior,
      nit_nuevo: row.nit_nuevo,
      documento_adjunto_url: row.documento_adjunto_url,
      estado: row.estado,
      motivo_rechazo: row.motivo_rechazo,
      id_admin_revisor: row.id_admin_revisor,
      fecha_solicitud: row.fecha_solicitud instanceof Date ? row.fecha_solicitud.toISOString() : String(row.fecha_solicitud),
      fecha_revision: row.fecha_revision ? (row.fecha_revision instanceof Date ? row.fecha_revision.toISOString() : String(row.fecha_revision)) : null,
    };
  }

  /**
   * Registra una nueva solicitud de cuenta corporativa o ascenso (HU-CUE-03).
   */
  async crearSolicitud(
    datos: Omit<SolicitudEmpresa, 'id_solicitud' | 'fecha_solicitud' | 'estado'>
  ): Promise<SolicitudEmpresa> {
    if (this.db) {
      const id = randomUUID();
      const insertada = await this.db
        .insertInto('solicitud_empresa')
        .values({
          id_solicitud: id,
          id_usuario: datos.id_usuario,
          nombre_empresa: datos.nombre_empresa,
          nombre_representante: datos.nombre_representante,
          correo_empresarial: datos.correo_empresarial.trim().toLowerCase(),
          telefono: datos.telefono,
          nit: datos.nit.trim(),
          tipo_solicitud: datos.tipo_solicitud,
          estado: 'pendiente',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.mapearEmpresaDesdeDb(insertada);
    }

    const id = randomUUID();
    const solicitud: SolicitudEmpresa = {
      ...datos,
      id_solicitud: id,
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString(),
    };

    this.memoriaSolicitudesEmpresa.set(id, solicitud);
    return solicitud;
  }

  /**
   * Lista las solicitudes pendientes de revisión por el administrador (RF-CUE-09-01).
   */
  async listarPendientes(): Promise<SolicitudEmpresa[]> {
    if (this.db) {
      const filas = await this.db
        .selectFrom('solicitud_empresa')
        .selectAll()
        .where('estado', '=', 'pendiente')
        .orderBy('fecha_solicitud', 'asc')
        .execute();

      return filas.map((f) => this.mapearEmpresaDesdeDb(f));
    }

    return Array.from(this.memoriaSolicitudesEmpresa.values()).filter(
      (sol) => sol.estado === 'pendiente'
    );
  }

  /**
   * Lista todas las solicitudes de empresa.
   */
  async listarTodas(): Promise<SolicitudEmpresa[]> {
    if (this.db) {
      const filas = await this.db
        .selectFrom('solicitud_empresa')
        .selectAll()
        .orderBy('fecha_solicitud', 'desc')
        .execute();

      return filas.map((f) => this.mapearEmpresaDesdeDb(f));
    }

    return Array.from(this.memoriaSolicitudesEmpresa.values());
  }

  /**
   * Busca una solicitud de empresa por su ID.
   */
  async buscarPorId(idSolicitud: string): Promise<SolicitudEmpresa | null> {
    if (this.db) {
      const fila = await this.db
        .selectFrom('solicitud_empresa')
        .selectAll()
        .where('id_solicitud', '=', idSolicitud)
        .executeTakeFirst();

      return fila ? this.mapearEmpresaDesdeDb(fila) : null;
    }

    return this.memoriaSolicitudesEmpresa.get(idSolicitud) ?? null;
  }

  /**
   * Busca solicitud por NIT para evitar duplicidad (CA-CUE-03-03).
   */
  async buscarPorNit(nit: string): Promise<SolicitudEmpresa | null> {
    const normalizado = nit.trim();

    if (this.db) {
      const fila = await this.db
        .selectFrom('solicitud_empresa')
        .selectAll()
        .where('nit', '=', normalizado)
        .where('estado', '!=', 'rechazada')
        .executeTakeFirst();

      return fila ? this.mapearEmpresaDesdeDb(fila) : null;
    }

    for (const sol of this.memoriaSolicitudesEmpresa.values()) {
      if (sol.nit.trim() === normalizado && sol.estado !== 'rechazada') {
        return sol;
      }
    }
    return null;
  }

  /**
   * Busca la solicitud asociada a un usuario específico.
   */
  async buscarPorUsuario(idUsuario: number): Promise<SolicitudEmpresa | null> {
    if (this.db) {
      const fila = await this.db
        .selectFrom('solicitud_empresa')
        .selectAll()
        .where('id_usuario', '=', idUsuario)
        .orderBy('fecha_solicitud', 'desc')
        .executeTakeFirst();

      return fila ? this.mapearEmpresaDesdeDb(fila) : null;
    }

    for (const sol of this.memoriaSolicitudesEmpresa.values()) {
      if (sol.id_usuario === idUsuario) {
        return sol;
      }
    }
    return null;
  }

  /**
   * Dictamina una solicitud de empresa (aprobar o rechazar) con trazabilidad (RF-CUE-09-03).
   */
  async actualizarEstado(
    idSolicitud: string,
    estado: EstadoSolicitudEmpresa,
    idAdmin: number,
    motivoRechazo?: string | null
  ): Promise<SolicitudEmpresa | null> {
    if (this.db) {
      const actualizada = await this.db
        .updateTable('solicitud_empresa')
        .set({
          estado,
          id_admin_revisor: idAdmin,
          fecha_revision: sql`NOW()`,
          motivo_rechazo: motivoRechazo ?? null,
        })
        .where('id_solicitud', '=', idSolicitud)
        .returningAll()
        .executeTakeFirst();

      return actualizada ? this.mapearEmpresaDesdeDb(actualizada) : null;
    }

    const sol = this.memoriaSolicitudesEmpresa.get(idSolicitud);
    if (!sol) {
      return null;
    }

    const actualizada: SolicitudEmpresa = {
      ...sol,
      estado,
      id_admin_revisor: idAdmin,
      fecha_revision: new Date().toISOString(),
      motivo_rechazo: motivoRechazo ?? null,
    };

    this.memoriaSolicitudesEmpresa.set(idSolicitud, actualizada);
    return actualizada;
  }

  /**
   * Registra una solicitud de actualización de NIT con RUT adjunto (RF-CUE-09-07).
   */
  async crearSolicitudNit(
    datos: Omit<SolicitudActualizacionNit, 'id_solicitud' | 'fecha_solicitud' | 'estado'>
  ): Promise<SolicitudActualizacionNit> {
    if (this.db) {
      const id = randomUUID();
      const insertada = await this.db
        .insertInto('solicitud_actualizacion_nit')
        .values({
          id_solicitud: id,
          id_usuario: datos.id_usuario,
          nit_anterior: datos.nit_anterior.trim(),
          nit_nuevo: datos.nit_nuevo.trim(),
          documento_adjunto_url: datos.documento_adjunto_url,
          estado: 'pendiente',
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return this.mapearNitDesdeDb(insertada);
    }

    const id = randomUUID();
    const solicitud: SolicitudActualizacionNit = {
      ...datos,
      id_solicitud: id,
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString(),
    };

    this.memoriaSolicitudesNit.set(id, solicitud);
    return solicitud;
  }

  /**
   * Lista solicitudes de actualización de NIT pendientes.
   */
  async listarSolicitudesNitPendientes(): Promise<SolicitudActualizacionNit[]> {
    if (this.db) {
      const filas = await this.db
        .selectFrom('solicitud_actualizacion_nit')
        .selectAll()
        .where('estado', '=', 'pendiente')
        .orderBy('fecha_solicitud', 'asc')
        .execute();

      return filas.map((f) => this.mapearNitDesdeDb(f));
    }

    return Array.from(this.memoriaSolicitudesNit.values()).filter(
      (sol) => sol.estado === 'pendiente'
    );
  }

  /**
   * Busca una solicitud de NIT por su ID.
   */
  async buscarSolicitudNitPorId(idSolicitud: string): Promise<SolicitudActualizacionNit | null> {
    if (this.db) {
      const fila = await this.db
        .selectFrom('solicitud_actualizacion_nit')
        .selectAll()
        .where('id_solicitud', '=', idSolicitud)
        .executeTakeFirst();

      return fila ? this.mapearNitDesdeDb(fila) : null;
    }

    return this.memoriaSolicitudesNit.get(idSolicitud) ?? null;
  }

  /**
   * Dictamina una solicitud de actualización de NIT.
   */
  async actualizarEstadoSolicitudNit(
    idSolicitud: string,
    estado: EstadoSolicitudEmpresa,
    idAdmin: number,
    motivoRechazo?: string | null
  ): Promise<SolicitudActualizacionNit | null> {
    if (this.db) {
      const actualizada = await this.db
        .updateTable('solicitud_actualizacion_nit')
        .set({
          estado,
          id_admin_revisor: idAdmin,
          fecha_revision: sql`NOW()`,
          motivo_rechazo: motivoRechazo ?? null,
        })
        .where('id_solicitud', '=', idSolicitud)
        .returningAll()
        .executeTakeFirst();

      return actualizada ? this.mapearNitDesdeDb(actualizada) : null;
    }

    const sol = this.memoriaSolicitudesNit.get(idSolicitud);
    if (!sol) {
      return null;
    }

    const actualizada: SolicitudActualizacionNit = {
      ...sol,
      estado,
      id_admin_revisor: idAdmin,
      fecha_revision: new Date().toISOString(),
      motivo_rechazo: motivoRechazo ?? null,
    };

    this.memoriaSolicitudesNit.set(idSolicitud, actualizada);
    return actualizada;
  }
}
