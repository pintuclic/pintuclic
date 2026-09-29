import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { ProductoBasesService } from '../services/producto-bases.service';
import { AsignarBaseDto } from '../dtos/producto-bases.dto';

// ==============================================================================
// M01 - CONTROLADOR DE PRODUCTO_BASE (HU-CAT-12 flujo 2)
// ==============================================================================

function idDeParametro(req: Request, nombre: string): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class ProductoBasesController {
  constructor(private readonly service: ProductoBasesService) {}

  listar = async (req: Request, res: Response): Promise<void> => {
    const bases = await this.service.listar(idDeParametro(req, 'idProducto'));
    sendSuccess(res, bases);
  };

  asignar = async (req: Request, res: Response): Promise<void> => {
    const dto = AsignarBaseDto.parse(req.body);
    const bases = await this.service.asignar(idDeParametro(req, 'idProducto'), dto.id_base);
    sendSuccess(res, bases, 'Base asignada al producto exitosamente', 201);
  };

  quitar = async (req: Request, res: Response): Promise<void> => {
    const bases = await this.service.quitar(idDeParametro(req, 'idProducto'), idDeParametro(req, 'idBase'));
    sendSuccess(res, bases, 'Base retirada del producto');
  };
}
