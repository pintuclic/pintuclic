import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import { ListarProductosQuerySchema, PaginaColoresQuerySchema, IdParamSchema } from '../dtos/catalogo-publico.dto';

// ==============================================================================
// M01 - CONTROLADOR DE CONSULTA PÚBLICA (HU-CAT-06) — sin autenticación
// ==============================================================================


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
    const validacionId = IdParamSchema.safeParse(req.params);
    if (!validacionId.success) {
      throw new AppError('Identificador inválido', 400, 'VALIDATION_ERROR', validacionId.error.errors);
    }
    sendSuccess(res, await this.service.obtenerFicha(validacionId.data.id));
  };

  colores = async (req: Request, res: Response): Promise<void> => {
    const validacionId = IdParamSchema.safeParse(req.params);
    if (!validacionId.success) {
      throw new AppError('Identificador inválido', 400, 'VALIDATION_ERROR', validacionId.error.errors);
    }
    const validacionQuery = PaginaColoresQuerySchema.safeParse(req.query);
    if (!validacionQuery.success) {
      throw new AppError('Parámetros de consulta inválidos', 400, 'VALIDATION_ERROR', validacionQuery.error.errors);
    }
    
    sendSuccess(res, await this.service.obtenerColoresPaginados(validacionId.data.id, validacionQuery.data));
  };
  complementarios = async (req: Request, res: Response): Promise<void> => {
    const validacionId = IdParamSchema.safeParse(req.params);
    if (!validacionId.success) {
      throw new AppError('Identificador inválido', 400, 'VALIDATION_ERROR', validacionId.error.errors);
    }
    sendSuccess(res, await this.service.complementarios(validacionId.data.id));
  };
}
