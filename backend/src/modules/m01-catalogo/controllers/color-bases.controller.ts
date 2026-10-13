import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { ColorBasesService } from '../services/color-bases.service';
import { AsignarBaseDto } from '../dtos/producto-bases.dto';

// ==============================================================================
// M01 - CONTROLADOR DE COLOR_BASE (HU-CAT-12 flujo 3)
// ==============================================================================

function idDeParametro(req: Request, nombre: string): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class ColorBasesController {
  constructor(private readonly service: ColorBasesService) {}

  listar = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listar(idDeParametro(req, 'idColor')));
  };

  asignar = async (req: Request, res: Response): Promise<void> => {
    const dto = AsignarBaseDto.parse(req.body);
    const bases = await this.service.asignar(idDeParametro(req, 'idColor'), dto.id_base);
    sendSuccess(res, bases, 'Base asociada al color exitosamente', 201);
  };

  quitar = async (req: Request, res: Response): Promise<void> => {
    const bases = await this.service.quitar(idDeParametro(req, 'idColor'), idDeParametro(req, 'idBase'));
    sendSuccess(res, bases, 'Base retirada del color');
  };
}
