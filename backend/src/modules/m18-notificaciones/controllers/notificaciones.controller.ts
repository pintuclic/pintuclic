import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../core/utils/apiResponse';
import { NotificacionesService } from '../services/notificaciones.service';
import { DispararEventoSchema, FiltrosBitacoraSchema } from '../dtos/envio.dto';

// ==============================================================================
// M18 - CONTROLADOR PRINCIPAL DE NOTIFICACIONES (HU-NOT-01, HU-NOT-02, HU-NOT-04)
// Despacho de eventos, consulta de bitácora y métricas de entregabilidad
// ==============================================================================

export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  /**
   * POST /api/notificaciones/disparar
   * Procesa y envía una notificación a partir de un evento de negocio (HU-NOT-01).
   */
  dispararEvento = async (req: Request, res: Response): Promise<void> => {
    const parseResult = DispararEventoSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(res, 'Datos de evento inválidos', 'VALIDATION_ERROR', 422, parseResult.error.issues);
      return;
    }

    const { evento, destinatario, variables, idUsuario } = parseResult.data;

    const resultado = await this.notificacionesService.procesarEvento(
      evento,
      destinatario,
      variables,
      idUsuario
    );

    if (!resultado.exitoso) {
      sendError(
        res,
        resultado.mensaje,
        'DISPATCH_FAILED',
        500,
        { idEnvio: resultado.idEnvio, intentos: resultado.intentos, error: resultado.error }
      );
      return;
    }

    sendSuccess(
      res,
      resultado,
      'Notificación despachada y procesada correctamente',
      201
    );
  };

  /**
   * GET /api/notificaciones/bitacora
   * Retorna la lista paginada de envíos realizados para trazabilidad y auditoría (RF-NOT-01-04).
   */
  consultarBitacora = async (req: Request, res: Response): Promise<void> => {
    const parseResult = FiltrosBitacoraSchema.safeParse(req.query);
    if (!parseResult.success) {
      sendError(res, 'Parámetros de consulta inválidos', 'VALIDATION_ERROR', 400, parseResult.error.issues);
      return;
    }

    const { estado, evento, destinatario, limite, pagina } = parseResult.data;

    const resultado = await this.notificacionesService.consultarBitacora({
      estado,
      evento,
      destinatario,
      limite,
      pagina,
    });

    sendSuccess(
      res,
      resultado.envios,
      'Bitácora de notificaciones consultada exitosamente',
      200,
      {
        total: resultado.total,
        pagina,
        limite,
      }
    );
  };

  /**
   * GET /api/notificaciones/bitacora/:id
   * Obtiene la trazabilidad detallada de un envío individual.
   */
  obtenerDetalleEnvio = async (req: Request, res: Response): Promise<void> => {
    const id = req.params['id'];
    if (!id || typeof id !== 'string') {
      sendError(res, 'Identificador de envío obligatorio', 'BAD_REQUEST', 400);
      return;
    }

    const registro = await this.notificacionesService.obtenerDetalleEnvio(id);
    if (!registro) {
      sendError(res, `Registro de envío con id '${id}' no encontrado`, 'NOT_FOUND', 404);
      return;
    }

    sendSuccess(res, registro);
  };

  /**
   * GET /api/notificaciones/estadisticas
   * Retorna métricas de volumen, entregabilidad y reintentos (HU-NOT-04).
   */
  obtenerEstadisticas = async (_req: Request, res: Response): Promise<void> => {
    const metricas = await this.notificacionesService.obtenerEstadisticas();
    sendSuccess(res, metricas, 'Métricas de entregabilidad de correo');
  };

  /**
   * GET /api/notificaciones/conexion-smtp
   * Comprueba el estado de conectividad con el servidor SMTP (RF-NOT-04-01).
   */
  probarConexionSmtp = async (_req: Request, res: Response): Promise<void> => {
    const estado = await this.notificacionesService.probarConexionSmtp();
    sendSuccess(res, estado);
  };
}
