import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CombosService } from '../services/combos.service';
import { DefinirComboDto } from '../dtos/combos.dto';

// ==============================================================================
// M01 - CONTROLADOR DE COMBOS (HU-CAT-13)
// ==============================================================================

function idDeParametro(req: Request, nombre: string): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class CombosController {
  constructor(private readonly service: CombosService) {}

  definir = async (req: Request, res: Response): Promise<void> => {
    const dto = DefinirComboDto.parse(req.body ?? {});
    const combo = await this.service.definir(idDeParametro(req, 'idProducto'), dto);
    sendSuccess(res, combo, 'Combo registrado exitosamente');
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.obtener(idDeParametro(req, 'idProducto')));
  };
}
