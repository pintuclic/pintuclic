import { ProductoBasesRepository } from '../repositories/producto-bases.repository';
import { ProductosRepository } from '../repositories/productos.repository';
import { BasesRepository } from '../repositories/bases.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Base } from '../../../core/db/types';

// ==============================================================================
// M01 - SERVICIO DE PRODUCTO_BASE (HU-CAT-12 flujo 2)
// Declara qué bases ofrece un producto entonable. La base debe ser de la marca
// del producto (RF-CAT-12-03). Solo aplica a productos de clase 'entonable'
// (RF-CAT-12-02). El "tipo de resina" que menciona RF-CAT-12-03 no existe en el
// modelo (excluido por el PO en HU-CAT-12), por lo que la comparación se limita
// a la marca.
// ==============================================================================

export class ProductoBasesService {
  constructor(
    private readonly repo: ProductoBasesRepository,
    private readonly productosRepo: ProductosRepository,
    private readonly basesRepo: BasesRepository
  ) {}

  async asignar(idProducto: number, idBase: number): Promise<Base[]> {
    const producto = await this.exigirProducto(idProducto);
    if (producto.clase_color !== 'entonable') {
      throw new AppError('Solo un producto entonable puede ofrecer bases', 409, 'PRODUCTO_NO_ENTONABLE');
    }

    const base = await this.basesRepo.obtenerPorId(idBase);
    if (!base) {
      throw new AppError('La base indicada no existe', 404, 'BASE_NO_ENCONTRADA');
    }
    if (base.id_marca !== producto.id_marca) {
      throw new AppError('La base no pertenece a la marca del producto', 409, 'BASE_DE_OTRA_MARCA');
    }
    if (base.estado !== 'activo') {
      throw new AppError('La base indicada está inactiva', 409, 'BASE_INACTIVA');
    }
    if (await this.repo.existe(idProducto, idBase)) {
      throw new AppError('La base ya está asignada a este producto', 409, 'BASE_YA_ASIGNADA');
    }

    await this.repo.asignar(idProducto, idBase);
    return this.repo.listarBases(idProducto);
  }

  async listar(idProducto: number): Promise<Base[]> {
    await this.exigirProducto(idProducto);
    return this.repo.listarBases(idProducto);
  }

  async quitar(idProducto: number, idBase: number): Promise<Base[]> {
    await this.exigirProducto(idProducto);
    if (!(await this.repo.existe(idProducto, idBase))) {
      throw new AppError('La base no está asignada a este producto', 404, 'BASE_NO_ASIGNADA');
    }
    const enUso = await this.repo.contarVariantesConBase(idProducto, idBase);
    if (enUso > 0) {
      throw new AppError(
        'No se puede quitar la base: hay variantes del producto que la usan',
        409,
        'BASE_EN_USO_POR_VARIANTE'
      );
    }
    await this.repo.quitar(idProducto, idBase);
    return this.repo.listarBases(idProducto);
  }

  private async exigirProducto(idProducto: number) {
    const producto = await this.productosRepo.obtenerPorId(idProducto);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }
    return producto;
  }
}
