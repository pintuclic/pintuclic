import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { BasesService } from '../services/bases.service';
import { CrearBaseDto, ActualizarBaseDto } from '../dtos/bases.dto';

// ==============================================================================
// M01 - CONTROLADOR DE BASES (HU-CAT-12)
// ==============================================================================

function idDeParametro(req: Request, nombre: string = 'id'): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class BasesController {
  constructor(private readonly service: BasesService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearBaseDto.parse(req.body);
    const base = await this.service.crear(dto);
    sendSuccess(res, base, 'Base creada exitosamente', 201);
  };

  listarPorMarca = async (req: Request, res: Response): Promise<void> => {
    const bases = await this.service.listarPorMarca(idDeParametro(req, 'idMarca'));
    sendSuccess(res, bases);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    const base = await this.service.obtenerPorId(idDeParametro(req));
    sendSuccess(res, base);
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarBaseDto.parse(req.body);
    const base = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, base, 'Base actualizada exitosamente');
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.desactivar(idDeParametro(req));
    sendSuccess(res, resultado);
  };

  reactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.reactivar(idDeParametro(req));
    sendSuccess(res, resultado, 'Base reactivada exitosamente');
  };
}
