import { randomUUID } from 'crypto';
import {
  SolicitudEmpresa,
  SolicitudActualizacionNit,
  EstadoSolicitudEmpresa,
} from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - REPOSITORIO DE SOLICITUDES EMPRESA Y ACTUALIZACIÓN DE NIT (HU-CUE-03, 09)
// ==============================================================================

export class EmpresaRepository {
  private readonly solicitudesEmpresa: Map<string, SolicitudEmpresa> = new Map();
  private readonly solicitudesNit: Map<string, SolicitudActualizacionNit> = new Map();

  /**
   * Registra una nueva solicitud de cuenta corporativa o ascenso (HU-CUE-03).
   */
  async crearSolicitud(
    datos: Omit<SolicitudEmpresa, 'id_solicitud' | 'fecha_solicitud' | 'estado'>
  ): Promise<SolicitudEmpresa> {
    const id = randomUUID();
    const solicitud: SolicitudEmpresa = {
      ...datos,
      id_solicitud: id,
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString(),
    };

    this.solicitudesEmpresa.set(id, solicitud);
    return solicitud;
  }

  /**
   * Lista las solicitudes pendientes de revisión por el administrador (RF-CUE-09-01).
   */
  async listarPendientes(): Promise<SolicitudEmpresa[]> {
    return Array.from(this.solicitudesEmpresa.values()).filter(
      (sol) => sol.estado === 'pendiente'
    );
  }

  /**
   * Lista todas las solicitudes de empresa.
   */
  async listarTodas(): Promise<SolicitudEmpresa[]> {
    return Array.from(this.solicitudesEmpresa.values());
  }

  /**
   * Busca una solicitud de empresa por su ID.
   */
  async buscarPorId(idSolicitud: string): Promise<SolicitudEmpresa | null> {
    return this.solicitudesEmpresa.get(idSolicitud) ?? null;
  }

  /**
   * Busca solicitud por NIT para evitar duplicidad (CA-CUE-03-03).
   */
  async buscarPorNit(nit: string): Promise<SolicitudEmpresa | null> {
    const normalizado = nit.trim();
    for (const sol of this.solicitudesEmpresa.values()) {
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
    for (const sol of this.solicitudesEmpresa.values()) {
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
    const sol = this.solicitudesEmpresa.get(idSolicitud);
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

    this.solicitudesEmpresa.set(idSolicitud, actualizada);
    return actualizada;
  }

  /**
   * Registra una solicitud de actualización de NIT con RUT adjunto (RF-CUE-09-07).
   */
  async crearSolicitudNit(
    datos: Omit<SolicitudActualizacionNit, 'id_solicitud' | 'fecha_solicitud' | 'estado'>
  ): Promise<SolicitudActualizacionNit> {
    const id = randomUUID();
    const solicitud: SolicitudActualizacionNit = {
      ...datos,
      id_solicitud: id,
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString(),
    };

    this.solicitudesNit.set(id, solicitud);
    return solicitud;
  }

  /**
   * Lista solicitudes de actualización de NIT pendientes.
   */
  async listarSolicitudesNitPendientes(): Promise<SolicitudActualizacionNit[]> {
    return Array.from(this.solicitudesNit.values()).filter(
      (sol) => sol.estado === 'pendiente'
    );
  }

  /**
   * Busca una solicitud de NIT por su ID.
   */
  async buscarSolicitudNitPorId(idSolicitud: string): Promise<SolicitudActualizacionNit | null> {
    return this.solicitudesNit.get(idSolicitud) ?? null;
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
    const sol = this.solicitudesNit.get(idSolicitud);
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

    this.solicitudesNit.set(idSolicitud, actualizada);
    return actualizada;
  }
}
