import { SeguridadRepository } from '../repositories/seguridad.repository';
import {
  IdentidadVigente,
  MotivoDenegacion,
  ResultadoAutorizacion,
} from '../interfaces/seguridad.interfaces';

const AUTORIZADO: ResultadoAutorizacion = { autorizado: true };

function denegar(motivo: MotivoDenegacion): ResultadoAutorizacion {
  return { autorizado: false, motivo };
}

/**
 * Validador central de autorización (HU-SEG-03).
 *
 * Implementa el nodo "VALIDADOR CENTRAL" del diagrama
 * `docs/assets/diagrams/M20/HU-SEG-03_autorizacion_servidor.png`: toda operación,
 * llegue por la interfaz o por una petición directa manipulada, atraviesa esta
 * misma comprobación (RF-SEG-03-04, RNF-SEG-03-01).
 */
export class AutorizacionService {
  constructor(private readonly repositorio: SeguridadRepository) {}

  /**
   * Resuelve la identidad del usuario contra la base de datos y comprueba que la
   * cuenta siga activa. Es el primer tramo del validador: una sesión criptográficamente
   * válida no basta si la cuenta dejó de estarlo (CA-SEG-02-04).
   */
  async resolverIdentidad(
    idUsuario: number
  ): Promise<{ identidad: IdentidadVigente } | { motivo: MotivoDenegacion }> {
    const identidad = await this.repositorio.obtenerIdentidadVigente(idUsuario);

    if (!identidad) {
      return { motivo: 'SESION_INVALIDA' };
    }

    if (identidad.estado !== 'activo') {
      return { motivo: 'CUENTA_NO_ACTIVA' };
    }

    return { identidad };
  }

  /**
   * Comprueba que la identidad posea TODOS los permisos exigidos por la operación
   * (RF-SEG-03-01, RF-SEG-03-03).
   *
   * Se evalúa contra los permisos leídos en vivo, de modo que retirar un permiso
   * surte efecto en la siguiente petición sin re-autenticación (CA-SEG-02-05).
   */
  verificarPermisos(identidad: IdentidadVigente, permisosExigidos: readonly string[]): ResultadoAutorizacion {
    if (permisosExigidos.length === 0) {
      return AUTORIZADO;
    }

    const concedidos = new Set(identidad.permisos);
    const tieneTodos = permisosExigidos.every((permiso) => concedidos.has(permiso));

    return tieneTodos ? AUTORIZADO : denegar('PERMISO_AUSENTE');
  }

  /**
   * Comprueba la titularidad del recurso solicitado (RF-SEG-03-02).
   *
   * Un usuario solo opera sobre datos propios, salvo que porte alguno de los
   * permisos de personal autorizado indicados por la operación.
   */
  verificarTitularidad(
    identidad: IdentidadVigente,
    idTitularRecurso: number,
    permisosDePersonalAutorizado: readonly string[] = []
  ): ResultadoAutorizacion {
    if (identidad.id_usuario === idTitularRecurso) {
      return AUTORIZADO;
    }

    const esPersonalAutorizado = this.verificarPermisos(identidad, permisosDePersonalAutorizado);
    if (permisosDePersonalAutorizado.length > 0 && esPersonalAutorizado.autorizado) {
      return AUTORIZADO;
    }

    return denegar('TITULARIDAD_AJENA');
  }
}
