import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { EmpresaAdminService } from '../services/empresa-admin.service';
import { dictamenSolicitudEmpresaSchema } from '../dtos';

// ==============================================================================
// M04 - CONTROLADOR DE APROBACIÓN ADMINISTRATIVA DE EMPRESAS (HU-CUE-09)
// Protegido por permiso administrativo 'personal.editar' / 'usuarios.gestionar'
// ==============================================================================

export class EmpresaAdminController {
  constructor(private readonly empresaAdminService: EmpresaAdminService) {}

  private obtenerIdAdmin(req: Request): number {
    const idAdmin = req.user?.id;
    if (!idAdmin) {
      throw new AppError('Administrador no identificado', 401, 'UNAUTHORIZED');
    }
    return Number(idAdmin);
  }

  /**
   * GET /api/cuentas/admin/solicitudes-empresa (RF-CUE-09-01 / CA-CUE-09-01)
   */
  listarSolicitudesPendientes = async (_req: Request, res: Response): Promise<Response> => {
    const solicitudes = await this.empresaAdminService.listarSolicitudesPendientes();
    return sendSuccess(res, solicitudes, 'Solicitudes de empresa pendientes');
  };

  /**
   * GET /api/cuentas/admin/solicitudes-empresa/:id (RF-CUE-09-02)
   */
  obtenerDetalleSolicitud = async (req: Request, res: Response): Promise<Response> => {
    const idSolicitud = req.params.id as string;
    const solicitud = await this.empresaAdminService.obtenerDetalleSolicitud(idSolicitud);
    return sendSuccess(res, solicitud, 'Detalle de la solicitud de empresa');
  };

  /**
   * POST /api/cuentas/admin/solicitudes-empresa/:id/dictamen (RF-CUE-09-03, 04, 05)
   */
  dictaminarSolicitud = async (req: Request, res: Response): Promise<Response> => {
    const idAdmin = this.obtenerIdAdmin(req);
    const idSolicitud = req.params.id as string;
    const datos = dictamenSolicitudEmpresaSchema.parse(req.body);

    const resultado = await this.empresaAdminService.dictaminarSolicitudEmpresa(
      idSolicitud,
      datos,
      idAdmin
    );
    return sendSuccess(res, resultado.solicitud, resultado.mensaje);
  };

  /**
   * GET /api/cuentas/admin/solicitudes-nit (RF-CUE-09-07)
   */
  listarSolicitudesNitPendientes = async (_req: Request, res: Response): Promise<Response> => {
    const solicitudes = await this.empresaAdminService.listarSolicitudesNitPendientes();
    return sendSuccess(res, solicitudes, 'Solicitudes de actualización de NIT pendientes');
  };

  /**
   * POST /api/cuentas/admin/solicitudes-nit/:id/dictamen (RF-CUE-09-07 / CA-CUE-09-05)
   */
  dictaminarSolicitudNit = async (req: Request, res: Response): Promise<Response> => {
    const idAdmin = this.obtenerIdAdmin(req);
    const idSolicitud = req.params.id as string;
    const datos = dictamenSolicitudEmpresaSchema.parse(req.body);

    const resultado = await this.empresaAdminService.dictaminarSolicitudNit(
      idSolicitud,
      datos,
      idAdmin
    );
    return sendSuccess(res, resultado.solicitud, resultado.mensaje);
  };
}
