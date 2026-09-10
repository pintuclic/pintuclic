import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { BuscarProductosDto } from '../dtos/busqueda.dto';
import { BusquedaService } from '../services/busqueda.service';

// ==============================================================================
// M02 - CONTROLADOR DE BÚSQUEDA (HU-BUS-01) — sin autenticación
// Extrae y valida los parámetros de query con Zod y delega en el servicio. Los
// errores no controlados los uniforma el errorHandler global sin exponer detalle
// técnico (RF-BUS-01-06 / CA-BUS-01-07).
// ==============================================================================

export class BusquedaController {
  constructor(private readonly service: BusquedaService) {}

  buscar = async (req: Request, res: Response): Promise<void> => {
    const { q, pagina, limite } = BuscarProductosDto.parse(req.query);
    const opciones: { termino?: string; pagina?: number; limite?: number } = {};
    if (q !== undefined) opciones.termino = q;
    if (pagina !== undefined) opciones.pagina = pagina;
    if (limite !== undefined) opciones.limite = limite;
    sendSuccess(res, await this.service.buscar(opciones));
  };
}
