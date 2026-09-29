import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { SubcategoriasService } from '../services/subcategorias.service';
import {
  CrearSubcategoriaDto,
  ActualizarSubcategoriaDto,
  DesactivarSubcategoriaDto,
} from '../dtos/subcategorias.dto';

// ==============================================================================
// M01 - CONTROLADOR DE SUBCATEGORÍAS (HU-CAT-01)
// ==============================================================================

function idDeParametro(req: Request, nombre: string = 'id'): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class SubcategoriasController {
  constructor(private readonly service: SubcategoriasService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearSubcategoriaDto.parse(req.body);
    const subcategoria = await this.service.crear(dto);
    sendSuccess(res, subcategoria, 'Subcategoría creada exitosamente', 201);
  };

  listarPorCategoria = async (req: Request, res: Response): Promise<void> => {
    const subcategorias = await this.service.listarPorCategoria(idDeParametro(req, 'idCategoria'));
    sendSuccess(res, subcategorias);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    const subcategoria = await this.service.obtenerPorId(idDeParametro(req));
    sendSuccess(res, subcategoria);
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarSubcategoriaDto.parse(req.body);
    const subcategoria = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, subcategoria, 'Subcategoría actualizada exitosamente');
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    const dto = DesactivarSubcategoriaDto.parse(req.body);
    const resultado = await this.service.solicitarDesactivacion(idDeParametro(req), dto.confirmar);
    sendSuccess(res, resultado);
  };

  reactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.reactivar(idDeParametro(req));
    sendSuccess(res, resultado, 'Subcategoría reactivada exitosamente');
  };
}
