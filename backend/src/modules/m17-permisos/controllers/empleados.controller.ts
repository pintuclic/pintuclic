import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../core/utils/apiResponse';
import { EmpleadosService } from '../services/empleados.service';
import { CrearEmpleadoDto, ActualizarContactoEmpleadoDto, DesactivarEmpleadoDto, FiltroEmpleadosDto } from '../dtos/empleados.dto';

// ==============================================================================
// M17 - CONTROLADOR DE EMPLEADOS
// Maneja las solicitudes HTTP para gestion de empleados.
// Todas las respuestas pasan por sendSuccess/sendError (sin fugas de credenciales).
// ==============================================================================

export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  /**
   * POST /api/admin/empleados
   * Crea un nuevo empleado con credencial temporal de un solo uso (RF-ADM-01-02).
   */
  crearEmpleado = async (req: Request, res: Response): Promise<void> => {
    const parsed = CrearEmpleadoDto.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Datos de empleado invalidos', 'VALIDATION_ERROR', 422, parsed.error.issues);
      return;
    }

    const resultado = await this.empleadosService.crearEmpleado(parsed.data);
    if ('error' in resultado) {
      sendError(res, resultado.error, 'CONFLICT', 409);
      return;
    }

    sendSuccess(res, resultado, 'Empleado creado exitosamente', 201);
  };

  /**
   * GET /api/admin/empleados
   * Lista empleados con filtros opcionales (RF-ADM-01-12).
   */
  listarEmpleados = async (req: Request, res: Response): Promise<void> => {
    const parsed = FiltroEmpleadosDto.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, 'Filtros invalidos', 'VALIDATION_ERROR', 422, parsed.error.issues);
      return;
    }

    const resultado = await this.empleadosService.listarEmpleados(parsed.data);
    sendSuccess(res, resultado.empleados, 'Empleados obtenidos', 200, {
      total: resultado.total,
      pagina: resultado.pagina,
      por_pagina: resultado.por_pagina,
    });
  };

  /**
   * GET /api/admin/empleados/:id
   * Ficha completa de un empleado con sus permisos (RF-ADM-01-13).
   */
  obtenerEmpleado = async (req: Request, res: Response): Promise<void> => {
    const idUsuario = Number(req.params['id']);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      sendError(res, 'Identificador de empleado invalido', 'BAD_REQUEST', 400);
      return;
    }

    const empleado = await this.empleadosService.obtenerEmpleado(idUsuario);
    if (!empleado) {
      sendError(res, 'Empleado no encontrado', 'NOT_FOUND', 404);
      return;
    }

    sendSuccess(res, empleado);
  };

  /**
   * PATCH /api/admin/empleados/:id
   * Actualiza datos de contacto (nombre y/o telefono) (RF-ADM-01-07).
   */
  actualizarContacto = async (req: Request, res: Response): Promise<void> => {
    const idUsuario = Number(req.params['id']);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      sendError(res, 'Identificador de empleado invalido', 'BAD_REQUEST', 400);
      return;
    }

    const parsed = ActualizarContactoEmpleadoDto.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Datos de actualizacion invalidos', 'VALIDATION_ERROR', 422, parsed.error.issues);
      return;
    }

    const resultado = await this.empleadosService.actualizarContacto(idUsuario, parsed.data);
    if (!resultado.ok) {
      sendError(res, resultado.error ?? 'Error al actualizar', 'NOT_FOUND', 404);
      return;
    }

    sendSuccess(res, null, 'Datos de contacto actualizados');
  };

  /**
   * PATCH /api/admin/empleados/:id/desactivar
   * Baja logica del empleado (RF-ADM-01-10). Invalida sesiones via M20.
   */
  desactivarEmpleado = async (req: Request, res: Response): Promise<void> => {
    const idUsuario = Number(req.params['id']);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      sendError(res, 'Identificador de empleado invalido', 'BAD_REQUEST', 400);
      return;
    }

    const parsed = DesactivarEmpleadoDto.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 'Motivo de desactivacion invalido', 'VALIDATION_ERROR', 422, parsed.error.issues);
      return;
    }

    const resultado = await this.empleadosService.desactivarEmpleado(idUsuario);
    if (!resultado.ok) {
      const status = resultado.error?.includes('raiz') ? 403 : 409;
      sendError(res, resultado.error ?? 'Error al desactivar', 'FORBIDDEN', status);
      return;
    }

    sendSuccess(res, null, 'Empleado desactivado exitosamente');
  };

  /**
   * PATCH /api/admin/empleados/:id/reactivar
   * Reactivacion de un empleado inactivo (RF-ADM-01-09).
   */
  reactivarEmpleado = async (req: Request, res: Response): Promise<void> => {
    const idUsuario = Number(req.params['id']);
    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
      sendError(res, 'Identificador de empleado invalido', 'BAD_REQUEST', 400);
      return;
    }

    const resultado = await this.empleadosService.reactivarEmpleado(idUsuario);
    if (!resultado.ok) {
      sendError(res, resultado.error ?? 'Error al reactivar', 'CONFLICT', 409);
      return;
    }

    sendSuccess(res, null, 'Empleado reactivado exitosamente');
  };
}
