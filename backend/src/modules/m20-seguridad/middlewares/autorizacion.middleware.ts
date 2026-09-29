import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken } from '../../../core/utils/jwt';
import { sendError } from '../../../core/utils/apiResponse';
import { AutorizacionService } from '../services/autorizacion.service';
import { SesionService } from '../services/sesion.service';
import { RegistroSeguridadService } from '../services/registro-seguridad.service';
import { IdentidadVigente, MotivoDenegacion } from '../interfaces/seguridad.interfaces';

/**
 * Mensaje único de recurso inalcanzable.
 *
 * Se emite tanto cuando el recurso no existe como cuando existe pero pertenece a
 * otro titular, de modo que ambas respuestas sean indistinguibles entre sí
 * (RF-SEG-03-05, CA-SEG-03-06).
 */
const MENSAJE_RECURSO_INALCANZABLE = 'Recurso no encontrado';

/** Mensaje único de operación no permitida, sin detallar qué permiso falta. */
const MENSAJE_OPERACION_NO_PERMITIDA = 'No tiene autorización para realizar esta operación';

/**
 * Identidad vigente resuelta por `sesionVigente`, adjuntada a la petición para que
 * los guardas posteriores no vuelvan a consultar la base de datos.
 */
const IDENTIDAD = Symbol('m20.identidadVigente');

interface PeticionConIdentidad extends Request {
  [IDENTIDAD]?: IdentidadVigente;
}

export function obtenerIdentidadVigente(req: Request): IdentidadVigente | undefined {
  return (req as PeticionConIdentidad)[IDENTIDAD];
}

/**
 * Guardas centrales de M20 (HU-SEG-03).
 *
 * Un único punto de verificación para todos los módulos, conforme a RNF-SEG-03-01:
 * la comprobación no se delega a cada operación. Toda petición, venga de la interfaz
 * o construida a mano contra la API, atraviesa el mismo camino del diagrama
 * `HU-SEG-03_autorizacion_servidor.png`.
 */
export class GuardasSeguridad {
  constructor(
    private readonly autorizacion: AutorizacionService,
    private readonly sesion: SesionService,
    private readonly registro: RegistroSeguridadService
  ) {}

  /**
   * Traduce un motivo interno de denegación a una respuesta HTTP uniforme.
   * El motivo queda en el registro técnico, nunca en el cuerpo de la respuesta.
   */
  private denegar(req: Request, res: Response, motivo: MotivoDenegacion, idUsuario: number | null): void {
    const operacion = `${req.method} ${req.originalUrl}`;
    this.registro.registrarAccesoDenegado(idUsuario, operacion, motivo);

    switch (motivo) {
      case 'SESION_AUSENTE':
        sendError(res, 'Se requiere una sesión activa', 'UNAUTHORIZED', 401);
        return;
      case 'SESION_INVALIDA':
        sendError(res, 'La sesión expiró o no es válida', 'SESSION_EXPIRED', 401);
        return;
      case 'TITULARIDAD_AJENA':
        // Deliberadamente 404: un recurso ajeno debe responder igual que uno inexistente.
        sendError(res, MENSAJE_RECURSO_INALCANZABLE, 'NOT_FOUND', 404);
        return;
      case 'CUENTA_NO_ACTIVA':
      case 'PERMISO_AUSENTE':
        sendError(res, MENSAJE_OPERACION_NO_PERMITIDA, 'FORBIDDEN', 403);
        return;
    }
  }

  /**
   * Verifica la sesión y resuelve la identidad EN VIVO contra la base de datos.
   *
   * Es el primer eslabón obligatorio de cualquier ruta protegida. Al releer estado y
   * permisos en cada petición, una cuenta desactivada o un permiso retirado dejan de
   * surtir efecto de inmediato, sin esperar a que el token caduque
   * (CA-SEG-02-04, CA-SEG-02-05, CA-SEG-03-04).
   */
  sesionVigente(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const cabecera = req.headers['authorization'];
      const token =
        cabecera && cabecera.startsWith('Bearer ') ? cabecera.slice('Bearer '.length) : null;

      if (!token) {
        this.denegar(req, res, 'SESION_AUSENTE', null);
        return;
      }

      let idUsuario: number;
      let correo: string;
      let idSesion: string | undefined;
      try {
        const claims = verifyAccessToken(token);
        idUsuario = claims.id;
        correo = claims.correo;
        idSesion = claims.sid;
      } catch (_error) {
        // Token caducado, firmado con otra clave o manipulado: mismo desenlace.
        this.denegar(req, res, 'SESION_INVALIDA', null);
        return;
      }

      // Un token sin `sid` no ampara ninguna sesión persistida y por tanto no podría
      // revocarse nunca. Se rechaza (HU-SEG-02).
      if (!idSesion) {
        this.denegar(req, res, 'SESION_INVALIDA', idUsuario);
        return;
      }

      const resultado = await this.autorizacion.resolverIdentidad(idUsuario);
      if ('motivo' in resultado) {
        // Una cuenta que deja de estar activa arrastra consigo todas sus sesiones
        // (RF-SEG-02-06, nodo 6.A del diagrama).
        if (resultado.motivo === 'CUENTA_NO_ACTIVA') {
          await this.sesion.invalidarSesionesDeUsuario(idUsuario, 'cuenta_desactivada');
        }
        this.denegar(req, res, resultado.motivo, idUsuario);
        return;
      }

      const { identidad } = resultado;
      const tipoSesion = this.sesion.clasificarSesion(identidad.id_rol);

      // La sesión debe seguir viva en la tabla `sesion`. Si lo está, esta misma llamada
      // renueva su vigencia (RF-SEG-02-03, nodo 5 del diagrama).
      const validacion = await this.sesion.validarYRenovar(idSesion, tipoSesion);
      if (!validacion.valida) {
        this.registro.registrarSesionInvalida(idUsuario, `${req.method} ${req.originalUrl}`, validacion.motivo);
        this.denegar(req, res, 'SESION_INVALIDA', idUsuario);
        return;
      }

      (req as PeticionConIdentidad)[IDENTIDAD] = identidad;

      // `req.user` se rellena desde la identidad vigente, no desde los claims del
      // token, para que ningún módulo consumidor confíe en permisos caducados.
      req.user = {
        id: identidad.id_usuario,
        correo,
        id_rol: identidad.id_rol,
        permisos: [...identidad.permisos],
        tipo_sesion: tipoSesion,
        sid: idSesion,
      };

      next();
    };
  }

  /**
   * Exige que el usuario porte todos los permisos indicados (RF-SEG-03-03).
   *
   * Uso: `router.post('/productos', ...guardas.protegido('productos.crear'), controlador)`
   */
  requierePermiso(...permisosExigidos: readonly string[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const identidad = obtenerIdentidadVigente(req);

      if (!identidad) {
        this.denegar(req, res, 'SESION_AUSENTE', null);
        return;
      }

      const resultado = this.autorizacion.verificarPermisos(identidad, permisosExigidos);
      if (!resultado.autorizado) {
        this.denegar(req, res, resultado.motivo, identidad.id_usuario);
        return;
      }

      next();
    };
  }

  /**
   * Exige titularidad sobre el recurso solicitado (RF-SEG-03-02, CA-SEG-03-01).
   *
   * @param extraerIdTitular Función que obtiene el identificador del titular a partir
   *                         de la petición (parámetro de ruta, consulta o cuerpo).
   * @param permisosDePersonalAutorizado Permisos que habilitan a personal interno a
   *                                     operar sobre datos de terceros.
   */
  requiereTitularidad(
    extraerIdTitular: (req: Request) => number | null,
    ...permisosDePersonalAutorizado: readonly string[]
  ): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
      const identidad = obtenerIdentidadVigente(req);

      if (!identidad) {
        this.denegar(req, res, 'SESION_AUSENTE', null);
        return;
      }

      const idTitular = extraerIdTitular(req);
      if (idTitular === null) {
        // Un identificador ilegible se trata como recurso inalcanzable, nunca como
        // error de validación que revele la forma del recurso (RF-SEG-03-05).
        this.denegar(req, res, 'TITULARIDAD_AJENA', identidad.id_usuario);
        return;
      }

      const resultado = this.autorizacion.verificarTitularidad(
        identidad,
        idTitular,
        permisosDePersonalAutorizado
      );

      if (!resultado.autorizado) {
        this.denegar(req, res, resultado.motivo, identidad.id_usuario);
        return;
      }

      next();
    };
  }

  /**
   * Atajo de composición: sesión vigente + permisos exigidos, en el orden correcto.
   */
  protegido(...permisosExigidos: readonly string[]): RequestHandler[] {
    return [this.sesionVigente(), this.requierePermiso(...permisosExigidos)];
  }
}
