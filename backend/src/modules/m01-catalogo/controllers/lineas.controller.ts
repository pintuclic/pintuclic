import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { LineasService } from '../services/lineas.service';
import { CrearLineaDto, ActualizarLineaDto, DesactivarLineaDto } from '../dtos/lineas.dto';

// ==============================================================================
// M01 - CONTROLADOR DE LÍNEAS COMERCIALES (HU-CAT-11)
// ==============================================================================

function idDeParametro(req: Request, nombre: string = 'id'): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class LineasController {
  constructor(private readonly service: LineasService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearLineaDto.parse(req.body);
    const linea = await this.service.crear(dto);
    sendSuccess(res, linea, 'Línea creada exitosamente', 201);
  };

  listarPorMarca = async (req: Request, res: Response): Promise<void> => {
    const lineas = await this.service.listarPorMarca(idDeParametro(req, 'idMarca'));
    sendSuccess(res, lineas);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    const linea = await this.service.obtenerPorId(idDeParametro(req));
    sendSuccess(res, linea);
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarLineaDto.parse(req.body);
    const linea = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, linea, 'Línea actualizada exitosamente');
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    const dto = DesactivarLineaDto.parse(req.body);
    const resultado = await this.service.solicitarDesactivacion(idDeParametro(req), dto.confirmar);
    sendSuccess(res, resultado);
  };

  reactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.reactivar(idDeParametro(req));
    sendSuccess(res, resultado, 'Línea reactivada exitosamente');
  };
}
