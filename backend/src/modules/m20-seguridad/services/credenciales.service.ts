import { hashPassword, comparePassword } from '../../../core/utils/crypto';
import { AppError } from '../../../core/middlewares/errorHandler';
import { SeguridadRepository } from '../repositories/seguridad.repository';
import { SesionService } from './sesion.service';
import { ResultadoCambioContrasena } from '../interfaces/seguridad.interfaces';
import { CambioContrasenaDTO, contrasenaSchema } from '../dtos';

/**
 * Política de credenciales (HU-SEG-01).
 *
 * Implementa el recorrido del diagrama
 * `docs/assets/diagrams/M20/HU-SEG-01_almacenamiento_seguro_credenciales.png`:
 * establecer contraseña → derivar con sal única por usuario → almacenar solo el hash →
 * verificar derivando y comparando, nunca descifrando → invalidar las demás sesiones
 * activas cuando la contraseña cambia.
 */
export class CredencialesService {
  constructor(
    private readonly repositorio: SeguridadRepository,
    private readonly sesiones: SesionService
  ) {}

  /**
   * Valida la política y deriva el hash BCrypt (costo 12) de una contraseña nueva.
   * BCrypt genera una sal única por invocación, por lo que dos usuarios con la misma
   * contraseña obtienen hashes distintos (CA-SEG-01-02).
   */
  async derivarContrasena(contrasenaPlana: string): Promise<string> {
    // Zod lanza aquí si la política no se cumple; el mensaje describe la regla
    // incumplida y jamás incluye el valor introducido (RF-SEG-01-03).
    contrasenaSchema.parse(contrasenaPlana);
    return hashPassword(contrasenaPlana);
  }

  /**
   * Verifica una contraseña comparando el resultado de la derivación (RF-SEG-01-02).
   * `bcrypt.compare` realiza la comparación en tiempo constante (RNF-SEG-01-01).
   */
  async verificarContrasena(contrasenaPlana: string, hashAlmacenado: string): Promise<boolean> {
    return comparePassword(contrasenaPlana, hashAlmacenado);
  }

  /**
   * Comprueba las credenciales de un correo y devuelve el usuario si coinciden.
   *
   * Responde igual ante un correo inexistente y ante una contraseña equivocada, y en el
   * primer caso deriva un hash de descarte para que ambos caminos tarden lo mismo: si no,
   * el tiempo de respuesta revelaría qué correos están registrados (RF-SEG-06-06).
   */
  async verificarCredenciales(
    correo: string,
    contrasenaPlana: string
  ): Promise<{ id_usuario: number; correo: string } | null> {
    const usuario = await this.repositorio.obtenerCredencialPorCorreo(correo);

    if (!usuario) {
      await comparePassword(contrasenaPlana, '$2b$12$' + 'x'.repeat(53));
      return null;
    }

    const coincide = await this.verificarContrasena(contrasenaPlana, usuario.contrasena);
    if (!coincide) {
      return null;
    }

    return { id_usuario: usuario.id_usuario, correo: usuario.correo };
  }

  /**
   * Cambia la contraseña previa verificación de la vigente y, acto seguido, invalida
   * todas las demás sesiones activas del usuario (RF-SEG-01-06, RF-SEG-02-06).
   *
   * La sesión desde la que se hace el cambio sobrevive: expulsar a alguien del
   * dispositivo que tiene en la mano sería un castigo, no una medida de seguridad.
   *
   * @param sesionActual Sesión que debe conservarse, si la petición viene de una.
   */
  async cambiarContrasena(
    idUsuario: number,
    datos: CambioContrasenaDTO,
    sesionActual?: string
  ): Promise<ResultadoCambioContrasena> {
    const hashActual = await this.repositorio.obtenerHashContrasena(idUsuario);

    if (hashActual === null) {
      // Respuesta uniforme: no se revela si la cuenta existe (RF-SEG-03-05).
      throw new AppError('No fue posible completar la operación', 403, 'FORBIDDEN');
    }

    const coincide = await this.verificarContrasena(datos.contrasenaActual, hashActual);
    if (!coincide) {
      throw new AppError('No fue posible completar la operación', 403, 'FORBIDDEN');
    }

    const hashNuevo = await this.derivarContrasena(datos.contrasenaNueva);
    await this.repositorio.actualizarHashContrasena(idUsuario, hashNuevo);

    const sesionesCerradas = await this.sesiones.invalidarSesionesDeUsuario(
      idUsuario,
      'cambio_contrasena',
      sesionActual
    );

    return { actualizada: true, sesionesCerradas };
  }
}
