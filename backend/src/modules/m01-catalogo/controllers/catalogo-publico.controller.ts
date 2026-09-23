import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import { ListarProductosQuerySchema, PaginaColoresQuerySchema } from '../dtos/catalogo-publico.dto';

// ==============================================================================
// M01 - CONTROLADOR DE CONSULTA PÚBLICA (HU-CAT-06) — sin autenticación
// ==============================================================================

function idDeParametro(req: Request, nombre: string): number {
  const id = Number(req.params[nombre]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Identificador inválido', 400, 'BAD_REQUEST');
  }
  return id;
}

export class CatalogoPublicoController {
  constructor(private readonly service: CatalogoPublicoService) {}

  categorias = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listarCategorias());
  };

  productos = async (req: Request, res: Response): Promise<void> => {
    const validacion = ListarProductosQuerySchema.safeParse(req.query);
    if (!validacion.success) {
      throw new AppError('Parámetros de consulta inválidos', 400, 'VALIDATION_ERROR', validacion.error.errors);
    }
    const { subcategoria, q, pagina, limite } = validacion.data;

    const resultado = await this.service.listarProductos({
      idSubcategoria: subcategoria,
      busqueda: q,
      pagina,
      limite,
    });
    sendSuccess(res, resultado);
  };

  ficha = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.obtenerFicha(idDeParametro(req, 'id')));
  };

  colores = async (req: Request, res: Response): Promise<void> => {
    const validacion = PaginaColoresQuerySchema.safeParse(req.query);
    if (!validacion.success) {
      throw new AppError('Parámetros de consulta inválidos', 400, 'VALIDATION_ERROR', validacion.error.errors);
    }
    
    sendSuccess(res, await this.service.obtenerColoresPaginados(idDeParametro(req, 'id'), validacion.data));
  };

  complementarios = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.complementarios(idDeParametro(req, 'id')));
  };
}

