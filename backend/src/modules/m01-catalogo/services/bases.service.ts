import { BasesRepository } from '../repositories/bases.repository';
import { MarcasRepository } from '../repositories/marcas.repository';
import { TipoResinasRepository } from '../repositories/resinas.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Base } from '../../../core/db/types';
import { CrearBaseDto, ActualizarBaseDto } from '../dtos/bases.dto';
import { ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE BASES (HU-CAT-12)
// Reglas de negocio: una base pertenece a una única marca existente, su
// nombre/código es único dentro de esa marca y declara un tipo de resina activo
// (RF-CAT-12-01, CA-CAT-12-01/02). Su asignación a productos vive en
// ProductoBasesService y su relación con los colores en ColorBasesService.
// ==============================================================================

export class BasesService {
  constructor(
    private readonly repo: BasesRepository,
    private readonly marcasRepo: MarcasRepository,
    private readonly resinasRepo: TipoResinasRepository
  ) {}

  /** RF-CAT-12-01. */
  async crear(dto: CrearBaseDto): Promise<Base> {
    const marca = await this.marcasRepo.obtenerPorId(dto.id_marca);
    if (!marca) {
      throw new AppError('La base debe asociarse a una marca existente', 404, 'MARCA_NO_ENCONTRADA');
    }

    const duplicada = await this.repo.obtenerPorNombreYMarca(dto.nombre, dto.id_marca);
    if (duplicada) {
      throw new AppError('Ya existe una base con ese nombre dentro de la misma marca', 409, 'BASE_DUPLICADA');
    }
    await this.exigirResinaActiva(dto.id_tipo_resina);

    return this.repo.crear({ nombre: dto.nombre, id_marca: dto.id_marca, id_tipo_resina: dto.id_tipo_resina });
  }

  async listarPorMarca(idMarca: number): Promise<Base[]> {
    const marca = await this.marcasRepo.obtenerPorId(idMarca);
    if (!marca) {
      throw new AppError('Marca no encontrada', 404, 'NOT_FOUND');
    }
    return this.repo.listarPorMarca(idMarca);
  }

  async obtenerPorId(id: number): Promise<Base> {
    const base = await this.repo.obtenerPorId(id);
    if (!base) {
      throw new AppError('Base no encontrada', 404, 'NOT_FOUND');
    }
    return base;
  }

  async actualizar(id: number, dto: ActualizarBaseDto): Promise<Base> {
    const actual = await this.obtenerPorId(id);

    if (dto.nombre !== undefined && (await this.repo.obtenerPorNombreYMarca(dto.nombre, actual.id_marca, id))) {
      throw new AppError('Ya existe una base con ese nombre dentro de la misma marca', 409, 'BASE_DUPLICADA');
    }
    if (dto.id_tipo_resina !== undefined) {
      await this.exigirResinaActiva(dto.id_tipo_resina);
    }

    const actualizada = await this.repo.actualizar(id, { nombre: dto.nombre, id_tipo_resina: dto.id_tipo_resina });
    if (!actualizada) {
      throw new AppError('Base no encontrada', 404, 'NOT_FOUND');
    }
    return actualizada;
  }

  /**
   * Según el diagrama oficial, desactivar una base no pide confirmación previa.
   * Los colores que solo se preparaban sobre ella salen de la carta porque la
   * consulta pública exige una base vendible (RF-CAT-12-06, CA-CAT-12-06).
   */
  async desactivar(id: number): Promise<ResultadoDesactivacion> {
    const base = await this.obtenerPorId(id);
    if (base.estado === 'inactivo') {
      throw new AppError('La base ya está inactiva', 400, 'BASE_YA_INACTIVA');
    }
    await this.repo.cambiarEstado(id, 'inactivo');
    return { desactivado: true };
  }

  /** No se puede reactivar una base cuya marca siga inactiva (RF-CAT-09-04). */
  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const base = await this.obtenerPorId(id);
    if (base.estado === 'activo') {
      throw new AppError('La base ya está activa', 400, 'BASE_YA_ACTIVA');
    }

    const marca = await this.marcasRepo.obtenerPorId(base.id_marca);
    if (marca?.estado !== 'activo') {
      throw new AppError('No se puede reactivar: la marca está inactiva', 400, 'MARCA_INACTIVA');
    }

    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }

  /** RF-CAT-12-01 / CA-CAT-12-02: la base declara un tipo de resina existente y activo. */
  private async exigirResinaActiva(idTipoResina: number): Promise<void> {
    const resina = await this.resinasRepo.obtenerPorId(idTipoResina);
    if (!resina) {
      throw new AppError('El tipo de resina indicado no existe', 404, 'RESINA_NO_ENCONTRADA');
    }
    if (resina.estado !== 'activo') {
      throw new AppError('El tipo de resina indicado está inactivo', 409, 'RESINA_INACTIVA');
    }
  }
}
