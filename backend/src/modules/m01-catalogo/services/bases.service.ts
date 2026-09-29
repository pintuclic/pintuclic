import { BasesRepository } from '../repositories/bases.repository';
import { MarcasRepository } from '../repositories/marcas.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Base } from '../../../core/db/types';
import { CrearBaseDto, ActualizarBaseDto } from '../dtos/bases.dto';
import { ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE BASES (HU-CAT-12, solo el registro de bases)
// Reglas de negocio: una base pertenece a una única marca existente y su
// nombre/código es único dentro de esa marca.
//
// FUERA DE ALCANCE (documentado, no implementado):
// - Asignar bases a un producto entonable (RF-CAT-12-02/03): requiere que
//   producto exista con clase "entonable" (HU-CAT-02).
// - Asociar colores a bases (RF-CAT-12-04): requiere que color exista
//   (HU-CAT-05); además la regla de negocio que determina la base de un
//   color está marcada como no definida en la especificación (RF-CAT-12-12).
// - Retirar de la carta los colores que dependían de una base desactivada
//   (RF-CAT-12-06): depende de la asociación color↔base anterior.
// ==============================================================================

export class BasesService {
  constructor(
    private readonly repo: BasesRepository,
    private readonly marcasRepo: MarcasRepository
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

    return this.repo.crear({ nombre: dto.nombre, id_marca: dto.id_marca });
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

    const duplicada = await this.repo.obtenerPorNombreYMarca(dto.nombre, actual.id_marca, id);
    if (duplicada) {
      throw new AppError('Ya existe una base con ese nombre dentro de la misma marca', 409, 'BASE_DUPLICADA');
    }

    const actualizada = await this.repo.actualizar(id, { nombre: dto.nombre });
    if (!actualizada) {
      throw new AppError('Base no encontrada', 404, 'NOT_FOUND');
    }
    return actualizada;
  }

  /**
   * Según el diagrama oficial, desactivar una base no pide confirmación
   * previa (a diferencia de categoría/línea). El retiro en cascada de los
   * colores que solo se preparaban sobre ella (RF-CAT-12-06) queda pendiente
   * hasta que exista la asociación color↔base.
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
}
