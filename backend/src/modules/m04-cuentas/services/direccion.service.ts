import { AppError } from '../../../core/middlewares/errorHandler';
import { DireccionRepository } from '../repositories/direccion.repository';
import { CrearDireccionDTO, ActualizarDireccionDTO } from '../dtos';
import { DireccionCliente } from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - SERVICIO DE DIRECCIONES DEL CLIENTE (HU-CUE-07)
// Validación estricta de pertenencia en servidor (HU-SEG-03)
// ==============================================================================

export class DireccionService {
  constructor(private readonly direccionRepo: DireccionRepository) {}

  /**
   * HU-CUE-07: Registra una nueva dirección (CA-CUE-07-01).
   * Admite geolocalización o diligenciamiento manual (RF-CUE-07-06 / CA-CUE-07-04).
   */
  async crearDireccion(
    idUsuario: number,
    datos: CrearDireccionDTO
  ): Promise<DireccionCliente> {
    const existentes = await this.direccionRepo.listarPorUsuario(idUsuario);

    // Si es la primera dirección registrada, se marca automáticamente como predeterminada
    const esPrimera = existentes.length === 0;
    const debeSerPredeterminada = datos.es_predeterminada || esPrimera;

    return this.direccionRepo.crear({
      id_usuario: idUsuario,
      direccion: datos.direccion.trim(),
      barrio: datos.barrio.trim(),
      apartamento_casa: datos.apartamento_casa?.trim() ?? null,
      nombre_apellido: datos.nombre_apellido.trim(),
      telefono: datos.telefono.trim(),
      es_predeterminada: debeSerPredeterminada,
      latitud: datos.latitud ?? null,
      longitud: datos.longitud ?? null,
    });
  }

  /**
   * HU-CUE-07: Lista todas las direcciones asociadas al usuario autenticado.
   */
  async listarDirecciones(idUsuario: number): Promise<DireccionCliente[]> {
    return this.direccionRepo.listarPorUsuario(idUsuario);
  }

  /**
   * HU-CUE-07: Obtiene una dirección específica validando pertenencia (HU-SEG-03).
   */
  async obtenerDireccion(idUsuario: number, idDireccion: string): Promise<DireccionCliente> {
    const direccion = await this.direccionRepo.buscarPorId(idDireccion);
    if (!direccion || direccion.id_usuario !== idUsuario) {
      throw new AppError('Dirección no encontrada o no autorizada', 404, 'NOT_FOUND');
    }
    return direccion;
  }

  /**
   * HU-CUE-07: Actualiza una dirección existente (RF-CUE-07-02).
   */
  async actualizarDireccion(
    idUsuario: number,
    idDireccion: string,
    datos: ActualizarDireccionDTO
  ): Promise<DireccionCliente> {
    const direccion = await this.direccionRepo.buscarPorId(idDireccion);
    if (!direccion || direccion.id_usuario !== idUsuario) {
      throw new AppError('Dirección no encontrada o no autorizada', 404, 'NOT_FOUND');
    }

    const cambios: Partial<DireccionCliente> = {};
    if (datos.direccion !== undefined) cambios.direccion = datos.direccion.trim();
    if (datos.barrio !== undefined) cambios.barrio = datos.barrio.trim();
    if (datos.apartamento_casa !== undefined)
      cambios.apartamento_casa = datos.apartamento_casa ? datos.apartamento_casa.trim() : null;
    if (datos.nombre_apellido !== undefined) cambios.nombre_apellido = datos.nombre_apellido.trim();
    if (datos.telefono !== undefined) cambios.telefono = datos.telefono.trim();
    if (datos.es_predeterminada !== undefined) cambios.es_predeterminada = datos.es_predeterminada;
    if (datos.latitud !== undefined) cambios.latitud = datos.latitud;
    if (datos.longitud !== undefined) cambios.longitud = datos.longitud;

    const actualizada = await this.direccionRepo.actualizar(idDireccion, idUsuario, cambios);
    if (!actualizada) {
      throw new AppError('No fue posible actualizar la dirección', 500, 'UPDATE_FAILED');
    }

    return actualizada;
  }

  /**
   * HU-CUE-07: Elimina una dirección comprobando pertenencia (CA-CUE-07-03).
   */
  async eliminarDireccion(idUsuario: number, idDireccion: string): Promise<{ mensaje: string }> {
    const direccion = await this.direccionRepo.buscarPorId(idDireccion);
    if (!direccion || direccion.id_usuario !== idUsuario) {
      throw new AppError('Dirección no encontrada o no autorizada', 404, 'NOT_FOUND');
    }

    const eliminada = await this.direccionRepo.eliminar(idDireccion, idUsuario);
    if (!eliminada) {
      throw new AppError('No fue posible eliminar la dirección', 500, 'DELETE_FAILED');
    }

    // Si se eliminó la predeterminada y quedan otras, marcar la primera restante
    if (direccion.es_predeterminada) {
      const restantes = await this.direccionRepo.listarPorUsuario(idUsuario);
      const primeraRestante = restantes[0];
      if (primeraRestante) {
        await this.direccionRepo.marcarPredeterminada(primeraRestante.id_direccion, idUsuario);
      }
    }

    return { mensaje: 'Dirección eliminada correctamente.' };
  }

  /**
   * HU-CUE-07: Marca una dirección como predeterminada (CA-CUE-07-02).
   */
  async marcarPredeterminada(
    idUsuario: number,
    idDireccion: string
  ): Promise<{ mensaje: string }> {
    const direccion = await this.direccionRepo.buscarPorId(idDireccion);
    if (!direccion || direccion.id_usuario !== idUsuario) {
      throw new AppError('Dirección no encontrada o no autorizada', 404, 'NOT_FOUND');
    }

    await this.direccionRepo.marcarPredeterminada(idDireccion, idUsuario);
    return { mensaje: 'Dirección marcada como predeterminada.' };
  }
}
