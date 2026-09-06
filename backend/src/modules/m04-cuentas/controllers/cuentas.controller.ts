import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CuentasService } from '../services/cuentas.service';
import { AuthService } from '../services/auth.service';
import {
  registroParticularSchema,
  verificarCodigoSchema,
  reenviarCodigoSchema,
  registroEmpresaSchema,
  loginSchema,
  googleAuthSchema,
  googleVincularSchema,
  completarPasswordGoogleSchema,
  solicitarRecuperacionSchema,
  confirmarRecuperacionSchema,
} from '../dtos';

// ==============================================================================
// M04 - CONTROLADOR DE CUENTAS, REGISTRO Y AUTENTICACIÓN (HU-CUE-01 a 05, 08)
// Delegación a servicios, validación DTO con Zod y respuestas JSON uniformes
// ==============================================================================

export class CuentasController {
  constructor(
    private readonly cuentasService: CuentasService,
    private readonly authService: AuthService
  ) {}

  /**
   * POST /api/cuentas/registro/particular (HU-CUE-01)
   */
  registrarParticular = async (req: Request, res: Response): Promise<Response> => {
    const datos = registroParticularSchema.parse(req.body);
    const resultado = await this.cuentasService.registrarParticular(datos);
    return sendSuccess(res, resultado, resultado.mensaje, 201);
  };

  /**
   * POST /api/cuentas/verificar-codigo (HU-CUE-01 / CA-CUE-01-02)
   */
  verificarCodigo = async (req: Request, res: Response): Promise<Response> => {
    const datos = verificarCodigoSchema.parse(req.body);
    const resultado = await this.cuentasService.verificarCodigoActivacion(datos);
    return sendSuccess(res, resultado, resultado.mensaje, 200);
  };

  /**
   * POST /api/cuentas/reenviar-codigo (HU-CUE-01 / RF-CUE-01-04)
   */
  reenviarCodigo = async (req: Request, res: Response): Promise<Response> => {
    const datos = reenviarCodigoSchema.parse(req.body);
    const resultado = await this.cuentasService.reenviarCodigoActivacion(datos);
    return sendSuccess(res, resultado, resultado.mensaje, 200);
  };

  /**
   * POST /api/cuentas/registro/empresa (HU-CUE-03)
   */
  registrarEmpresa = async (req: Request, res: Response): Promise<Response> => {
    const datos = registroEmpresaSchema.parse(req.body);
    const resultado = await this.cuentasService.registrarEmpresa(datos);
    return sendSuccess(res, resultado, resultado.mensaje, 201);
  };

  /**
   * GET /api/cuentas/empresa/estado-solicitud (HU-CUE-03 / RF-CUE-03-04)
   */
  consultarEstadoSolicitudEmpresa = async (req: Request, res: Response): Promise<Response> => {
    const queryValor = (req.query.consulta as string | undefined) ?? (req.query.nit as string | undefined);
    if (!queryValor) {
      throw new AppError('Debe especificar el NIT o correo a consultar en el parámetro "consulta"', 400, 'BAD_REQUEST');
    }

    const resultado = await this.cuentasService.consultarEstadoSolicitudEmpresa(queryValor);
    return sendSuccess(res, resultado, 'Estado de la solicitud obtenido');
  };

  /**
   * POST /api/cuentas/login (HU-CUE-04)
   */
  login = async (req: Request, res: Response): Promise<Response> => {
    const datos = loginSchema.parse(req.body);
    const resultado = await this.authService.login(datos);
    return sendSuccess(res, resultado, 'Inicio de sesión exitoso', 200);
  };

  /**
   * POST /api/cuentas/logout (HU-CUE-04 / RF-CUE-04-02)
   */
  logout = async (req: Request, res: Response): Promise<Response> => {
    const idSesion = (req.user as any)?.sid ?? (req.body.idSesion as string | undefined);
    if (!idSesion) {
      throw new AppError('No hay sesión activa para cerrar', 400, 'BAD_REQUEST');
    }

    const resultado = await this.authService.logout(idSesion);
    return sendSuccess(res, resultado, resultado.mensaje);
  };

  /**
   * POST /api/cuentas/google (HU-CUE-02)
   */
  autenticarConGoogle = async (req: Request, res: Response): Promise<Response> => {
    const datos = googleAuthSchema.parse(req.body);
    const resultado = await this.authService.autenticarConGoogle(datos);
    return sendSuccess(res, resultado, resultado.mensaje, 200);
  };

  /**
   * POST /api/cuentas/google/vincular (HU-CUE-02 / CA-CUE-02-02)
   */
  confirmarVinculacionGoogle = async (req: Request, res: Response): Promise<Response> => {
    const datos = googleVincularSchema.parse(req.body);
    const resultado = await this.authService.confirmarVinculacionGoogle(datos);
    return sendSuccess(res, resultado, 'Cuenta vinculada exitosamente');
  };

  /**
   * POST /api/cuentas/google/completar-password (HU-CUE-02 / CA-CUE-02-04)
   */
  completarPasswordGoogle = async (req: Request, res: Response): Promise<Response> => {
    const datos = completarPasswordGoogleSchema.parse(req.body);
    const resultado = await this.authService.completarPasswordGoogle(datos);
    return sendSuccess(res, resultado, 'Contraseña establecida exitosamente');
  };

  /**
   * POST /api/cuentas/recuperar-password/solicitar (HU-CUE-05 / RF-CUE-05-01)
   */
  solicitarRecuperacion = async (req: Request, res: Response): Promise<Response> => {
    const datos = solicitarRecuperacionSchema.parse(req.body);
    const resultado = await this.authService.solicitarRecuperacion(datos);
    return sendSuccess(res, resultado, resultado.mensaje, 200);
  };

  /**
   * POST /api/cuentas/recuperar-password/confirmar (HU-CUE-05 / CA-CUE-05-01, 04)
   */
  confirmarRecuperacion = async (req: Request, res: Response): Promise<Response> => {
    const datos = confirmarRecuperacionSchema.parse(req.body);
    const resultado = await this.authService.confirmarRecuperacion(datos);
    return sendSuccess(res, resultado, resultado.mensaje, 200);
  };
}
