import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { BuscarProductosDto } from '../dtos/busqueda.dto';
import { BusquedaService } from '../services/busqueda.service';
import { FiltrosBusqueda } from '../interfaces/m02.interfaces';

// ==============================================================================
// M02 - CONTROLADOR DE BÚSQUEDA Y FILTROS (HU-BUS-01, HU-BUS-02) — sin autenticación
// Extrae y valida los parámetros de query con Zod y delega en el servicio. Los
// errores no controlados los uniforma el errorHandler global sin exponer detalle
// técnico (RF-BUS-01-06 / CA-BUS-01-07). El rango de precio inválido lo rechaza
// el DTO como error de validación 400 (CA-BUS-02-06).
// ==============================================================================

export class BusquedaController {
  constructor(private readonly service: BusquedaService) {}

  buscar = async (req: Request, res: Response): Promise<void> => {
    const dto = BuscarProductosDto.parse(req.query);

    const filtros: { -readonly [K in keyof FiltrosBusqueda]: FiltrosBusqueda[K] } = {};
    if (dto.categoria) filtros.idCategoria = dto.categoria;
    if (dto.subcategoria) filtros.idSubcategoria = dto.subcategoria;
    if (dto.marca) filtros.idMarca = dto.marca;
    if (dto.linea) filtros.idLinea = dto.linea;
    if (dto.resina) filtros.idTipoResina = dto.resina;
    if (dto.color) filtros.idColor = dto.color;
    if (dto.presentacion) filtros.idPresentacion = dto.presentacion;
    if (dto.precio_min !== undefined) filtros.precioMin = dto.precio_min;
    if (dto.precio_max !== undefined) filtros.precioMax = dto.precio_max;

    const opciones: { termino?: string; filtros?: FiltrosBusqueda; pagina?: number; limite?: number } = {};
    if (dto.q !== undefined) opciones.termino = dto.q;
    if (dto.pagina !== undefined) opciones.pagina = dto.pagina;
    if (dto.limite !== undefined) opciones.limite = dto.limite;
    if (Object.keys(filtros).length > 0) opciones.filtros = filtros;

    sendSuccess(res, await this.service.buscar(opciones));
  };
}
