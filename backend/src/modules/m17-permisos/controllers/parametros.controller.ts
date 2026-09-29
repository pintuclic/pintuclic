import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../core/utils/apiResponse';
import { ParametrosService } from '../services/parametros.service';
import { ActualizarParametroDto } from '../dtos/parametros.dto';

// ==============================================================================
// M17 - CONTROLADOR DE PARÁMETROS DEL SISTEMA
// Lectura y actualizacion de la configuracion global (RF-ADM-06).
// ==============================================================================

export class ParametrosController {
  constructor(private readonly parametrosService: ParametrosService) {}

  /**
   * GET /api/admin/parametros
   * Lista todos los parametros configurables del sistema (RF-ADM-06-01).
   */
  listarParametros = async (_req: Request, res: Response): Promise<void> => {
    const parametros = await this.parametrosService.listarParametros();
    sendSuccess(res, parametros);
  };

  /**
   * PUT /api/admin/parametros
   * Actualiza un parametro del sistema con validacion de rango (RF-ADM-06-02).
   */
  actualizarParametro = async (req: Request, res: Response): Promise<void> => {
    const parsed = ActualizarParametroDto.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Datos de parametro invalidos', 'VALIDATION_ERROR', 422, parsed.error.issues);
      return;
    }

    const resultado = await this.parametrosService.actualizarParametro(
      parsed.data.clave,
      parsed.data.valor,
    );

    if (!resultado.ok) {
      sendError(res, resultado.error ?? 'Error al actualizar parametro', 'BAD_REQUEST', 400);
      return;
    }

    sendSuccess(res, resultado.parametro, 'Parametro actualizado exitosamente');
  };
}
