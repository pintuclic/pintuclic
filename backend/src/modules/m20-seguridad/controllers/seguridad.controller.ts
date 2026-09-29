import { Request, Response } from 'express';
import { sendSuccess } from '../../../core/utils/apiResponse';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CredencialesService } from '../services/credenciales.service';
import { SesionService } from '../services/sesion.service';
import { AutorizacionService } from '../services/autorizacion.service';
import { obtenerIdentidadVigente } from '../middlewares/autorizacion.middleware';
import {
  aperturaSesionSchema,
  cambioContrasenaSchema,
  politicaSesionSchema,
} from '../dtos';

/**
 * Controlador del módulo M20. Solo extrae datos de la petición, delega en los
 * servicios y devuelve JSON, conforme a `backend/infraestructura.md`.
 *
 * Ninguna respuesta de este controlador incluye contraseñas ni hashes (HU-SEG-06).
 */
export class SeguridadController {
  constructor(
    private readonly credenciales: CredencialesService,
    private readonly sesion: SesionService,
    private readonly autorizacion: AutorizacionService
  ) {}

  /**
   * Abre una sesión a partir de unas credenciales.
   *
   * ⚠️ El flujo de login de cara al usuario (formulario, registro, Google, bloqueo por
   * intentos) pertenece a **M04**. M20 solo aporta la verificación de la credencial y la
   * emisión de la sesión; M04 debe consumir `serviciosSeguridad` en lugar de duplicar
   * esta lógica. Esta ruta queda deshabilitada en producción.
   */
  abrirSesion = async (req: Request, res: Response): Promise<Response> => {
    const datos = aperturaSesionSchema.parse(req.body);
    const usuario = await this.credenciales.verificarCredenciales(datos.correo, datos.contrasena);

    // Respuesta uniforme: correo inexistente y contraseña equivocada son
    // indistinguibles entre sí (RF-SEG-06-06).
    if (!usuario) {
      throw new AppError('Credenciales no válidas', 401, 'UNAUTHORIZED');
    }

    const identidad = await this.autorizacion.resolverIdentidad(usuario.id_usuario);
    if ('motivo' in identidad) {
      throw new AppError('Credenciales no válidas', 401, 'UNAUTHORIZED');
    }

    const tipoSesion = this.sesion.clasificarSesion(identidad.identidad.id_rol);
    const emitida = await this.sesion.abrirSesion(
      { id: usuario.id_usuario, correo: usuario.correo, id_rol: identidad.identidad.id_rol },
      tipoSesion
    );

    return sendSuccess(res, emitida, 'Sesión iniciada', 201);
  };

  /**
   * Estado de la sesión en curso (RF-SEG-02-08).
   */
  consultarSesion = (req: Request, res: Response): Response => {
    const identidad = obtenerIdentidadVigente(req);
    if (!identidad) {
      throw new AppError('Se requiere una sesión activa', 401, 'UNAUTHORIZED');
    }

    const tipoSesion = this.sesion.clasificarSesion(identidad.id_rol);

    return sendSuccess(
      res,
      {
        id_usuario: identidad.id_usuario,
        id_rol: identidad.id_rol,
        permisos: identidad.permisos,
        tipo_sesion: tipoSesion,
        id_sesion: req.user?.sid ?? null,
        ventana_inactividad_segundos: this.sesion.ventanaInactividad(tipoSesion),
      },
      'Sesión vigente'
    );
  };

  /**
   * Sesiones abiertas del propio usuario, en todos sus dispositivos (RF-SEG-02-05).
   */
  listarSesiones = async (req: Request, res: Response): Promise<Response> => {
    const identidad = obtenerIdentidadVigente(req);
    if (!identidad) {
      throw new AppError('Se requiere una sesión activa', 401, 'UNAUTHORIZED');
    }

    const sesiones = await this.sesion.listarSesionesActivas(identidad.id_usuario);
    return sendSuccess(res, { total: sesiones.length, sesiones }, 'Sesiones activas');
  };

  /**
   * Cierre explícito de la sesión en curso (RF-SEG-02-04, nodo 4.A del diagrama).
   */
  cerrarSesion = async (req: Request, res: Response): Promise<Response> => {
    const idSesion = req.user?.sid;
    if (!idSesion) {
      throw new AppError('Se requiere una sesión activa', 401, 'UNAUTHORIZED');
    }

    const cerrada = await this.sesion.cerrarSesion(idSesion);
    return sendSuccess(res, { cerrada }, 'Sesión cerrada');
  };

  /**
   * Cierra todas las sesiones del usuario en todos sus dispositivos (RF-SEG-02-06).
   */
  cerrarTodasLasSesiones = async (req: Request, res: Response): Promise<Response> => {
    const identidad = obtenerIdentidadVigente(req);
    if (!identidad) {
      throw new AppError('Se requiere una sesión activa', 401, 'UNAUTHORIZED');
    }

    const cerradas = await this.sesion.invalidarSesionesDeUsuario(
      identidad.id_usuario,
      'cierre_manual'
    );

    return sendSuccess(res, { sesionesCerradas: cerradas }, 'Todas las sesiones fueron cerradas');
  };

  consultarPoliticaSesion = (_req: Request, res: Response): Response => {
    return sendSuccess(res, this.sesion.obtenerPolitica(), 'Política de sesión vigente');
  };

  actualizarPoliticaSesion = (req: Request, res: Response): Response => {
    const datos = politicaSesionSchema.parse(req.body);
    return sendSuccess(res, this.sesion.actualizarPolitica(datos), 'Política de sesión actualizada');
  };

  /**
   * Cambia la contraseña del titular de la sesión (HU-SEG-01).
   * Al hacerlo, invalida sus demás sesiones activas (RF-SEG-01-06).
   */
  cambiarContrasena = async (req: Request, res: Response): Promise<Response> => {
    const identidad = obtenerIdentidadVigente(req);
    if (!identidad) {
      throw new AppError('Se requiere una sesión activa', 401, 'UNAUTHORIZED');
    }

    const datos = cambioContrasenaSchema.parse(req.body);
    const resultado = await this.credenciales.cambiarContrasena(
      identidad.id_usuario,
      datos,
      req.user?.sid
    );

    return sendSuccess(res, resultado, 'Contraseña actualizada correctamente');
  };
}
