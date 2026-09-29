import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CatalogoPublicoService } from '../services/catalogo-publico.service';

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

function enteroDeQuery(req: Request, nombre: string): number | undefined {
  const valor = req.query[nombre];
  if (typeof valor !== 'string' || valor.trim() === '') return undefined;
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export class CatalogoPublicoController {
  constructor(private readonly service: CatalogoPublicoService) {}

  categorias = async (_req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.listarCategorias());
  };

  productos = async (req: Request, res: Response): Promise<void> => {
    const opciones: { idSubcategoria?: number; busqueda?: string; pagina?: number; limite?: number } = {};
    const idSubcategoria = enteroDeQuery(req, 'subcategoria');
    const pagina = enteroDeQuery(req, 'pagina');
    const limite = enteroDeQuery(req, 'limite');
    if (idSubcategoria !== undefined) opciones.idSubcategoria = idSubcategoria;
    if (pagina !== undefined) opciones.pagina = pagina;
    if (limite !== undefined) opciones.limite = limite;
    if (typeof req.query.q === 'string' && req.query.q.trim() !== '') opciones.busqueda = req.query.q.trim();

    const resultado = await this.service.listarProductos(opciones);
    sendSuccess(res, resultado);
  };

  ficha = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.obtenerFicha(idDeParametro(req, 'id')));
  };

  complementarios = async (req: Request, res: Response): Promise<void> => {
    sendSuccess(res, await this.service.complementarios(idDeParametro(req, 'id')));
  };
}
