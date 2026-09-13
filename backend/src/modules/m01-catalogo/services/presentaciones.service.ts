import { PresentacionesRepository } from '../repositories/presentaciones.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Presentacion } from '../../../core/db/types';
import { CrearPresentacionDto, ActualizarPresentacionDto } from '../dtos/presentaciones.dto';
import { PresentacionDetalle, ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE PRESENTACIONES (HU-CAT-03, RF-CAT-03-05)
// La presentación es una entidad propia con volumen numérico para comparar
// precios. No se elimina físicamente: solo se desactiva (CA-CAT-03-10).
// ==============================================================================

export class PresentacionesService {
  constructor(private readonly repo: PresentacionesRepository) {}

  async crear(dto: CrearPresentacionDto): Promise<PresentacionDetalle> {
    const existente = await this.repo.obtenerPorNombre(dto.nombre);
    if (existente) {
      throw new AppError('Ya existe una presentación con ese nombre', 409, 'PRESENTACION_DUPLICADA');
    }
    return this.aDetalle(await this.repo.crear({ nombre: dto.nombre, volumen: dto.volumen }));
  }

  async listar(): Promise<PresentacionDetalle[]> {
    const items = await this.repo.listar();
    return items.map((p) => this.aDetalle(p));
  }

  async obtenerPorId(id: number): Promise<PresentacionDetalle> {
    return this.aDetalle(await this.obtenerEntidad(id));
  }

  async actualizar(id: number, dto: ActualizarPresentacionDto): Promise<PresentacionDetalle> {
    await this.obtenerEntidad(id);
    if (dto.nombre !== undefined) {
      const duplicada = await this.repo.obtenerPorNombre(dto.nombre, id);
      if (duplicada) {
        throw new AppError('Ya existe una presentación con ese nombre', 409, 'PRESENTACION_DUPLICADA');
      }
    }
    const actualizada = await this.repo.actualizar(id, { nombre: dto.nombre, volumen: dto.volumen });
    if (!actualizada) {
      throw new AppError('Presentación no encontrada', 404, 'NOT_FOUND');
    }
    return this.aDetalle(actualizada);
  }

  async desactivar(id: number): Promise<ResultadoDesactivacion> {
    const presentacion = await this.obtenerEntidad(id);
    if (presentacion.estado === 'inactivo') {
      throw new AppError('La presentación ya está inactiva', 400, 'PRESENTACION_YA_INACTIVA');
    }
    await this.repo.cambiarEstado(id, 'inactivo');
    return { desactivado: true };
  }

  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const presentacion = await this.obtenerEntidad(id);
    if (presentacion.estado === 'activo') {
      throw new AppError('La presentación ya está activa', 400, 'PRESENTACION_YA_ACTIVA');
    }
    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }

  private async obtenerEntidad(id: number): Promise<Presentacion> {
    const presentacion = await this.repo.obtenerPorId(id);
    if (!presentacion) {
      throw new AppError('Presentación no encontrada', 404, 'NOT_FOUND');
    }
    return presentacion;
  }

  private aDetalle(p: Presentacion): PresentacionDetalle {
    return { id_presentacion: p.id_presentacion, nombre: p.nombre, volumen: Number(p.volumen), estado: p.estado };
  }
}
