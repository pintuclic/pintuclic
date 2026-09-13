import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CategoriasService } from '../services/categorias.service';
import { CrearCategoriaDto, ActualizarCategoriaDto, DesactivarCategoriaDto } from '../dtos/categorias.dto';

// ==============================================================================
// M01 - CONTROLADOR DE CATEGORÍAS (HU-CAT-01)
// ==============================================================================

function idDeParametro(req: Request): number {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador de categoría inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class CategoriasController {
  constructor(private readonly service: CategoriasService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearCategoriaDto.parse(req.body);
    const categoria = await this.service.crear(dto);
    sendSuccess(res, categoria, 'Categoría creada exitosamente', 201);
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const categorias = await this.service.listar();
    sendSuccess(res, categorias);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    const categoria = await this.service.obtenerPorId(idDeParametro(req));
    sendSuccess(res, categoria);
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarCategoriaDto.parse(req.body);
    const categoria = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, categoria, 'Categoría actualizada exitosamente');
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    const dto = DesactivarCategoriaDto.parse(req.body);
    const resultado = await this.service.solicitarDesactivacion(idDeParametro(req), dto.confirmar);
    sendSuccess(res, resultado);
  };

  reactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.reactivar(idDeParametro(req));
    sendSuccess(res, resultado, 'Categoría reactivada exitosamente');
  };
}
