import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { obtenerIdentidadVigente } from '../../m20-seguridad/middlewares/autorizacion.middleware';
import { CodigoOrdenDto, ListarMisPedidosDto, ListarOrdenesGestionDto } from '../dtos/ordenes.dto';
import { OrdenesService } from '../services/ordenes.service';
import { FiltrosGestionOrdenes } from '../interfaces/m08.interfaces';

type FiltrosMutables = { -readonly [K in keyof FiltrosGestionOrdenes]: FiltrosGestionOrdenes[K] };

/** Traduce la query validada a filtros del dominio; un filtro vacío se trata como ausente. */
function filtrosGestionDesde(dto: ListarOrdenesGestionDto): FiltrosGestionOrdenes {
  const filtros: FiltrosMutables = {};
  if (dto.codigo) filtros.codigo = dto.codigo;
  if (dto.estado) filtros.estado = dto.estado;
  if (dto.desde) filtros.desde = dto.desde;
  if (dto.hasta) filtros.hasta = dto.hasta;
  if (dto.cliente !== undefined) filtros.idCliente = dto.cliente;
  return filtros;
}

// ==============================================================================
// M08 - CONTROLADOR DE CONSULTA DE ÓRDENES (HU-ORD-04, HU-ORD-05, HU-ORD-07)
// Solo transporte HTTP y delegación. La identidad la resuelven en vivo las guardas
// de M20 (`sesionVigente`) antes de llegar aquí.
// ==============================================================================

export class OrdenesController {
  constructor(private readonly service: OrdenesService) {}

  private idUsuarioDe(req: Request): number {
    const identidad = obtenerIdentidadVigente(req);
    if (!identidad) {
      throw new AppError('Se requiere una sesión activa', 401, 'UNAUTHORIZED');
    }
    return identidad.id_usuario;
  }

  /** Un código ilegible responde como recurso inexistente, nunca como error de validación (RF-SEG-03-05). */
  private codigoDe(req: Request): string {
    const resultado = CodigoOrdenDto.safeParse(req.params);
    if (!resultado.success) {
      throw new AppError('Recurso no encontrado', 404, 'NOT_FOUND');
    }
    return resultado.data.codigo;
  }

  // HU-ORD-07: sección de pedidos del cliente autenticado.
  listarMisPedidos = async (req: Request, res: Response): Promise<Response> => {
    const { q } = ListarMisPedidosDto.parse(req.query);
    const pedidos = await this.service.listarPedidosDeCliente(this.idUsuarioDe(req), q);
    return sendSuccess(res, pedidos, 'Pedidos del cliente');
  };

  // HU-ORD-04: detalle de un pedido propio por su código visible.
  detalleMiPedido = async (req: Request, res: Response): Promise<Response> => {
    const detalle = await this.service.detallePedidoDeCliente(
      this.idUsuarioDe(req),
      this.codigoDe(req),
      `${req.method} ${req.originalUrl}`
    );
    return sendSuccess(res, detalle, 'Detalle del pedido');
  };

  // HU-ORD-05: listado del personal con filtros (permiso exigido en la ruta).
  listarOrdenesGestion = async (req: Request, res: Response): Promise<Response> => {
    const dto = ListarOrdenesGestionDto.parse(req.query);
    const pagina = await this.service.listarOrdenesParaPersonal(filtrosGestionDesde(dto), dto.pagina, dto.limite);
    return sendSuccess(res, pagina, 'Listado de órdenes');
  };

  // HU-ORD-05: consulta por identificador para personal autorizado (permiso exigido en la ruta).
  detallePedidoGestion = async (req: Request, res: Response): Promise<Response> => {
    const detalle = await this.service.detallePedidoParaPersonal(this.codigoDe(req));
    return sendSuccess(res, detalle, 'Detalle de la orden');
  };
}
