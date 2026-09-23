import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';
import { ListarProductosQuerySchema, PaginaColoresQuerySchema, IdParamSchema } from '../dtos/catalogo-publico.dto';

// ==============================================================================
// M01 - CONTROLADOR DE CONSULTA PÚBLICA (HU-CAT-06) — sin autenticación
// ==============================================================================

type OpcionesListadoPublico = {
  idSubcategoria?: number;
  busqueda?: string;
  pagina?: number;
  limite?: number;
};

type OpcionesColoresPublicos = {
  q?: string;
  familia?: string;
  pagina?: number;
  limite?: number;
};

export class CatalogoPublicoController {
  constructor(private readonly service: CatalogoPublicoService) {}

  categorias = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listarCategorias());
  };

  productos = async (req: Request, res: Response): Promise<void> => {
    const validacion = ListarProductosQuerySchema.safeParse(req.query);
    if (!validacion.success) {
      throw new AppError('Parámetros de consulta inválidos', 400, 'VALIDATION_ERROR', validacion.error.issues);
    }
    const { subcategoria, q, pagina, limite } = validacion.data;
    const opciones: OpcionesListadoPublico = {};
    if (subcategoria !== undefined) opciones.idSubcategoria = subcategoria;
    if (q !== undefined) opciones.busqueda = q;
    if (pagina !== undefined) opciones.pagina = pagina;
    if (limite !== undefined) opciones.limite = limite;

    const resultado = await this.service.listarProductos(opciones);
    sendSuccess(res, resultado);
  };

  ficha = async (req: Request, res: Response): Promise<void> => {
    const validacionId = IdParamSchema.safeParse(req.params);
    if (!validacionId.success) {
      throw new AppError('Identificador inválido', 400, 'VALIDATION_ERROR', validacionId.error.issues);
    }
    sendSuccess(res, await this.service.obtenerFicha(validacionId.data.id));
  };

  colores = async (req: Request, res: Response): Promise<void> => {
    const validacionId = IdParamSchema.safeParse(req.params);
    if (!validacionId.success) {
      throw new AppError('Identificador inválido', 400, 'VALIDATION_ERROR', validacionId.error.issues);
    }
    const validacionQuery = PaginaColoresQuerySchema.safeParse(req.query);
    if (!validacionQuery.success) {
      throw new AppError('Parámetros de consulta inválidos', 400, 'VALIDATION_ERROR', validacionQuery.error.issues);
    }

    const { q, familia, pagina, limite } = validacionQuery.data;
    const opciones: OpcionesColoresPublicos = {};
    if (q !== undefined) opciones.q = q;
    if (familia !== undefined) opciones.familia = familia;
    if (pagina !== undefined) opciones.pagina = pagina;
    if (limite !== undefined) opciones.limite = limite;

    sendSuccess(res, await this.service.obtenerColoresPaginados(validacionId.data.id, opciones));
  };

  complementarios = async (req: Request, res: Response): Promise<void> => {
    const validacionId = IdParamSchema.safeParse(req.params);
    if (!validacionId.success) {
      throw new AppError('Identificador inválido', 400, 'VALIDATION_ERROR', validacionId.error.issues);
    }
    sendSuccess(res, await this.service.complementarios(validacionId.data.id));
  };
}
