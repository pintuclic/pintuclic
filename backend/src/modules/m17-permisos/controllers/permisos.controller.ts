import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../core/utils/apiResponse';
import { PermisosService } from '../services/permisos.service';
import { ReemplazarPermisosDto } from '../dtos/permisos.dto';

// ==============================================================================
// M17 - CONTROLADOR DE PERMISOS
// Catalogo maestro y asignacion/revocacion de permisos por empleado.
// ==============================================================================

export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  /**
   * GET /api/admin/permisos
   * Retorna el catalogo completo de permisos agrupado por area (RF-ADM-02-01).
   */
  obtenerCatalogo = async (_req: Request, res: Response): Promise<void> => {
    const catalogo = await this.permisosService.obtenerCatalogo();
    sendSuccess(res, catalogo);
  };

  /**
   * GET /api/admin/empleados/:id/permisos
   * Retorna los permisos actuales de un empleado (RF-ADM-02-03).
   */
  obtenerPermisosEmpleado = async (req: Request, res: Response): Promise<void> => {
    const idUsuario = Number(req.params['id']);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      sendError(res, 'Identificador de empleado invalido', 'BAD_REQUEST', 400);
      return;
    }

    const resultado = await this.permisosService.obtenerPermisosDeEmpleado(idUsuario);
    if ('error' in resultado) {
      sendError(res, resultado.error, 'NOT_FOUND', 404);
      return;
    }

    sendSuccess(res, { permisos: resultado.permisos });
  };

  /**
   * PUT /api/admin/empleados/:id/permisos
   * Reemplaza COMPLETAMENTE los permisos de un empleado (RF-ADM-02-02, RF-ADM-02-06).
   * Aplica la regla de cascada al conceder permisos de operacion.
   */
  reemplazarPermisos = async (req: Request, res: Response): Promise<void> => {
    const idUsuario = Number(req.params['id']);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      sendError(res, 'Identificador de empleado invalido', 'BAD_REQUEST', 400);
      return;
    }

    const parsed = ReemplazarPermisosDto.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Lista de permisos invalida', 'VALIDATION_ERROR', 422, parsed.error.issues);
      return;
    }

    const resultado = await this.permisosService.reemplazarPermisos(idUsuario, parsed.data.permisos);
    if (!resultado.ok) {
      const status = resultado.error?.includes('raiz') ? 403 : 404;
      sendError(res, resultado.error ?? 'Error al asignar permisos', 'FORBIDDEN', status);
      return;
    }

    sendSuccess(res, {
      asignados: resultado.asignados,
      auto_concedidos: resultado.autoConcedidos,
      no_encontrados: resultado.noEncontrados,
    }, 'Permisos actualizados exitosamente');
  };
}
