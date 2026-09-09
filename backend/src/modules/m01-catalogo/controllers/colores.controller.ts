import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { ColoresService } from '../services/colores.service';
import { CrearColorDto, ActualizarColorDto } from '../dtos/colores.dto';

// ==============================================================================
// M01 - CONTROLADOR DE COLORES (HU-CAT-05)
// ==============================================================================

function idDeParametro(req: Request, nombre: string = 'id'): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class ColoresController {
  constructor(private readonly service: ColoresService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearColorDto.parse(req.body);
    const color = await this.service.crear(dto);
    sendSuccess(res, color, 'Color creado exitosamente', 201);
  };

  listarPorMarca = async (req: Request, res: Response): Promise<void> => {
    const busqueda = typeof req.query.q === 'string' && req.query.q.trim() !== '' ? req.query.q.trim() : undefined;
    const colores = await this.service.listarPorMarca(idDeParametro(req, 'idMarca'), busqueda);
    sendSuccess(res, colores);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    const color = await this.service.obtenerPorId(idDeParametro(req));
    sendSuccess(res, color);
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarColorDto.parse(req.body);
    const color = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, color, 'Color actualizado exitosamente');
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.desactivar(idDeParametro(req));
    sendSuccess(res, resultado);
  };

  reactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.reactivar(idDeParametro(req));
    sendSuccess(res, resultado, 'Color reactivado exitosamente');
  };
}
