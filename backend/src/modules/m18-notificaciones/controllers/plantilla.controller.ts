import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../core/utils/apiResponse';
import { PlantillaService } from '../services/plantilla.service';
import {
  ActualizarPlantillaSchema,
  PrevisualizarPlantillaSchema,
  PlantillaParamSchema,
} from '../dtos/plantilla.dto';

// ==============================================================================
// M18 - CONTROLADOR DE PLANTILLAS DE COMUNICACIÓN (HU-NOT-03)
// Gestión y previsualización de plantillas administrables
// ==============================================================================

export class PlantillaController {
  constructor(private readonly plantillaService: PlantillaService) {}

  /**
   * GET /api/notificaciones/plantillas
   * Retorna el catálogo completo de plantillas configurables (RF-NOT-03-01).
   */
  listarPlantillas = async (_req: Request, res: Response): Promise<void> => {
    const plantillas = await this.plantillaService.listarPlantillas();
    sendSuccess(res, plantillas, 'Catálogo de plantillas obtenido exitosamente');
  };

  /**
   * GET /api/notificaciones/plantillas/:codigo
   * Obtiene el detalle y variables de una plantilla específica.
   */
  obtenerPlantilla = async (req: Request, res: Response): Promise<void> => {
    const paramParsed = PlantillaParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      sendError(res, 'Código de plantilla inválido', 'BAD_REQUEST', 400, paramParsed.error.issues);
      return;
    }

    const plantilla = await this.plantillaService.obtenerPlantilla(paramParsed.data.codigo);
    if (!plantilla) {
      sendError(res, `Plantilla '${paramParsed.data.codigo}' no encontrada`, 'NOT_FOUND', 404);
      return;
    }

    sendSuccess(res, plantilla);
  };

  /**
   * PUT /api/notificaciones/plantillas/:codigo
   * Actualiza el asunto y cuerpo de una plantilla con validación de obligatorios (CA-NOT-03-01, CA-NOT-03-03).
   */
  actualizarPlantilla = async (req: Request, res: Response): Promise<void> => {
    const paramParsed = PlantillaParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      sendError(res, 'Código de plantilla inválido', 'BAD_REQUEST', 400, paramParsed.error.issues);
      return;
    }

    const bodyParsed = ActualizarPlantillaSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      sendError(res, 'Datos de plantilla inválidos', 'VALIDATION_ERROR', 422, bodyParsed.error.issues);
      return;
    }

    // Identificar el usuario autenticado que realiza el cambio (si existe en la sesión)
    const usuarioSesion = (req as Request & { usuario?: { correo?: string } }).usuario?.correo ?? 'admin';

    const resultado = await this.plantillaService.actualizarPlantilla(
      paramParsed.data.codigo,
      bodyParsed.data,
      usuarioSesion
    );

    if (!resultado.exitoso) {
      // Si falló por eliminación de campos obligatorios (CA-NOT-03-03 / Diagrama HU-NOT-03)
      if (resultado.variablesFaltantes && resultado.variablesFaltantes.length > 0) {
        sendError(
          res,
          resultado.error ?? 'Campos variables obligatorios no pueden ser eliminados',
          'CAMPOS_OBLIGATORIOS_REQUERIDOS',
          422,
          resultado.variablesFaltantes
        );
        return;
      }

      sendError(res, resultado.error ?? 'Error al actualizar plantilla', 'BAD_REQUEST', 400);
      return;
    }

    sendSuccess(res, resultado.plantilla, 'Plantilla actualizada exitosamente');
  };

  /**
   * POST /api/notificaciones/plantillas/:codigo/preview
   * Genera una previsualización de la plantilla con datos de ejemplo (RF-NOT-03-03, CA-NOT-03-02).
   */
  generarVistaPrevia = async (req: Request, res: Response): Promise<void> => {
    const paramParsed = PlantillaParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      sendError(res, 'Código de plantilla inválido', 'BAD_REQUEST', 400, paramParsed.error.issues);
      return;
    }

    const bodyParsed = PrevisualizarPlantillaSchema.safeParse(req.body);
    if (!bodyParsed.success) {
      sendError(res, 'Parámetros de vista previa inválidos', 'VALIDATION_ERROR', 422, bodyParsed.error.issues);
      return;
    }

    const preview = await this.plantillaService.generarVistaPrevia(
      paramParsed.data.codigo,
      bodyParsed.data.cuerpoHtml,
      bodyParsed.data.asunto,
      bodyParsed.data.cuerpoTexto,
      bodyParsed.data.variables
    );

    if (!preview) {
      sendError(res, `Plantilla '${paramParsed.data.codigo}' no encontrada`, 'NOT_FOUND', 404);
      return;
    }

    sendSuccess(res, preview, 'Vista previa generada exitosamente');
  };
}
