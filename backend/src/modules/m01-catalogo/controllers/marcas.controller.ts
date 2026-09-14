import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { MarcasService } from '../services/marcas.service';
import { CrearMarcaDto, ActualizarMarcaDto } from '../dtos/marcas.dto';

// ==============================================================================
// M01 - CONTROLADOR DE MARCAS (HU-CAT-04)
// ==============================================================================

function idDeParametro(req: Request): number {
  const id = Number(req.params['id']);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador de marca inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class MarcasController {
  constructor(private readonly service: MarcasService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearMarcaDto.parse(req.body);
    const marca = await this.service.crear(dto);
    sendSuccess(res, marca, 'Marca creada exitosamente', 201);
  };

  listar = async (_req: Request, res: Response): Promise<void> => {
    const marcas = await this.service.listar();
    sendSuccess(res, marcas);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    const marca = await this.service.obtenerPorId(idDeParametro(req));
    sendSuccess(res, marca);
  };

  /** GET /catalogo/marcas/:id/logotipo — imagen cruda, fuera del sobre JSON estándar. */
  obtenerLogotipo = async (req: Request, res: Response): Promise<void> => {
    const { logotipo, logotipo_mime_type } = await this.service.obtenerLogotipo(idDeParametro(req));
    res.setHeader('Content-Type', logotipo_mime_type);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(logotipo);
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarMarcaDto.parse(req.body);
    const marca = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, marca, 'Marca actualizada exitosamente');
  };

  /** RF-CAT-09-03: aviso previo de impacto en cascada antes de desactivar. */
  impactoDesactivacion = async (req: Request, res: Response): Promise<void> => {
    const impacto = await this.service.impactoDesactivacion(idDeParametro(req));
    sendSuccess(res, impacto);
  };

  desactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.desactivar(idDeParametro(req));
    sendSuccess(res, resultado);
  };

  reactivar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.reactivar(idDeParametro(req));
    sendSuccess(res, resultado, 'Marca reactivada exitosamente');
  };
}
