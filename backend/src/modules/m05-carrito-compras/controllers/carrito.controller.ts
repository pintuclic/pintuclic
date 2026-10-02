import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CarritoService } from '../services/carrito.service';
import {
  agregarItemSchema,
  actualizarItemSchema,
  fusionarCarritoSchema,
} from '../dtos';

// ==============================================================================
// M05 - CONTROLADOR DEL CARRITO DE COMPRAS
// Rutas públicas (visitante) y protegidas (cliente autenticado)
// La autenticación se difiere al momento del checkout (RF-CAR-01-02)
// ==============================================================================

/** Header HTTP donde el frontend envía el token opaco del visitante (ADR-01). */
const HEADER_TOKEN_VISITANTE = 'x-visitor-token';

export class CarritoController {
  constructor(private readonly carritoService: CarritoService) {}

  /**
   * Extrae el token de visitante del header HTTP.
   * Lanza AppError si el header no está presente.
   */
  private extraerTokenVisitante(req: Request): string {
    const token = req.headers[HEADER_TOKEN_VISITANTE];
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new AppError(
        `El header '${HEADER_TOKEN_VISITANTE}' es obligatorio para operaciones de carrito anónimo`,
        400,
        'MISSING_VISITOR_TOKEN'
      );
    }
    return token.trim();
  }

  /**
   * Extrae el id del usuario autenticado desde req.user (poblado por la guarda de M20).
   */
  private extraerIdUsuario(req: Request): number {
    const id = req.user?.id;
    if (!id) {
      throw new AppError('No se identificó el usuario autenticado', 401, 'UNAUTHORIZED');
    }
    return Number(id);
  }

  // ============================================================================
  // HU-CAR-01: Carrito de visitante
  // ============================================================================

  /**
   * GET /api/carrito/visitante
   * Obtiene o crea el carrito del visitante anónimo (RF-CAR-01-01 / RF-CAR-01-03).
   */
  obtenerCarritoVisitante = async (req: Request, res: Response): Promise<Response> => {
    const token = this.extraerTokenVisitante(req);
    const carrito = await this.carritoService.obtenerOCrearCarritoVisitante(token);
    return sendSuccess(res, carrito, 'Carrito de visitante obtenido');
  };

  /**
   * POST /api/carrito/visitante/items
   * Agrega un ítem al carrito del visitante (acumula si ya existe) (HU-CAR-02 / RF-CAR-02-0X).
   */
  agregarItemVisitante = async (req: Request, res: Response): Promise<Response> => {
    const token = this.extraerTokenVisitante(req);
    const datos = agregarItemSchema.parse(req.body);
    const carrito = await this.carritoService.agregarItemVisitante(token, datos);
    return sendSuccess(res, carrito, 'Ítem agregado al carrito', 200);
  };

  /**
   * PUT /api/carrito/visitante/items/:idLinea
   * Actualiza la cantidad de una línea del carrito de visitante.
   * Cantidad 0 elimina la línea (HU-CAR-02).
   */
  actualizarItemVisitante = async (req: Request, res: Response): Promise<Response> => {
    const token = this.extraerTokenVisitante(req);
    const idLinea = Number(req.params['idLinea']);
    if (!Number.isInteger(idLinea) || idLinea <= 0) {
      throw new AppError('El identificador de línea debe ser un número entero positivo', 400, 'INVALID_PARAM');
    }
    const datos = actualizarItemSchema.parse(req.body);
    const carrito = await this.carritoService.actualizarItemVisitante(token, idLinea, datos);
    return sendSuccess(res, carrito, 'Línea del carrito actualizada');
  };

  /**
   * DELETE /api/carrito/visitante/items/:idLinea
   * Elimina una línea específica del carrito de visitante (HU-CAR-02).
   */
  eliminarItemVisitante = async (req: Request, res: Response): Promise<Response> => {
    const token = this.extraerTokenVisitante(req);
    const idLinea = Number(req.params['idLinea']);
    if (!Number.isInteger(idLinea) || idLinea <= 0) {
      throw new AppError('El identificador de línea debe ser un número entero positivo', 400, 'INVALID_PARAM');
    }
    const carrito = await this.carritoService.eliminarItemVisitante(token, idLinea);
    return sendSuccess(res, carrito, 'Ítem eliminado del carrito');
  };

  // ============================================================================
  // HU-CAR-04: Carrito de cliente autenticado
  // ============================================================================

  /**
   * GET /api/carrito/cliente
   * Obtiene o crea el carrito del cliente autenticado (HU-CAR-04 / RF-CAR-04-01).
   */
  obtenerCarritoCliente = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.extraerIdUsuario(req);
    const carrito = await this.carritoService.obtenerOCrearCarritoCliente(idUsuario);
    return sendSuccess(res, carrito, 'Carrito del cliente obtenido');
  };

  /**
   * POST /api/carrito/cliente/items
   * Agrega un ítem al carrito del cliente (acumula si ya existe) (HU-CAR-02 / RF-CAR-02-0X).
   */
  agregarItemCliente = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.extraerIdUsuario(req);
    const datos = agregarItemSchema.parse(req.body);
    const carrito = await this.carritoService.agregarItemCliente(idUsuario, datos);
    return sendSuccess(res, carrito, 'Ítem agregado al carrito', 200);
  };

  /**
   * PUT /api/carrito/cliente/items/:idLinea
   * Actualiza la cantidad de una línea del carrito del cliente.
   * Cantidad 0 elimina la línea (HU-CAR-02).
   */
  actualizarItemCliente = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.extraerIdUsuario(req);
    const idLinea = Number(req.params['idLinea']);
    if (!Number.isInteger(idLinea) || idLinea <= 0) {
      throw new AppError('El identificador de línea debe ser un número entero positivo', 400, 'INVALID_PARAM');
    }
    const datos = actualizarItemSchema.parse(req.body);
    const carrito = await this.carritoService.actualizarItemCliente(idUsuario, idLinea, datos);
    return sendSuccess(res, carrito, 'Línea del carrito actualizada');
  };

  /**
   * DELETE /api/carrito/cliente/items/:idLinea
   * Elimina una línea específica del carrito del cliente (HU-CAR-02).
   */
  eliminarItemCliente = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.extraerIdUsuario(req);
    const idLinea = Number(req.params['idLinea']);
    if (!Number.isInteger(idLinea) || idLinea <= 0) {
      throw new AppError('El identificador de línea debe ser un número entero positivo', 400, 'INVALID_PARAM');
    }
    const carrito = await this.carritoService.eliminarItemCliente(idUsuario, idLinea);
    return sendSuccess(res, carrito, 'Ítem eliminado del carrito');
  };

  /**
   * POST /api/carrito/cliente/fusionar
   * Fusiona el carrito anónimo del visitante con la cuenta del cliente al autenticarse (HU-CAR-04 / RF-CAR-04-01).
   */
  fusionarCarrito = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.extraerIdUsuario(req);
    const datos = fusionarCarritoSchema.parse(req.body);
    const resultado = await this.carritoService.fusionarCarritoConCuenta(idUsuario, datos);
    return sendSuccess(res, resultado, 'Carrito fusionado con la cuenta del cliente exitosamente');
  };

  // ============================================================================
  // HU-CAR-05: Revalidación previa al checkout
  // ============================================================================

  /**
   * GET /api/carrito/cliente/revalidar
   * Revalida precio vigente y existencia de todas las líneas antes del pago (HU-CAR-05).
   * Retorna alertas si hubo cambios de precio o stock insuficiente (RF-CAR-05-05).
   */
  revalidarCarrito = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.extraerIdUsuario(req);
    const resultado = await this.carritoService.revalidarCarritoCliente(idUsuario);
    const mensaje = resultado.valido
      ? 'Carrito validado correctamente. Puede proceder al pago.'
      : 'Se detectaron cambios en el carrito. Revise las alertas antes de continuar.';
    return sendSuccess(res, resultado, mensaje);
  };
}
