import { AppError } from '../../../core/middlewares/errorHandler';
import { AvisoPrivacidad, SolicitudSupresion } from '../../../core/db/types';
import { PrivacidadRepository } from '../repositories/privacidad.repository';
import { RegistroSeguridadService } from './registro-seguridad.service';
import {
  AvisoPrivacidadPublico,
  EstadoConsentimiento,
  ResultadoSolicitudSupresion,
  SolicitudSupresionPublica,
} from '../interfaces/privacidad.interfaces';
import { RegistroConsentimientoDTO, ResolucionSupresionDTO } from '../dtos';

function aPublico(aviso: AvisoPrivacidad): AvisoPrivacidadPublico {
  return {
    id_aviso_privacidad: aviso.id_aviso_privacidad,
    version: aviso.version,
    descripcion: aviso.descripcion,
    es_vigente: aviso.es_vigente,
  };
}

function aSolicitudPublica(solicitud: SolicitudSupresion): SolicitudSupresionPublica {
  return {
    id_solicitud_supresion: solicitud.id_solicitud_supresion,
    estado: solicitud.estado,
    fecha_solicitud: solicitud.fecha_solicitud.toISOString(),
    fecha_resolucion: solicitud.fecha_resolucion ? solicitud.fecha_resolucion.toISOString() : null,
  };
}

/**
 * Protección de datos personales (HU-SEG-05).
 *
 * Implementa el diagrama `docs/assets/diagrams/M20/M20-HU-SEG-05-Proteccion de datos
 * personales.drawio.png` en las ramas que corresponden a M20: la puerta de consentimiento
 * del registro y el circuito de supresión desde el perfil.
 *
 * La consulta y rectificación de datos personales (RF-SEG-05-05) pertenece a **M04**, que
 * es dueño del perfil. M20 aporta la política, no el formulario.
 */
export class PrivacidadService {
  constructor(
    private readonly repositorio: PrivacidadRepository,
    private readonly registro: RegistroSeguridadService
  ) {}

  /**
   * Aviso de privacidad vigente. Debe permanecer accesible en todo momento y sin
   * sesión previa (RF-SEG-05-03, RF-SEG-05-04).
   */
  async obtenerAvisoVigente(): Promise<AvisoPrivacidadPublico> {
    const aviso = await this.repositorio.obtenerAvisoVigente();

    if (!aviso) {
      // Sin aviso vigente no puede recogerse consentimiento válido, y por tanto
      // tampoco debería poder completarse ningún registro.
      this.registro.registrarErrorTecnico(
        'GET aviso de privacidad',
        'No hay ninguna fila con es_vigente = true en aviso_privacidad'
      );
      throw new AppError('No hay un aviso de privacidad vigente', 503, 'SERVICE_UNAVAILABLE');
    }

    return aPublico(aviso);
  }

  /**
   * Estado del consentimiento del usuario frente al aviso vigente.
   *
   * `debeAceptar` implementa CA-SEG-05-06: cuando el aviso cambia de versión, el usuario
   * no ha aceptado la nueva y el frontend debe informarle del cambio.
   */
  async consultarEstado(idUsuario: number): Promise<EstadoConsentimiento> {
    const aviso = await this.repositorio.obtenerAvisoVigente();
    const historial = await this.repositorio.listarConsentimientos(idUsuario);

    if (!aviso) {
      return {
        avisoVigente: null,
        aceptado: false,
        debeAceptar: false,
        fechaAceptacion: null,
        versionAceptada: null,
        historial,
      };
    }

    const fecha = await this.repositorio.obtenerFechaAceptacion(idUsuario, aviso.id_aviso_privacidad);
    const aceptado = fecha !== undefined;

    return {
      avisoVigente: aPublico(aviso),
      aceptado,
      debeAceptar: !aceptado,
      fechaAceptacion: fecha ? fecha.toISOString() : null,
      versionAceptada: aceptado ? aviso.version : null,
      historial,
    };
  }

  /**
   * Registra el consentimiento expreso sobre una versión concreta del aviso
   * (RF-SEG-05-01, RF-SEG-05-02).
   *
   * Se rechaza aceptar una versión que ya no está vigente: el titular debe consentir el
   * texto que realmente rige, no uno anterior que quedó por el camino.
   */
  async registrarConsentimiento(
    idUsuario: number,
    datos: RegistroConsentimientoDTO
  ): Promise<EstadoConsentimiento> {
    const aviso = await this.repositorio.obtenerAvisoPorVersion(datos.version);

    if (!aviso) {
      throw new AppError(
        'La versión del aviso de privacidad indicada no existe',
        400,
        'VALIDATION_ERROR'
      );
    }

    if (!aviso.es_vigente) {
      throw new AppError(
        'La versión indicada ya no es la vigente; vuelva a leer el aviso actual',
        409,
        'CONFLICT'
      );
    }

    await this.repositorio.registrarConsentimiento(idUsuario, aviso.id_aviso_privacidad);
    return this.consultarEstado(idUsuario);
  }

  /**
   * Puerta de consentimiento del registro (CA-SEG-05-01, nodo "¿Consentimiento aceptado?").
   *
   * **Este es el método que M04 debe invocar al completar un registro.** Si el titular no
   * consintió, el registro no puede completarse.
   *
   * @throws AppError 400 si no hay consentimiento sobre el aviso vigente.
   */
  async exigirConsentimientoVigente(idUsuario: number): Promise<void> {
    const estado = await this.consultarEstado(idUsuario);

    if (!estado.aceptado) {
      throw new AppError(
        'Debe aceptar el tratamiento de datos personales para continuar',
        400,
        'VALIDATION_ERROR'
      );
    }
  }

  /**
   * Registra una solicitud de supresión de datos y confirma su recepción
   * (RF-SEG-05-06, CA-SEG-05-04).
   *
   * Resuelve además la bifurcación "¿Tiene órdenes de ventas asociadas?" del diagrama:
   * cuando las hay, la información comercial se conserva por obligación legal y solo puede
   * desvincularse de la identidad del titular (RF-SEG-05-07, CA-SEG-05-05). El servicio
   * informa de ello al usuario en la misma respuesta, en vez de prometerle un borrado
   * total que la ley no permite.
   *
   * La ejecución material del borrado o la anonimización es una operación administrativa
   * posterior; aquí solo se registra y se acusa recibo, que es lo que exige la historia.
   */
  async solicitarSupresion(idUsuario: number): Promise<ResultadoSolicitudSupresion> {
    const ordenesAsociadas = await this.repositorio.contarOrdenesDeUsuario(idUsuario);
    const abierta = await this.repositorio.obtenerSolicitudAbierta(idUsuario);

    // Repetir la petición no crea una solicitud nueva: se acusa recibo de la que ya está
    // en trámite, para no inflar la cola administrativa con duplicados.
    const solicitud = abierta ?? (await this.repositorio.crearSolicitudSupresion(idUsuario));

    return {
      solicitud: aSolicitudPublica(solicitud),
      yaExistia: abierta !== undefined,
      conservaInformacionComercial: ordenesAsociadas > 0,
      ordenesAsociadas,
    };
  }

  async listarSolicitudesDeUsuario(idUsuario: number): Promise<SolicitudSupresionPublica[]> {
    const solicitudes = await this.repositorio.listarSolicitudesDeUsuario(idUsuario);
    return solicitudes.map(aSolicitudPublica);
  }

  /**
   * Cola de solicitudes en trámite, para la administración.
   */
  async listarSolicitudesPendientes(): Promise<SolicitudSupresionPublica[]> {
    const solicitudes = await this.repositorio.listarSolicitudesPendientes();
    return solicitudes.map(aSolicitudPublica);
  }

  /**
   * Resolución administrativa de una solicitud de supresión.
   */
  async resolverSolicitud(
    idSolicitud: number,
    datos: ResolucionSupresionDTO
  ): Promise<SolicitudSupresionPublica> {
    const resuelta = await this.repositorio.resolverSolicitud(idSolicitud, datos.estado);

    if (!resuelta) {
      // Respuesta uniforme: no se revela si la solicitud existe (RF-SEG-03-05).
      throw new AppError('Recurso no encontrado', 404, 'NOT_FOUND');
    }

    return aSolicitudPublica(resuelta);
  }
}
