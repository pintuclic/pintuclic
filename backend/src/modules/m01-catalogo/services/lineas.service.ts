import { LineasRepository } from '../repositories/lineas.repository';
import { MarcasRepository } from '../repositories/marcas.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Linea } from '../../../core/db/types';
import { CrearLineaDto, ActualizarLineaDto } from '../dtos/lineas.dto';
import { ImpactoDesactivacion, ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE LÍNEAS COMERCIALES (HU-CAT-11)
// Reglas de negocio: una línea pertenece a una única marca existente, unicidad
// de nombre solo dentro de esa marca, y baja lógica con advertencia previa.
// ==============================================================================

export class LineasService {
  constructor(
    private readonly repo: LineasRepository,
    private readonly marcasRepo: MarcasRepository
  ) {}

  /** RF-CAT-11-01, RF-CAT-11-02, CA-CAT-11-01, CA-CAT-11-03. */
  async crear(dto: CrearLineaDto): Promise<Linea> {
    const marca = await this.marcasRepo.obtenerPorId(dto.id_marca);
    if (!marca) {
      throw new AppError('La línea debe asociarse a una marca existente', 404, 'MARCA_NO_ENCONTRADA');
    }

    const duplicada = await this.repo.obtenerPorNombreYMarca(dto.nombre, dto.id_marca);
    if (duplicada) {
      throw new AppError('Ya existe una línea con ese nombre dentro de la misma marca', 409, 'LINEA_DUPLICADA');
    }

    return this.repo.crear({
      nombre: dto.nombre,
      id_marca: dto.id_marca,
      gama_comercial: dto.gama_comercial ?? null,
    });
  }

  async listarPorMarca(idMarca: number): Promise<Linea[]> {
    const marca = await this.marcasRepo.obtenerPorId(idMarca);
    if (!marca) {
      throw new AppError('Marca no encontrada', 404, 'NOT_FOUND');
    }
    return this.repo.listarPorMarca(idMarca);
  }

  async obtenerPorId(id: number): Promise<Linea> {
    const linea = await this.repo.obtenerPorId(id);
    if (!linea) {
      throw new AppError('Línea no encontrada', 404, 'NOT_FOUND');
    }
    return linea;
  }

  async actualizar(id: number, dto: ActualizarLineaDto): Promise<Linea> {
    const actual = await this.obtenerPorId(id);

    if (dto.nombre !== undefined) {
      const duplicada = await this.repo.obtenerPorNombreYMarca(dto.nombre, actual.id_marca, id);
      if (duplicada) {
        throw new AppError('Ya existe una línea con ese nombre dentro de la misma marca', 409, 'LINEA_DUPLICADA');
      }
    }

    const actualizada = await this.repo.actualizar(id, {
      nombre: dto.nombre,
      gama_comercial: dto.gama_comercial,
    });
    if (!actualizada) {
      throw new AppError('Línea no encontrada', 404, 'NOT_FOUND');
    }
    return actualizada;
  }

  /**
   * RF-CAT-11-03: sin `confirmar`, informa cuántos productos y cuántas reglas
   * comerciales vigentes de M06 dependen de la línea. Con `confirmar: true`,
   * la desactiva (sin cascada: la desactivación de productos es responsabilidad
   * de HU-CAT-02/09, no de esta HU).
   *
   * NOTA: el módulo M06 (Reglas y Descuentos) todavía no existe en el sistema,
   * por lo que `reglas_afectadas` siempre reporta 0 hasta que se implemente.
   */
  async solicitarDesactivacion(
    id: number,
    confirmar: boolean
  ): Promise<ImpactoDesactivacion | ResultadoDesactivacion> {
    const linea = await this.obtenerPorId(id);
    if (linea.estado === 'inactivo') {
      throw new AppError('La línea ya está inactiva', 400, 'LINEA_YA_INACTIVA');
    }

    if (!confirmar) {
      const productos_afectados = await this.repo.contarProductosAfectados(id);
      return { requiere_confirmacion: true, productos_afectados, reglas_afectadas: 0 };
    }

    await this.repo.cambiarEstado(id, 'inactivo');
    return { desactivado: true };
  }

  /** No se puede reactivar una línea cuya marca siga inactiva (RF-CAT-09-04). */
  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const linea = await this.obtenerPorId(id);
    if (linea.estado === 'activo') {
      throw new AppError('La línea ya está activa', 400, 'LINEA_YA_ACTIVA');
    }

    const marca = await this.marcasRepo.obtenerPorId(linea.id_marca);
    if (marca?.estado !== 'activo') {
      throw new AppError('No se puede reactivar: la marca está inactiva', 400, 'MARCA_INACTIVA');
    }

    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }
}
