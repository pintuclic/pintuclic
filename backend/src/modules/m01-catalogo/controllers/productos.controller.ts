import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { ProductosService } from '../services/productos.service';
import { CrearProductoDto, ActualizarProductoDto } from '../dtos/productos.dto';

// ==============================================================================
// M01 - CONTROLADOR DE PRODUCTOS (HU-CAT-02)
// ==============================================================================

function idDeParametro(req: Request, nombre: string = 'id'): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  crear = async (req: Request, res: Response): Promise<void> => {
    const dto = CrearProductoDto.parse(req.body);
    const producto = await this.service.crear(dto);
    sendSuccess(res, producto, 'Producto creado exitosamente', 201);
  };

  listar = async (req: Request, res: Response): Promise<void> => {
    const filtros: { busqueda?: string; idMarca?: number } = {};
    if (typeof req.query.q === 'string' && req.query.q.trim() !== '') {
      filtros.busqueda = req.query.q.trim();
    }
    if (typeof req.query.marca === 'string' && Number.isInteger(Number(req.query.marca))) {
      filtros.idMarca = Number(req.query.marca);
    }
    const productos = await this.service.listar(filtros);
    sendSuccess(res, productos);
  };

  obtener = async (req: Request, res: Response): Promise<void> => {
    const producto = await this.service.obtenerPorId(idDeParametro(req));
    sendSuccess(res, producto);
  };

  actualizar = async (req: Request, res: Response): Promise<void> => {
    const dto = ActualizarProductoDto.parse(req.body);
    const producto = await this.service.actualizar(idDeParametro(req), dto);
    sendSuccess(res, producto, 'Producto actualizado exitosamente');
  };

  publicar = async (req: Request, res: Response): Promise<void> => {
    const producto = await this.service.publicar(idDeParametro(req));
    sendSuccess(res, producto, 'Producto publicado exitosamente');
  };

  despublicar = async (req: Request, res: Response): Promise<void> => {
    const producto = await this.service.despublicar(idDeParametro(req));
    sendSuccess(res, producto, 'Producto retirado del catálogo público');
  };

  /** RF-CAT-09-03: aviso previo de impacto antes de desactivar el producto. */
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
    sendSuccess(res, resultado, 'Producto reactivado exitosamente');
  };
}
