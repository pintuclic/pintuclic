import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { BuscarProductosDto, EstadisticasSinResultadoDto } from '../dtos/busqueda.dto';
import { BusquedaService } from '../services/busqueda.service';
import { FiltrosBusqueda, OrdenBusqueda } from '../interfaces/m02.interfaces';

// ==============================================================================
// M02 - CONTROLADOR DE BÚSQUEDA, FILTROS Y FACETAS (HU-BUS-01/02/03/05/06)
// Extrae y valida los parámetros de query con Zod y delega en el servicio. Los
// errores no controlados los uniforma el errorHandler global sin exponer detalle
// técnico (RF-BUS-01-06 / CA-BUS-01-07). El rango de precio inválido lo rechaza
// el DTO como error de validación 400 (CA-BUS-02-06).
// ==============================================================================

type FiltrosMutables = { -readonly [K in keyof FiltrosBusqueda]: FiltrosBusqueda[K] };

/** Traduce los parámetros de query validados a los filtros del dominio. */
function filtrosDesde(dto: BuscarProductosDto): FiltrosBusqueda | undefined {
  const filtros: FiltrosMutables = {};
  if (dto.categoria) filtros.idCategoria = dto.categoria;
  if (dto.subcategoria) filtros.idSubcategoria = dto.subcategoria;
  if (dto.marca) filtros.idMarca = dto.marca;
  if (dto.linea) filtros.idLinea = dto.linea;
  if (dto.resina) filtros.idTipoResina = dto.resina;
  if (dto.color) filtros.idColor = dto.color;
  if (dto.presentacion) filtros.idPresentacion = dto.presentacion;
  if (dto.precio_min !== undefined) filtros.precioMin = dto.precio_min;
  if (dto.precio_max !== undefined) filtros.precioMax = dto.precio_max;
  return Object.keys(filtros).length > 0 ? filtros : undefined;
}

export class BusquedaController {
  constructor(private readonly service: BusquedaService) {}

  buscar = async (req: Request, res: Response): Promise<void> => {
    const dto = BuscarProductosDto.parse(req.query);
    const filtros = filtrosDesde(dto);

    const opciones: {
      termino?: string;
      filtros?: FiltrosBusqueda;
      orden?: OrdenBusqueda;
      pagina?: number;
      limite?: number;
    } = {};
    if (dto.q !== undefined) opciones.termino = dto.q;
    if (dto.orden !== undefined) opciones.orden = dto.orden;
    if (dto.pagina !== undefined) opciones.pagina = dto.pagina;
    if (dto.limite !== undefined) opciones.limite = dto.limite;
    if (filtros !== undefined) opciones.filtros = filtros;

    sendSuccess(res, await this.service.buscar(opciones));
  };

  // HU-BUS-02 (RF-BUS-02-02): valores de filtro disponibles con su conteo, dado el
  // término y los filtros vigentes. Sin autenticación (mismo alcance que la búsqueda).
  facetas = async (req: Request, res: Response): Promise<void> => {
    const dto = BuscarProductosDto.parse(req.query);
    const filtros = filtrosDesde(dto);
    const opciones: { termino?: string; filtros?: FiltrosBusqueda } = {};
    if (dto.q !== undefined) opciones.termino = dto.q;
    if (filtros !== undefined) opciones.filtros = filtros;
    sendSuccess(res, await this.service.facetas(opciones));
  };

  // HU-BUS-06: listado admin de búsquedas sin resultado. La autorización
  // («Consultar estadísticas») la exige la ruta con guardas de M20 (CA-BUS-06-03).
  estadisticasSinResultado = async (req: Request, res: Response): Promise<void> => {
    const { periodo } = EstadisticasSinResultadoDto.parse(req.query);
    sendSuccess(res, await this.service.estadisticasSinResultado(periodo ?? 'mensual'));
  };
}
