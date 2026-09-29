import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { TipoResinasService } from '../services/resinas.service';
import { CrearTipoResinaDto, ActualizarTipoResinaDto } from '../dtos/resinas.dto';

// ==============================================================================
// M01 - CONTROLADOR DE TIPOS DE RESINA (HU-CAT-02, RF-CAT-02-04)
// ==============================================================================

function idDeParametro(req: Request, nombre: string = 'id'): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class TipoResinasController {
  constructor(private readonly service: TipoResinasService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearTipoResinaDto.parse(req.body);
    const resina = await this.service.crear(dto);
    sendSuccess(res, resina, 'Tipo de resina creado exitosamente', 201);
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const resinas = await this.service.listar();
    sendSuccess(res, resinas);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    const resina = await this.service.obtenerPorId(idDeParametro(req));
    sendSuccess(res, resina);
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarTipoResinaDto.parse(req.body);
    const resina = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, resina, 'Tipo de resina actualizado exitosamente');
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.desactivar(idDeParametro(req));
    sendSuccess(res, resultado);
  };

  reactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.reactivar(idDeParametro(req));
    sendSuccess(res, resultado, 'Tipo de resina reactivado exitosamente');
  };
}
