import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { PrivacidadService } from '../services/privacidad.service';
import { obtenerIdentidadVigente } from '../middlewares/autorizacion.middleware';
import {
  idSolicitudParamSchema,
  registroConsentimientoSchema,
  resolucionSupresionSchema,
} from '../dtos';

/**
 * Controlador de protección de datos personales (HU-SEG-05).
 * Solo transporte HTTP y delegación, conforme a `backend/infraestructura.md`.
 */
export class PrivacidadController {
  constructor(private readonly privacidad: PrivacidadService) {}

  private identidadDe(req: Request): number {
    const identidad = obtenerIdentidadVigente(req);
    if (!identidad) {
      throw new AppError('Se requiere una sesión activa', 401, 'UNAUTHORIZED');
    }
    return identidad.id_usuario;
  }

  /**
   * Aviso de privacidad vigente. Ruta pública: debe poder leerse ANTES de registrarse,
   * porque el usuario tiene que conocer el texto antes de consentirlo (RF-SEG-05-03/04).
   */
  consultarAviso = async (_req: Request, res: Response): Promise<Response> => {
    const aviso = await this.privacidad.obtenerAvisoVigente();
    return sendSuccess(res, aviso, 'Aviso de privacidad vigente');
  };

  /**
   * Estado del consentimiento del titular frente al aviso vigente (CA-SEG-05-06).
   */
  consultarConsentimiento = async (req: Request, res: Response): Promise<Response> => {
    const estado = await this.privacidad.consultarEstado(this.identidadDe(req));
    return sendSuccess(res, estado, 'Estado de consentimiento');
  };

  /**
   * Registra el consentimiento expreso (RF-SEG-05-01, RF-SEG-05-02).
   */
  registrarConsentimiento = async (req: Request, res: Response): Promise<Response> => {
    const datos = registroConsentimientoSchema.parse(req.body);
    const estado = await this.privacidad.registrarConsentimiento(this.identidadDe(req), datos);
    return sendSuccess(res, estado, 'Consentimiento registrado', 201);
  };

  /**
   * Solicita la supresión de datos personales y acusa recibo (CA-SEG-05-04).
   */
  solicitarSupresion = async (req: Request, res: Response): Promise<Response> => {
    const resultado = await this.privacidad.solicitarSupresion(this.identidadDe(req));

    const mensaje = resultado.conservaInformacionComercial
      ? 'Solicitud registrada. La información comercial exigida por la ley se conservará desvinculada de su identidad.'
      : 'Solicitud registrada. Recibirá confirmación de su tramitación.';

    return sendSuccess(res, resultado, mensaje, resultado.yaExistia ? 200 : 201);
  };

  /**
   * Solicitudes propias del titular.
   */
  listarMisSolicitudes = async (req: Request, res: Response): Promise<Response> => {
    const solicitudes = await this.privacidad.listarSolicitudesDeUsuario(this.identidadDe(req));
    return sendSuccess(res, { total: solicitudes.length, solicitudes }, 'Solicitudes de supresión');
  };

  /**
   * Cola administrativa de solicitudes en trámite.
   */
  listarSolicitudesPendientes = async (_req: Request, res: Response): Promise<Response> => {
    const solicitudes = await this.privacidad.listarSolicitudesPendientes();
    return sendSuccess(
      res,
      { total: solicitudes.length, solicitudes },
      'Solicitudes de supresión en trámite'
    );
  };

  /**
   * Resolución administrativa de una solicitud.
   */
  resolverSolicitud = async (req: Request, res: Response): Promise<Response> => {
    const { id } = idSolicitudParamSchema.parse(req.params);
    const datos = resolucionSupresionSchema.parse(req.body);
    const solicitud = await this.privacidad.resolverSolicitud(id, datos);
    return sendSuccess(res, solicitud, 'Solicitud de supresión resuelta');
  };
}
