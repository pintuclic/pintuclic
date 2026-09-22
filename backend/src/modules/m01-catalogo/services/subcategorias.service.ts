import { SubcategoriasRepository } from '../repositories/subcategorias.repository';
import { CategoriasRepository } from '../repositories/categorias.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Subcategoria } from '../../../core/db/types';
import { CrearSubcategoriaDto, ActualizarSubcategoriaDto } from '../dtos/subcategorias.dto';
import { ImpactoDesactivacion, ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE SUBCATEGORÍAS (HU-CAT-01)
// Reglas de negocio: una subcategoría pertenece a una única categoría padre,
// unicidad de nombre solo dentro de esa categoría, y baja lógica propia.
// ==============================================================================

export class SubcategoriasService {
  constructor(
    private readonly repo: SubcategoriasRepository,
    private readonly categoriasRepo: CategoriasRepository
  ) {}

  /** RF-CAT-01-01, RF-CAT-01-02, RF-CAT-01-03, CA-CAT-01-01, CA-CAT-01-03. */
  async crear(dto: CrearSubcategoriaDto): Promise<Subcategoria> {
    const categoriaPadre = await this.categoriasRepo.obtenerPorId(dto.id_categoria);
    if (!categoriaPadre) {
      throw new AppError('La categoría padre indicada no existe', 404, 'CATEGORIA_PADRE_NO_ENCONTRADA');
    }

    const duplicada = await this.repo.obtenerPorNombreYCategoria(dto.nombre, dto.id_categoria);
    if (duplicada) {
      throw new AppError(
        'Ya existe una subcategoría con ese nombre bajo la misma categoría padre',
        409,
        'SUBCATEGORIA_DUPLICADA'
      );
    }

    return this.repo.crear({ nombre: dto.nombre, id_categoria: dto.id_categoria, orden: dto.orden });
  }

  async listarPorCategoria(idCategoria: number): Promise<Subcategoria[]> {
    const categoria = await this.categoriasRepo.obtenerPorId(idCategoria);
    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404, 'NOT_FOUND');
    }
    return this.repo.listarPorCategoria(idCategoria);
  }

  async obtenerPorId(id: number): Promise<Subcategoria> {
    const subcategoria = await this.repo.obtenerPorId(id);
    if (!subcategoria) {
      throw new AppError('Subcategoría no encontrada', 404, 'NOT_FOUND');
    }
    return subcategoria;
  }

  async actualizar(id: number, dto: ActualizarSubcategoriaDto): Promise<Subcategoria> {
    const actual = await this.obtenerPorId(id);

    if (dto.nombre !== undefined) {
      const duplicada = await this.repo.obtenerPorNombreYCategoria(dto.nombre, actual.id_categoria, id);
      if (duplicada) {
        throw new AppError(
          'Ya existe una subcategoría con ese nombre bajo la misma categoría padre',
          409,
          'SUBCATEGORIA_DUPLICADA'
        );
      }
    }

    const actualizada = await this.repo.actualizar(id, { nombre: dto.nombre, orden: dto.orden });
    if (!actualizada) {
      throw new AppError('Subcategoría no encontrada', 404, 'NOT_FOUND');
    }
    return actualizada;
  }

  /** RF-CAT-01-04, CA-CAT-01-05, CA-CAT-01-06: solo afecta a esta subcategoría, no a sus hermanas. */
  async solicitarDesactivacion(
    id: number,
    confirmar: boolean
  ): Promise<ImpactoDesactivacion | ResultadoDesactivacion> {
    const subcategoria = await this.obtenerPorId(id);
    if (subcategoria.estado === 'inactivo') {
      throw new AppError('La subcategoría ya está inactiva', 400, 'SUBCATEGORIA_YA_INACTIVA');
    }

    if (!confirmar) {
      const productos_afectados = await this.repo.contarProductosAfectados(id);
      return { requiere_confirmacion: true, productos_afectados };
    }

    await this.repo.cambiarEstado(id, 'inactivo');
    return { desactivado: true };
  }

  /** RF-CAT-09-04: no se puede reactivar una subcategoría cuya categoría padre siga inactiva. */
  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const subcategoria = await this.obtenerPorId(id);
    if (subcategoria.estado === 'activo') {
      throw new AppError('La subcategoría ya está activa', 400, 'SUBCATEGORIA_YA_ACTIVA');
    }

    const categoriaPadre = await this.categoriasRepo.obtenerPorId(subcategoria.id_categoria);
    if (categoriaPadre?.estado !== 'activo') {
      throw new AppError(
        'No se puede reactivar: la categoría padre está inactiva',
        400,
        'CATEGORIA_PADRE_INACTIVA'
      );
    }

    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }
}
