import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { PresentacionesService } from '../services/presentaciones.service';
import { CrearPresentacionDto, ActualizarPresentacionDto } from '../dtos/presentaciones.dto';

// ==============================================================================
// M01 - CONTROLADOR DE PRESENTACIONES (HU-CAT-03)
// ==============================================================================

function idDeParametro(req: Request, nombre: string = 'id'): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class PresentacionesController {
  constructor(private readonly service: PresentacionesService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearPresentacionDto.parse(req.body);
    const presentacion = await this.service.crear(dto);
    sendSuccess(res, presentacion, 'Presentación creada exitosamente', 201);
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listar());
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.obtenerPorId(idDeParametro(req)));
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarPresentacionDto.parse(req.body);
    const presentacion = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, presentacion, 'Presentación actualizada exitosamente');
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.desactivar(idDeParametro(req)));
  };

  reactivar = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.reactivar(idDeParametro(req)), 'Presentación reactivada exitosamente');
  };
}
