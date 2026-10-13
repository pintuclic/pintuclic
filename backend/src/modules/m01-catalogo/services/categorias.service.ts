import { CategoriasRepository } from '../repositories/categorias.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Categoria } from '../../../core/db/types';
import { CrearCategoriaDto, ActualizarCategoriaDto } from '../dtos/categorias.dto';
import { ImpactoDesactivacion, ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE CATEGORÍAS (HU-CAT-01)
// Reglas de negocio: unicidad a nivel raíz, exactamente 2 niveles de jerarquía,
// y baja lógica en cascada sobre las subcategorías.
// ==============================================================================

export class CategoriasService {
  constructor(private readonly repo: CategoriasRepository) {}

  /** RF-CAT-01-01, RF-CAT-01-03, CA-CAT-01-01, CA-CAT-01-03. */
  async crear(dto: CrearCategoriaDto): Promise<Categoria> {
    const existente = await this.repo.obtenerPorNombre(dto.nombre);
    if (existente) {
      throw new AppError('Ya existe una categoría raíz con ese nombre', 409, 'CATEGORIA_DUPLICADA');
    }
    await this.validarCategoriaComplementaria(dto.id_categoria_complementaria);
    return this.repo.crear({
      nombre: dto.nombre,
      orden: dto.orden,
      id_categoria_complementaria: dto.id_categoria_complementaria ?? null,
    });
  }

  async listar(): Promise<Categoria[]> {
    return this.repo.listar();
  }

  async obtenerPorId(id: number): Promise<Categoria> {
    const categoria = await this.repo.obtenerPorId(id);
    if (!categoria) {
      throw new AppError('Categoría no encontrada', 404, 'NOT_FOUND');
    }
    return categoria;
  }

  async actualizar(id: number, dto: ActualizarCategoriaDto): Promise<Categoria> {
    await this.obtenerPorId(id);

    if (dto.nombre !== undefined) {
      const duplicada = await this.repo.obtenerPorNombre(dto.nombre, id);
      if (duplicada) {
        throw new AppError('Ya existe una categoría raíz con ese nombre', 409, 'CATEGORIA_DUPLICADA');
      }
    }

    await this.validarCategoriaComplementaria(dto.id_categoria_complementaria);
    const actualizada = await this.repo.actualizar(id, {
      nombre: dto.nombre,
      orden: dto.orden,
      id_categoria_complementaria: dto.id_categoria_complementaria,
    });
    if (!actualizada) {
      throw new AppError('Categoría no encontrada', 404, 'NOT_FOUND');
    }
    return actualizada;
  }

  /**
   * RF-CAT-01-04, CA-CAT-01-05: sin `confirmar`, solo informa cuántos productos
   * y subcategorías se verán afectados. Con `confirmar: true`, aplica la baja
   * lógica en cascada sobre la categoría y sus subcategorías.
   */
  async solicitarDesactivacion(
    id: number,
    confirmar: boolean
  ): Promise<ImpactoDesactivacion | ResultadoDesactivacion> {
    const categoria = await this.obtenerPorId(id);
    if (categoria.estado === 'inactivo') {
      throw new AppError('La categoría ya está inactiva', 400, 'CATEGORIA_YA_INACTIVA');
    }

    if (!confirmar) {
      const [productos_afectados, subcategorias_afectadas] = await Promise.all([
        this.repo.contarProductosAfectados(id),
        this.repo.contarSubcategoriasActivas(id),
      ]);
      return { requiere_confirmacion: true, productos_afectados, subcategorias_afectadas };
    }

    await this.repo.cambiarEstado(id, 'inactivo');
    await this.repo.desactivarSubcategoriasDe(id);
    return { desactivado: true };
  }

  /** Reactiva una categoría raíz. No tiene dependencias que verificar (RF-CAT-09-04). */
  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const categoria = await this.obtenerPorId(id);
    if (categoria.estado === 'activo') {
      throw new AppError('La categoría ya está activa', 400, 'CATEGORIA_YA_ACTIVA');
    }
    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }

  /** RF-CAT-08-01: la categoría complementaria indicada debe existir. */
  private async validarCategoriaComplementaria(idCategoria: number | null | undefined): Promise<void> {
    if (idCategoria === undefined || idCategoria === null) return;
    if (!(await this.repo.obtenerPorId(idCategoria))) {
      throw new AppError('La categoría complementaria indicada no existe', 404, 'CATEGORIA_NO_ENCONTRADA');
    }
  }
}
