import { AppError } from '../../../core/middlewares/errorHandler';
import { CuentasRepository } from '../repositories/cuentas.repository';
import { EmpresaRepository } from '../repositories/empresa.repository';
import { servicioNotificaciones } from '../../m18-notificaciones/notificaciones.routes';
import { DictamenSolicitudEmpresaDTO } from '../dtos';
import {
  SolicitudEmpresa,
  SolicitudActualizacionNit,
} from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - SERVICIO DE ADMINISTRACIÓN DE CUENTAS EMPRESA (HU-CUE-09)
// Revisión, dictamen de solicitudes y actualización de NIT con trazabilidad
// ==============================================================================

export class EmpresaAdminService {
  constructor(
    private readonly cuentasRepo: CuentasRepository,
    private readonly empresaRepo: EmpresaRepository
  ) {}

  /**
   * HU-CUE-09: Listar solicitudes de empresas pendientes (RF-CUE-09-01 / CA-CUE-09-01).
   */
  async listarSolicitudesPendientes(): Promise<SolicitudEmpresa[]> {
    return this.empresaRepo.listarPendientes();
  }

  /**
   * HU-CUE-09: Consultar detalle de una solicitud (RF-CUE-09-02).
   */
  async obtenerDetalleSolicitud(idSolicitud: string): Promise<SolicitudEmpresa> {
    const solicitud = await this.empresaRepo.buscarPorId(idSolicitud);
    if (!solicitud) {
      throw new AppError('Solicitud de empresa no encontrada', 404, 'NOT_FOUND');
    }
    return solicitud;
  }

  /**
   * HU-CUE-09: Dictaminar una solicitud de cuenta empresa (aprobar o rechazar).
   * Deja constancia de quién y cuándo decidió (RF-CUE-09-03).
   */
  async dictaminarSolicitudEmpresa(
    idSolicitud: string,
    datos: DictamenSolicitudEmpresaDTO,
    idAdmin: number
  ): Promise<{ mensaje: string; solicitud: SolicitudEmpresa }> {
    const solicitud = await this.empresaRepo.buscarPorId(idSolicitud);
    if (!solicitud) {
      throw new AppError('Solicitud de empresa no encontrada', 404, 'NOT_FOUND');
    }

    // Si la solicitud ya fue decidida, rechazar la operación (CA-CUE-09-04)
    if (solicitud.estado !== 'pendiente') {
      throw new AppError(
        `Esta solicitud ya fue resuelta anteriormente con estado: ${solicitud.estado}`,
        400,
        'ALREADY_DECIDED'
      );
    }

    // Protección de cuenta raíz (RF-ADM-01-14 / RF-ADM-02-10): Administrador ID=1 no puede ser alterado a empresa
    if (solicitud.id_usuario === 1) {
      throw new AppError(
        'Operación no permitida: La cuenta del Administrador raíz no puede ser convertida a cuenta empresa',
        403,
        'ROOT_ADMIN_PROTECTED'
      );
    }

    const nuevoEstado = datos.decision === 'aprobar' ? 'aprobada' : 'rechazada';
    const motivo = datos.decision === 'rechazar' ? datos.motivoRechazo : null;

    // Actualizar solicitud en repositorio
    const solicitudActualizada = await this.empresaRepo.actualizarEstado(
      idSolicitud,
      nuevoEstado,
      idAdmin,
      motivo
    );

    if (!solicitudActualizada) {
      throw new AppError('Error actualizando la solicitud', 500, 'UPDATE_ERROR');
    }

    const usuario = await this.cuentasRepo.buscarPorId(solicitud.id_usuario);

    if (datos.decision === 'aprobar') {
      // 1. Habilitar de inmediato las condiciones comerciales de empresa (RF-CUE-09-04 / CA-CUE-09-02)
      // Rol 3 es 'empresa_vip' con sub-rol y descuentos comerciales vinculados en seed_pintuclic.sql
      await this.cuentasRepo.actualizarUsuario(solicitud.id_usuario, {
        estado: 'activo',
        tipo: 'empresa',
        id_rol: 3,
      });
      await this.cuentasRepo.asignarRolUsuario(solicitud.id_usuario, 3);

      // 2. Notificar por email la aprobación (M18)
      if (usuario) {
        void servicioNotificaciones
          .procesarEvento(
            'SOLICITUD_EMPRESA_DECISION',
            usuario.correo,
            {
              nombre_empresa: solicitud.nombre_empresa,
              decision: 'APROBADA',
              mensaje:
                '¡Felicidades! Su cuenta de cliente empresa ha sido aprobada. Ya puede acceder con condiciones y descuentos corporativos.',
            },
            usuario.id_usuario
          )
          .catch((err) => console.error('[M04-Cuentas] Error notificando aprobación:', err));
      }

      return {
        mensaje: 'Solicitud aprobada exitosamente. La cuenta dispone ahora de condiciones comerciales corporativas.',
        solicitud: solicitudActualizada,
      };
    } else {
      // 1. En caso de rechazo, registrar motivo y notificar con la causa (RF-CUE-09-05 / CA-CUE-09-03)
      if (usuario) {
        void servicioNotificaciones
          .procesarEvento(
            'SOLICITUD_EMPRESA_DECISION',
            usuario.correo,
            {
              nombre_empresa: solicitud.nombre_empresa,
              decision: 'RECHAZADA',
              motivo: motivo ?? 'No cumple los requisitos corporativos mínimos.',
            },
            usuario.id_usuario
          )
          .catch((err) => console.error('[M04-Cuentas] Error notificando rechazo:', err));
      }

      return {
        mensaje: 'Solicitud rechazada. Se ha notificado la decisión y el motivo al solicitante.',
        solicitud: solicitudActualizada,
      };
    }
  }

  /**
   * HU-CUE-09: Listar solicitudes de actualización de NIT pendientes (RF-CUE-09-07).
   */
  async listarSolicitudesNitPendientes(): Promise<SolicitudActualizacionNit[]> {
    return this.empresaRepo.listarSolicitudesNitPendientes();
  }

  /**
   * HU-CUE-09: Dictaminar una solicitud de actualización de NIT (CA-CUE-09-05).
   */
  async dictaminarSolicitudNit(
    idSolicitud: string,
    datos: DictamenSolicitudEmpresaDTO,
    idAdmin: number
  ): Promise<{ mensaje: string; solicitud: SolicitudActualizacionNit }> {
    const solicitud = await this.empresaRepo.buscarSolicitudNitPorId(idSolicitud);
    if (!solicitud) {
      throw new AppError('Solicitud de actualización de NIT no encontrada', 404, 'NOT_FOUND');
    }

    if (solicitud.estado !== 'pendiente') {
      throw new AppError('Esta solicitud de NIT ya fue dictaminada previamente', 400, 'ALREADY_DECIDED');
    }

    const nuevoEstado = datos.decision === 'aprobar' ? 'aprobada' : 'rechazada';
    const motivo = datos.decision === 'rechazar' ? datos.motivoRechazo : null;

    const actualizada = await this.empresaRepo.actualizarEstadoSolicitudNit(
      idSolicitud,
      nuevoEstado,
      idAdmin,
      motivo
    );

    if (!actualizada) {
      throw new AppError('Error procesando dictamen de NIT', 500, 'UPDATE_ERROR');
    }

    const usuario = await this.cuentasRepo.buscarPorId(solicitud.id_usuario);

    if (datos.decision === 'aprobar') {
      // Notificar éxito de actualización de NIT
      if (usuario) {
        void servicioNotificaciones
          .procesarEvento(
            'SOLICITUD_EMPRESA_DECISION',
            usuario.correo,
            {
              nombre_empresa: usuario.nombre,
              decision: 'NIT ACTUALIZADO',
              mensaje: `Se ha verificado y actualizado exitosamente el NIT de su empresa a: ${solicitud.nit_nuevo}`,
            },
            usuario.id_usuario
          )
          .catch((err) => console.error('[M04-Cuentas] Error notificando NIT aprobado:', err));
      }

      return {
        mensaje: 'Actualización de NIT aprobada exitosamente.',
        solicitud: actualizada,
      };
    } else {
      if (usuario) {
        void servicioNotificaciones
          .procesarEvento(
            'SOLICITUD_EMPRESA_DECISION',
            usuario.correo,
            {
              nombre_empresa: usuario.nombre,
              decision: 'NIT RECHAZADO',
              motivo: motivo ?? 'El documento soporte aportado no concuerda con el NIT solicitado.',
            },
            usuario.id_usuario
          )
          .catch((err) => console.error('[M04-Cuentas] Error notificando rechazo de NIT:', err));
      }

      return {
        mensaje: 'Solicitud de actualización de NIT rechazada.',
        solicitud: actualizada,
      };
    }
  }
}
