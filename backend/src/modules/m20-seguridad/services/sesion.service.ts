import { generateAccessToken, generateRefreshToken, TokenPayload } from '../../../core/utils/jwt';
import { EnumMotivoCierreSesion } from '../../../core/db/types';
import { SesionRepository } from '../repositories/sesion.repository';
import {
  PoliticaSesion,
  ResultadoValidacionSesion,
  SesionEmitida,
  TipoSesion,
} from '../interfaces/seguridad.interfaces';
import { PoliticaSesionDTO } from '../dtos';

/** 30 minutos de inactividad para el panel administrativo (RF-SEG-02-02). */
const INACTIVIDAD_ADMIN_POR_DEFECTO = 30 * 60;

/** 30 días de inactividad para las sesiones de cliente (RF-SEG-02-02). */
const INACTIVIDAD_CLIENTE_POR_DEFECTO = 30 * 24 * 60 * 60;

function leerSegundosDeEntorno(clave: string, porDefecto: number): number {
  const valor = Number(process.env[clave]);
  return Number.isInteger(valor) && valor > 0 ? valor : porDefecto;
}

/**
 * Gestión de sesiones (HU-SEG-02).
 *
 * Implementa el diagrama `docs/assets/diagrams/M20/HU-SEG-02_gestion_sesion.png` completo:
 * la sesión se persiste al abrirse (nodo 2), renueva su vigencia ante cada operación
 * (nodo 5), puede cerrarse manualmente (nodo 4.A), caduca por inactividad (nodo 4.B) y
 * puede invalidarse en bloque para un usuario (nodo 6.A).
 *
 * El token sigue siendo un JWT, pero ya no basta por sí solo: porta el claim `sid` y en
 * cada petición se comprueba que esa sesión siga viva en la base. Es lo que permite
 * retirar una sesión ya emitida, que con JWT puro sería imposible.
 */
export class SesionService {
  constructor(private readonly repositorio: SesionRepository) {}

  /**
   * Límites de vigencia configurados (RF-SEG-02-07, nodo 8 del diagrama).
   */
  private politica: PoliticaSesion = {
    inactividadAdminSegundos: leerSegundosDeEntorno(
      'SESION_INACTIVIDAD_ADMIN_SEGUNDOS',
      INACTIVIDAD_ADMIN_POR_DEFECTO
    ),
    inactividadClienteSegundos: leerSegundosDeEntorno(
      'SESION_INACTIVIDAD_CLIENTE_SEGUNDOS',
      INACTIVIDAD_CLIENTE_POR_DEFECTO
    ),
  };

  obtenerPolitica(): PoliticaSesion {
    return this.politica;
  }

  actualizarPolitica(datos: PoliticaSesionDTO): PoliticaSesion {
    this.politica = {
      inactividadAdminSegundos: datos.inactividadAdminSegundos,
      inactividadClienteSegundos: datos.inactividadClienteSegundos,
    };
    return this.politica;
  }

  ventanaInactividad(tipo: TipoSesion): number {
    return tipo === 'admin'
      ? this.politica.inactividadAdminSegundos
      : this.politica.inactividadClienteSegundos;
  }

  /**
   * Determina el tipo de sesión a partir del rol resuelto en vivo.
   * Un usuario sin rol se trata como cliente: la ventana restrictiva se reserva para
   * quien opera el panel administrativo.
   */
  clasificarSesion(idRol: number | null): TipoSesion {
    if (idRol === null) {
      return 'cliente';
    }

    const rolesAdministrativos = (process.env.ROLES_ADMINISTRATIVOS ?? '')
      .split(',')
      .map((valor) => Number(valor.trim()))
      .filter((valor) => Number.isInteger(valor));

    return rolesAdministrativos.includes(idRol) ? 'admin' : 'cliente';
  }

  private calcularExpiracion(tipo: TipoSesion, desde: Date): Date {
    return new Date(desde.getTime() + this.ventanaInactividad(tipo) * 1000);
  }

  /**
   * Abre una sesión: crea la fila en `sesion` y firma los tokens con su `sid`
   * (nodo 2 del diagrama).
   *
   * Este es el método que M04 debe consumir al completar un login, en lugar de generar
   * los JWT por su cuenta.
   */
  async abrirSesion(payload: TokenPayload, tipo: TipoSesion): Promise<SesionEmitida> {
    const ahora = new Date();
    const expiracion = this.calcularExpiracion(tipo, ahora);
    const idSesion = await this.repositorio.abrir(payload.id, tipo, expiracion);

    const conSesion: TokenPayload = { ...payload, sid: idSesion };
    const expiraEnSegundos = this.ventanaInactividad(tipo);

    return {
      idSesion,
      accessToken: generateAccessToken(conSesion, { expiresIn: expiraEnSegundos }),
      refreshToken: generateRefreshToken(conSesion, { expiresIn: expiraEnSegundos }),
      expiraEnSegundos,
      tipoSesion: tipo,
      expiraEn: expiracion.toISOString(),
    };
  }

  /**
   * Comprueba que la sesión siga viva y, si lo está, renueva su vigencia
   * (nodos 4.B y 5 del diagrama).
   *
   * Se invoca en CADA petición protegida. Devuelve el motivo exacto cuando la sesión ya
   * no sirve, para que el guarda pueda distinguir "caducó" de "te la revocaron".
   */
  async validarYRenovar(idSesion: string, tipo: TipoSesion): Promise<ResultadoValidacionSesion> {
    const sesion = await this.repositorio.obtener(idSesion);

    if (!sesion) {
      return { valida: false, motivo: 'SESION_DESCONOCIDA' };
    }

    if (sesion.estado !== 'activa') {
      // Distinguir la revocación de la caducidad importa: en el primer caso alguien
      // decidió expulsar al usuario, y el frontend puede querer avisarlo distinto.
      return {
        valida: false,
        motivo: sesion.estado === 'revocada' ? 'SESION_REVOCADA' : 'SESION_CERRADA',
      };
    }

    const ahora = new Date();
    if (sesion.fecha_expiracion.getTime() <= ahora.getTime()) {
      await this.repositorio.cerrar(idSesion, 'inactividad');
      return { valida: false, motivo: 'SESION_CADUCADA' };
    }

    await this.repositorio.renovar(idSesion, ahora, this.calcularExpiracion(tipo, ahora));
    return { valida: true, sesion };
  }

  /**
   * Cierre explícito por parte del usuario (RF-SEG-02-04, nodo 4.A del diagrama).
   */
  async cerrarSesion(idSesion: string): Promise<boolean> {
    return this.repositorio.cerrar(idSesion, 'cierre_manual');
  }

  /**
   * Invalida todas las sesiones activas de un usuario (nodo 6.A del diagrama).
   *
   * Cubre RF-SEG-01-06 y RF-SEG-02-06. M17 debe llamarlo con `'permisos_retirados'`
   * al revocar permisos, y con `'cuenta_desactivada'` al dar de baja una cuenta.
   */
  async invalidarSesionesDeUsuario(
    idUsuario: number,
    motivo: EnumMotivoCierreSesion,
    exceptuar?: string
  ): Promise<number> {
    return this.repositorio.cerrarTodasDelUsuario(idUsuario, motivo, exceptuar);
  }

  /**
   * Sesiones vigentes del propio usuario, con metadatos no sensibles.
   */
  async listarSesionesActivas(idUsuario: number): Promise<
    Array<{
      id_sesion: string;
      tipo_sesion: TipoSesion;
      fecha_inicio: string;
      fecha_ultimo_acceso: string;
      fecha_expiracion: string;
    }>
  > {
    const sesiones = await this.repositorio.listarActivas(idUsuario);

    return sesiones.map((sesion) => ({
      id_sesion: sesion.id_sesion,
      tipo_sesion: sesion.tipo_sesion,
      fecha_inicio: sesion.fecha_inicio.toISOString(),
      fecha_ultimo_acceso: sesion.fecha_ultimo_acceso.toISOString(),
      fecha_expiracion: sesion.fecha_expiracion.toISOString(),
    }));
  }
}
