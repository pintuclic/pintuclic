import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { obtenerIdentidadVigente } from '../../m20-seguridad/middlewares/autorizacion.middleware';
import {
  CambiarEstadoDto,
  CodigoOrdenDto,
  CrearNotaDto,
  ListarMisPedidosDto,
  ListarOrdenesGestionDto,
  PaginacionDto,
  RegistrarContactoDto,
} from '../dtos/ordenes.dto';
import { OrdenesService } from '../services/ordenes.service';
import { GestionOrdenesService } from '../services/gestion-ordenes.service';
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
  if (dto.correo) filtros.correoCliente = dto.correo;
  if (dto.telefono) filtros.telefonoCliente = dto.telefono;
  return filtros;
}

// ==============================================================================
// M08 - CONTROLADOR DE ÓRDENES (HU-ORD-03, 04, 05, 07, 08, 09, 10 y 11)
// Solo transporte HTTP y delegación. La identidad la resuelven en vivo las guardas
// de M20 (`sesionVigente`) antes de llegar aquí.
// ==============================================================================

export class OrdenesController {
  constructor(
    private readonly service: OrdenesService,
    private readonly gestion: GestionOrdenesService
  ) {}

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

  // HU-ORD-05 / HU-ORD-08: bandeja y buscador del personal (permiso exigido en la ruta).
  listarOrdenesGestion = async (req: Request, res: Response): Promise<Response> => {
    const dto = ListarOrdenesGestionDto.parse(req.query);
    const pagina = await this.service.listarOrdenesParaPersonal(
      filtrosGestionDesde(dto),
      dto.pagina,
      dto.limite,
      dto.orden ?? 'recientes'
    );
    return sendSuccess(res, pagina, 'Listado de órdenes');
  };

  // HU-ORD-05 (CA-ORD-05-05): contadores por estado para la navegación del panel.
  resumenGestion = async (_req: Request, res: Response): Promise<Response> => {
    return sendSuccess(res, await this.service.resumenPorEstado(), 'Resumen de órdenes por estado');
  };

  // HU-ORD-11: compras anteriores del titular, abiertas desde una de sus órdenes.
  historialCliente = async (req: Request, res: Response): Promise<Response> => {
    const { pagina, limite } = PaginacionDto.parse(req.query);
    const historial = await this.service.historialDelCliente(this.codigoDe(req), pagina, limite);
    return sendSuccess(res, historial, 'Historial de compras del cliente');
  };

  // HU-ORD-08 / HU-ORD-09: detalle de una orden para el personal, con el contacto del cliente.
  detallePedidoGestion = async (req: Request, res: Response): Promise<Response> => {
    const detalle = await this.service.detallePedidoParaPersonal(this.codigoDe(req));
    return sendSuccess(res, detalle, 'Detalle de la orden');
  };

  // HU-ORD-03 / CA-ORD-05-01: el personal con «Gestión de pedidos» hace avanzar una orden.
  cambiarEstado = async (req: Request, res: Response): Promise<Response> => {
    const codigo = this.codigoDe(req);
    const { estado, motivo } = CambiarEstadoDto.parse(req.body);
    const resultado = await this.gestion.cambiarEstado(codigo, estado, this.idUsuarioDe(req), motivo);
    return sendSuccess(res, resultado, 'Estado de la orden actualizado');
  };

  // HU-ORD-10: nota interna del personal.
  crearNota = async (req: Request, res: Response): Promise<Response> => {
    const codigo = this.codigoDe(req);
    const { texto } = CrearNotaDto.parse(req.body);
    const nota = await this.gestion.crearNota(codigo, this.idUsuarioDe(req), texto);
    return sendSuccess(res, nota, 'Nota interna registrada', 201);
  };

  // CA-ORD-10-03: una nota no se edita ni se borra; si tiene un error se añade otra.
  notaNoModificable = (): never => {
    throw new AppError(
      'Las notas internas no se pueden modificar ni borrar. Si una nota tiene un error, añade otra que lo aclare.',
      405,
      'NOTA_INMUTABLE'
    );
  };

  // CA-ORD-09-03: constancia de un contacto con el cliente iniciado desde la orden.
  registrarContacto = async (req: Request, res: Response): Promise<Response> => {
    const codigo = this.codigoDe(req);
    const { medio, detalle } = RegistrarContactoDto.parse(req.body);
    const contacto = await this.gestion.registrarContacto(codigo, this.idUsuarioDe(req), medio, detalle);
    return sendSuccess(res, contacto, 'Contacto con el cliente registrado', 201);
  };
}
