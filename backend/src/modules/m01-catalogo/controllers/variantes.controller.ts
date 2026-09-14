import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { VariantesService } from '../services/variantes.service';
import { CrearVarianteDto, ActualizarVarianteDto } from '../dtos/variantes.dto';

// ==============================================================================
// M01 - CONTROLADOR DE VARIANTES (HU-CAT-03)
// ==============================================================================

function idDeParametro(req: Request, nombre: string = 'id'): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class VariantesController {
  constructor(private readonly service: VariantesService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearVarianteDto.parse(req.body);
    const variante = await this.service.crear(dto);
    sendSuccess(res, variante, 'Variante creada exitosamente', 201);
  };

  listarPorProducto = async (req: Request, res: Response): Promise<void> => {
    const variantes = await this.service.listarPorProducto(idDeParametro(req, 'idProducto'));
    sendSuccess(res, variantes);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.obtenerPorId(idDeParametro(req)));
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarVarianteDto.parse(req.body);
    const variante = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, variante, 'Variante actualizada exitosamente');
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.desactivar(idDeParametro(req)));
  };

  reactivar = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.reactivar(idDeParametro(req)), 'Variante reactivada exitosamente');
  };
}
