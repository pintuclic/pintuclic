import { randomUUID } from 'crypto';
import { DireccionCliente } from '../interfaces/cuentas.interfaces';

// ==============================================================================
// M04 - REPOSITORIO DE DIRECCIONES DEL CLIENTE (HU-CUE-07)
// Gestión de múltiples direcciones y designación de predeterminada
// ==============================================================================

export class DireccionRepository {
  private readonly direcciones: Map<string, DireccionCliente> = new Map();

  /**
   * Registra una nueva dirección para el usuario.
   */
  async crear(
    datos: Omit<DireccionCliente, 'id_direccion' | 'fecha_creacion' | 'fecha_actualizacion'>
  ): Promise<DireccionCliente> {
    const ahora = new Date().toISOString();
    const id = randomUUID();

    // Si viene marcada como predeterminada, desmarcar las demás del usuario
    if (datos.es_predeterminada) {
      await this.desmarcarPredeterminadas(datos.id_usuario);
    }

    const nuevaDireccion: DireccionCliente = {
      ...datos,
      id_direccion: id,
      fecha_creacion: ahora,
      fecha_actualizacion: ahora,
    };

    this.direcciones.set(id, nuevaDireccion);
    return nuevaDireccion;
  }

  /**
   * Lista todas las direcciones pertenecientes a un usuario (HU-SEG-03).
   */
  async listarPorUsuario(idUsuario: number): Promise<DireccionCliente[]> {
    return Array.from(this.direcciones.values()).filter(
      (dir) => dir.id_usuario === idUsuario
    );
  }

  /**
   * Busca una dirección por su identificador.
   */
  async buscarPorId(idDireccion: string): Promise<DireccionCliente | null> {
    return this.direcciones.get(idDireccion) ?? null;
  }

  /**
   * Actualiza los datos de una dirección asegurando pertenencia.
   */
  async actualizar(
    idDireccion: string,
    idUsuario: number,
    cambios: Partial<DireccionCliente>
  ): Promise<DireccionCliente | null> {
    const dir = this.direcciones.get(idDireccion);
    if (!dir || dir.id_usuario !== idUsuario) {
      return null;
    }

    if (cambios.es_predeterminada) {
      await this.desmarcarPredeterminadas(idUsuario);
    }

    const actualizada: DireccionCliente = {
      ...dir,
      ...cambios,
      id_direccion: idDireccion,
      id_usuario: idUsuario,
      fecha_actualizacion: new Date().toISOString(),
    };

    this.direcciones.set(idDireccion, actualizada);
    return actualizada;
  }

  /**
   * Elimina una dirección comprobando que pertenezca al usuario.
   */
  async eliminar(idDireccion: string, idUsuario: number): Promise<boolean> {
    const dir = this.direcciones.get(idDireccion);
    if (!dir || dir.id_usuario !== idUsuario) {
      return false;
    }
    return this.direcciones.delete(idDireccion);
  }

  /**
   * Desmarca la condición de predeterminada en todas las direcciones del usuario (CA-CUE-07-02).
   */
  async desmarcarPredeterminadas(idUsuario: number): Promise<void> {
    for (const [id, dir] of this.direcciones.entries()) {
      if (dir.id_usuario === idUsuario && dir.es_predeterminada) {
        this.direcciones.set(id, {
          ...dir,
          es_predeterminada: false,
          fecha_actualizacion: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Marca una dirección específica como predeterminada y desmarca las restantes.
   */
  async marcarPredeterminada(idDireccion: string, idUsuario: number): Promise<boolean> {
    const dir = this.direcciones.get(idDireccion);
    if (!dir || dir.id_usuario !== idUsuario) {
      return false;
    }

    await this.desmarcarPredeterminadas(idUsuario);
    this.direcciones.set(idDireccion, {
      ...dir,
      es_predeterminada: true,
      fecha_actualizacion: new Date().toISOString(),
    });
    return true;
  }
}
