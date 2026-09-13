import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { RendimientoService } from '../services/rendimiento.service';
import { EstablecerRendimientoDto } from '../dtos/rendimiento.dto';

// ==============================================================================
// M01 - CONTROLADOR DE RENDIMIENTO DEL PRODUCTO (HU-CAT-10)
// ==============================================================================

function idDeParametro(req: Request, nombre: string = 'id'): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class RendimientoController {
  constructor(private readonly service: RendimientoService) {}

  establecer = async (req: Request, res: Response): Promise<void> => {
    const dto = EstablecerRendimientoDto.parse(req.body);
    const rendimiento = await this.service.establecer(idDeParametro(req, 'idProducto'), dto);
    sendSuccess(res, rendimiento, 'Rendimiento actualizado exitosamente');
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    const rendimiento = await this.service.obtener(idDeParametro(req, 'idProducto'));
    sendSuccess(res, rendimiento);
  };
}
