import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { ImagenesService } from '../services/imagenes.service';
import { CrearImagenDto, ActualizarImagenDto } from '../dtos/imagenes.dto';

// ==============================================================================
// M01 - CONTROLADOR DE IMÁGENES (HU-CAT-07)
// ==============================================================================

function idDeParametro(req: Request, nombre: string): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class ImagenesController {
  constructor(private readonly service: ImagenesService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearImagenDto.parse(req.body);
    const imagen = await this.service.crear(idDeParametro(req, 'idProducto'), dto);
    sendSuccess(res, imagen, 'Imagen cargada exitosamente', 201);
  };

  listarPorProducto = async (req: Request, res: Response): Promise<void> => {
    const imagenes = await this.service.listarPorProducto(idDeParametro(req, 'idProducto'));
    sendSuccess(res, imagenes);
  };

  /** GET /catalogo/imagenes/:id/contenido — binario, fuera del sobre JSON estándar. */
  contenido = async (req: Request, res: Response): Promise<void> => {
    const { datos, mime_type } = await this.service.obtenerContenido(idDeParametro(req, 'id'));
    res.setHeader('Content-Type', mime_type);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(datos);
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarImagenDto.parse(req.body);
    const imagen = await this.service.actualizar(idDeParametro(req, 'id'), dto);
    sendSuccess(res, imagen, 'Imagen actualizada exitosamente');
  };

  eliminar = async (req: Request, res: Response): Promise<void> => {
    const resultado = await this.service.eliminar(idDeParametro(req, 'id'));
    sendSuccess(res, resultado, 'Imagen eliminada');
  };
}
