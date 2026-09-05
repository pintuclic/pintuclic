import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../core/utils/apiResponse';
import { ClientesService } from '../services/clientes.service';
import { FiltroClientesDto, DesactivarClienteDto } from '../dtos/clientes.dto';

// ==============================================================================
// M17 - CONTROLADOR DE CLIENTES
// Consulta y gestion de cuentas de clientes desde el panel de administracion.
// ==============================================================================

export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  /**
   * GET /api/admin/clientes
   * Lista clientes con filtros opcionales (RF-ADM-04-01).
   */
  listarClientes = async (req: Request, res: Response): Promise<void> => {
    const parsed = FiltroClientesDto.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, 'Filtros invalidos', 'VALIDATION_ERROR', 422, parsed.error.issues);
      return;
    }

    const resultado = await this.clientesService.listarClientes(parsed.data);
    sendSuccess(res, resultado.clientes, 'Clientes obtenidos', 200, {
      total: resultado.total,
      pagina: resultado.pagina,
      por_pagina: resultado.por_pagina,
    });
  };

  /**
   * GET /api/admin/clientes/:id
   * Ficha de un cliente especifico (RF-ADM-04-02). Correo anonimizado (HU-SEG-06).
   */
  obtenerCliente = async (req: Request, res: Response): Promise<void> => {
    const idUsuario = Number(req.params['id']);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      sendError(res, 'Identificador de cliente invalido', 'BAD_REQUEST', 400);
      return;
    }

    const cliente = await this.clientesService.obtenerCliente(idUsuario);
    if (!cliente) {
      sendError(res, 'Cliente no encontrado', 'NOT_FOUND', 404);
      return;
    }

    sendSuccess(res, cliente);
  };

  /**
   * PATCH /api/admin/clientes/:id/bloquear
   * Bloqueo administrativo con motivo obligatorio (RF-ADM-04-12).
   */
  bloquearCliente = async (req: Request, res: Response): Promise<void> => {
    const idUsuario = Number(req.params['id']);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      sendError(res, 'Identificador de cliente invalido', 'BAD_REQUEST', 400);
      return;
    }

    const parsed = DesactivarClienteDto.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Motivo de bloqueo invalido', 'VALIDATION_ERROR', 422, parsed.error.issues);
      return;
    }

    const resultado = await this.clientesService.bloquearCliente(idUsuario, parsed.data.motivo);
    if (!resultado.ok) {
      sendError(res, resultado.error ?? 'Error al bloquear', 'CONFLICT', 409);
      return;
    }

    sendSuccess(res, null, 'Cliente bloqueado exitosamente');
  };

  /**
   * PATCH /api/admin/clientes/:id/desbloquear
   * Desbloqueo de un cliente bloqueado.
   */
  desbloquearCliente = async (req: Request, res: Response): Promise<void> => {
    const idUsuario = Number(req.params['id']);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      sendError(res, 'Identificador de cliente invalido', 'BAD_REQUEST', 400);
      return;
    }

    const resultado = await this.clientesService.desbloquearCliente(idUsuario);
    if (!resultado.ok) {
      sendError(res, resultado.error ?? 'Error al desbloquear', 'CONFLICT', 409);
      return;
    }

    sendSuccess(res, null, 'Cliente desbloqueado exitosamente');
  };
}
