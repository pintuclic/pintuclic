import { TipoResinasRepository } from '../repositories/resinas.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { TipoResina } from '../../../core/db/types';
import { CrearTipoResinaDto, ActualizarTipoResinaDto } from '../dtos/resinas.dto';
import { ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE TIPOS DE RESINA (HU-CAT-02, RF-CAT-02-04)
// El tipo de resina es un catálogo administrable, no una lista fija en el código.
// ==============================================================================

export class TipoResinasService {
  constructor(private readonly repo: TipoResinasRepository) {}

  async crear(dto: CrearTipoResinaDto): Promise<TipoResina> {
    const existente = await this.repo.obtenerPorNombre(dto.nombre);
    if (existente) {
      throw new AppError('Ya existe un tipo de resina con ese nombre', 409, 'RESINA_DUPLICADA');
    }
    return this.repo.crear({ nombre: dto.nombre });
  }

  async listar(): Promise<TipoResina[]> {
    return this.repo.listar();
  }

  async obtenerPorId(id: number): Promise<TipoResina> {
    const resina = await this.repo.obtenerPorId(id);
    if (!resina) {
      throw new AppError('Tipo de resina no encontrado', 404, 'NOT_FOUND');
    }
    return resina;
  }

  async actualizar(id: number, dto: ActualizarTipoResinaDto): Promise<TipoResina> {
    await this.obtenerPorId(id);
    const duplicada = await this.repo.obtenerPorNombre(dto.nombre, id);
    if (duplicada) {
      throw new AppError('Ya existe un tipo de resina con ese nombre', 409, 'RESINA_DUPLICADA');
    }
    const actualizada = await this.repo.actualizar(id, { nombre: dto.nombre });
    if (!actualizada) {
      throw new AppError('Tipo de resina no encontrado', 404, 'NOT_FOUND');
    }
    return actualizada;
  }

  async desactivar(id: number): Promise<ResultadoDesactivacion> {
    const resina = await this.obtenerPorId(id);
    if (resina.estado === 'inactivo') {
      throw new AppError('El tipo de resina ya está inactivo', 400, 'RESINA_YA_INACTIVA');
    }
    await this.repo.cambiarEstado(id, 'inactivo');
    return { desactivado: true };
  }

  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const resina = await this.obtenerPorId(id);
    if (resina.estado === 'activo') {
      throw new AppError('El tipo de resina ya está activo', 400, 'RESINA_YA_ACTIVA');
    }
    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }
}
