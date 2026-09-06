import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { PerfilService } from '../services/perfil.service';
import { DireccionService } from '../services/direccion.service';
import {
  actualizarPerfilSchema,
  solicitarCambioCorreoSchema,
  confirmarCambioCorreoSchema,
  solicitarAscensoEmpresaSchema,
  crearDireccionSchema,
  actualizarDireccionSchema,
} from '../dtos';

// ==============================================================================
// M04 - CONTROLADOR DE PERFIL Y DIRECCIONES (HU-CUE-06, HU-CUE-07)
// Rutas protegidas que exigen validación de sesión e identidad en servidor
// ==============================================================================

export class PerfilController {
  constructor(
    private readonly perfilService: PerfilService,
    private readonly direccionService: DireccionService
  ) {}

  private obtenerIdUsuarioAutenticado(req: Request): number {
    const idUsuario = req.user?.id;
    if (!idUsuario) {
      throw new AppError('No se identificó el usuario autenticado', 401, 'UNAUTHORIZED');
    }
    return Number(idUsuario);
  }

  /**
   * GET /api/cuentas/perfil (HU-CUE-06 / CA-CUE-06-01)
   */
  obtenerPerfil = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const perfil = await this.perfilService.obtenerPerfil(idUsuario);
    return sendSuccess(res, perfil, 'Perfil obtenido exitosamente');
  };

  /**
   * PUT /api/cuentas/perfil (HU-CUE-06 / RF-CUE-06-02)
   */
  actualizarPerfil = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const datos = actualizarPerfilSchema.parse(req.body);
    const perfilActualizado = await this.perfilService.actualizarPerfil(idUsuario, datos);
    return sendSuccess(res, perfilActualizado, 'Perfil actualizado correctamente');
  };

  /**
   * POST /api/cuentas/perfil/cambiar-correo/solicitar (HU-CUE-06 / RF-CUE-06-03)
   */
  solicitarCambioCorreo = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const datos = solicitarCambioCorreoSchema.parse(req.body);
    const resultado = await this.perfilService.solicitarCambioCorreo(idUsuario, datos);
    return sendSuccess(res, resultado, resultado.mensaje);
  };

  /**
   * POST /api/cuentas/perfil/cambiar-correo/confirmar (HU-CUE-06 / CA-CUE-06-02)
   */
  confirmarCambioCorreo = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const datos = confirmarCambioCorreoSchema.parse(req.body);
    const resultado = await this.perfilService.confirmarCambioCorreo(idUsuario, datos);
    return sendSuccess(res, resultado, resultado.mensaje);
  };

  /**
   * POST /api/cuentas/perfil/solicitar-empresa (HU-CUE-06 / RF-CUE-06-07)
   */
  solicitarAscensoEmpresa = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const datos = solicitarAscensoEmpresaSchema.parse(req.body);
    const resultado = await this.perfilService.solicitarAscensoEmpresa(idUsuario, datos);
    return sendSuccess(res, resultado, resultado.mensaje, 201);
  };

  // ---------------------------------------------------------------------------
  // HU-CUE-07: Gestión de Direcciones
  // ---------------------------------------------------------------------------

  /**
   * GET /api/cuentas/direcciones (HU-CUE-07 / RF-CUE-07-01)
   */
  listarDirecciones = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const direcciones = await this.direccionService.listarDirecciones(idUsuario);
    return sendSuccess(res, direcciones, 'Listado de direcciones obtenido');
  };

  /**
   * POST /api/cuentas/direcciones (HU-CUE-07 / CA-CUE-07-01)
   */
  crearDireccion = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const datos = crearDireccionSchema.parse(req.body);
    const direccion = await this.direccionService.crearDireccion(idUsuario, datos);
    return sendSuccess(res, direccion, 'Dirección agregada correctamente', 201);
  };

  /**
   * GET /api/cuentas/direcciones/:id (HU-CUE-07 / HU-SEG-03)
   */
  obtenerDireccion = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const idDireccion = req.params.id as string;
    const direccion = await this.direccionService.obtenerDireccion(idUsuario, idDireccion);
    return sendSuccess(res, direccion, 'Dirección obtenida');
  };

  /**
   * PUT /api/cuentas/direcciones/:id (HU-CUE-07 / RF-CUE-07-02)
   */
  actualizarDireccion = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const idDireccion = req.params.id as string;
    const datos = actualizarDireccionSchema.parse(req.body);
    const direccion = await this.direccionService.actualizarDireccion(idUsuario, idDireccion, datos);
    return sendSuccess(res, direccion, 'Dirección actualizada correctamente');
  };

  /**
   * DELETE /api/cuentas/direcciones/:id (HU-CUE-07 / CA-CUE-07-03)
   */
  eliminarDireccion = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const idDireccion = req.params.id as string;
    const resultado = await this.direccionService.eliminarDireccion(idUsuario, idDireccion);
    return sendSuccess(res, resultado, resultado.mensaje);
  };

  /**
   * PATCH /api/cuentas/direcciones/:id/predeterminada (HU-CUE-07 / CA-CUE-07-02)
   */
  marcarPredeterminada = async (req: Request, res: Response): Promise<Response> => {
    const idUsuario = this.obtenerIdUsuarioAutenticado(req);
    const idDireccion = req.params.id as string;
    const resultado = await this.direccionService.marcarPredeterminada(idUsuario, idDireccion);
    return sendSuccess(res, resultado, resultado.mensaje);
  };
}
