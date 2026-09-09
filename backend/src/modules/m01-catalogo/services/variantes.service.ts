import { VariantesRepository } from '../repositories/variantes.repository';
import { ProductosRepository } from '../repositories/productos.repository';
import { PresentacionesRepository } from '../repositories/presentaciones.repository';
import { BasesRepository } from '../repositories/bases.repository';
import { ColoresRepository } from '../repositories/colores.repository';
import { ProductoBasesRepository } from '../repositories/producto-bases.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Variante, VarianteUpdate, Producto, EnumClaseColor } from '../../../core/db/types';
import { CrearVarianteDto, ActualizarVarianteDto } from '../dtos/variantes.dto';
import { VarianteDetalle, ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE VARIANTES (HU-CAT-03)
// Reglas: la forma de la variante depende de la clase del producto
// (RF-CAT-03-02); no hay dos variantes idénticas del mismo producto
// (RF-CAT-03-03); base/color deben ser de la marca del producto; el código de
// proveedor es único (RF-CAT-03-06); no hay borrado físico, solo desactivación
// (RF-CAT-03-01).
// ==============================================================================

export class VariantesService {
  constructor(
    private readonly repo: VariantesRepository,
    private readonly productosRepo: ProductosRepository,
    private readonly presentacionesRepo: PresentacionesRepository,
    private readonly basesRepo: BasesRepository,
    private readonly coloresRepo: ColoresRepository,
    private readonly productoBasesRepo: ProductoBasesRepository
  ) {}

  async crear(dto: CrearVarianteDto): Promise<VarianteDetalle> {
    const producto = await this.obtenerProducto(dto.id_producto);
    await this.exigirPresentacionActiva(dto.id_presentacion);

    const idBase = dto.id_base ?? null;
    const idColor = dto.id_color ?? null;
    this.validarForma(producto.clase_color, idBase, idColor);
    await this.validarBaseYColor(producto.id_marca, idBase, idColor);
    await this.exigirBaseDeclarada(producto.clase_color, producto.id_producto, idBase);

    if (dto.codigo_proveedor !== undefined) {
      await this.exigirCodigoUnico(dto.codigo_proveedor);
    }
    await this.exigirFormaUnica(dto.id_producto, idBase, idColor, dto.id_presentacion);

    const creada = await this.repo.crear({
      id_producto: dto.id_producto,
      id_presentacion: dto.id_presentacion,
      id_base: idBase,
      id_color: idColor,
      precio_vigente: dto.precio_vigente,
      existencia_referencial: dto.existencia_referencial ?? 0,
      codigo_proveedor: dto.codigo_proveedor ?? null,
    });
    return this.aDetalle(creada);
  }

  async listarPorProducto(idProducto: number): Promise<VarianteDetalle[]> {
    await this.obtenerProducto(idProducto);
    const variantes = await this.repo.listarPorProducto(idProducto);
    return variantes.map((v) => this.aDetalle(v));
  }

  async obtenerPorId(id: number): Promise<VarianteDetalle> {
    return this.aDetalle(await this.obtenerEntidad(id));
  }

  async actualizar(id: number, dto: ActualizarVarianteDto): Promise<VarianteDetalle> {
    const actual = await this.obtenerEntidad(id);
    const producto = await this.obtenerProducto(actual.id_producto);

    const idPresentacion = dto.id_presentacion ?? actual.id_presentacion;
    const idBase = dto.id_base !== undefined ? dto.id_base : actual.id_base;
    const idColor = dto.id_color !== undefined ? dto.id_color : actual.id_color;

    this.validarForma(producto.clase_color, idBase, idColor);
    await this.validarBaseYColor(producto.id_marca, idBase, idColor);
    await this.exigirBaseDeclarada(producto.clase_color, producto.id_producto, idBase);
    if (dto.id_presentacion !== undefined) {
      await this.exigirPresentacionActiva(dto.id_presentacion);
    }
    if (dto.codigo_proveedor !== undefined && dto.codigo_proveedor !== null) {
      await this.exigirCodigoUnico(dto.codigo_proveedor, id);
    }
    await this.exigirFormaUnica(actual.id_producto, idBase, idColor, idPresentacion, id);

    const data: VarianteUpdate = {};
    if (dto.id_presentacion !== undefined) data.id_presentacion = dto.id_presentacion;
    if (dto.precio_vigente !== undefined) data.precio_vigente = dto.precio_vigente;
    if (dto.existencia_referencial !== undefined) data.existencia_referencial = dto.existencia_referencial;
    if (dto.id_base !== undefined) data.id_base = dto.id_base;
    if (dto.id_color !== undefined) data.id_color = dto.id_color;
    if (dto.codigo_proveedor !== undefined) data.codigo_proveedor = dto.codigo_proveedor;

    const actualizada = await this.repo.actualizar(id, data);
    if (!actualizada) {
      throw new AppError('Variante no encontrada', 404, 'NOT_FOUND');
    }
    return this.aDetalle(actualizada);
  }

  async desactivar(id: number): Promise<ResultadoDesactivacion> {
    const variante = await this.obtenerEntidad(id);
    if (variante.estado === 'inactivo') {
      throw new AppError('La variante ya está inactiva', 400, 'VARIANTE_YA_INACTIVA');
    }
    await this.repo.cambiarEstado(id, 'inactivo');
    return { desactivado: true };
  }

  /** RF-CAT-09-04/05: al reactivar, producto, presentación y base/color deben estar activos. */
  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const variante = await this.obtenerEntidad(id);
    if (variante.estado === 'activo') {
      throw new AppError('La variante ya está activa', 400, 'VARIANTE_YA_ACTIVA');
    }

    const producto = await this.obtenerProducto(variante.id_producto);
    if (producto.estado !== 'activo') {
      throw new AppError('No se puede reactivar: el producto está inactivo', 400, 'PRODUCTO_INACTIVO');
    }

    const presentacion = await this.presentacionesRepo.obtenerPorId(variante.id_presentacion);
    if (presentacion?.estado !== 'activo') {
      throw new AppError('No se puede reactivar: la presentación está inactiva', 400, 'PRESENTACION_INACTIVA');
    }

    if (variante.id_base !== null) {
      const base = await this.basesRepo.obtenerPorId(variante.id_base);
      if (base?.estado !== 'activo') {
        throw new AppError('No se puede reactivar: la base está inactiva', 400, 'BASE_INACTIVA');
      }
    }
    if (variante.id_color !== null) {
      const color = await this.coloresRepo.obtenerPorId(variante.id_color);
      if (color?.estado !== 'activo') {
        throw new AppError('No se puede reactivar: el color está inactivo', 400, 'COLOR_INACTIVO');
      }
    }

    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }

  // ----------------------------------------------------------------------------
  // Helpers de validación
  // ----------------------------------------------------------------------------

  private async obtenerEntidad(id: number): Promise<Variante> {
    const variante = await this.repo.obtenerPorId(id);
    if (!variante) {
      throw new AppError('Variante no encontrada', 404, 'NOT_FOUND');
    }
    return variante;
  }

  private async obtenerProducto(id: number): Promise<Producto> {
    const producto = await this.productosRepo.obtenerPorId(id);
    if (!producto) {
      throw new AppError('El producto de la variante no existe', 404, 'PRODUCTO_NO_ENCONTRADO');
    }
    return producto;
  }

  private async exigirPresentacionActiva(idPresentacion: number): Promise<void> {
    const presentacion = await this.presentacionesRepo.obtenerPorId(idPresentacion);
    if (!presentacion) {
      throw new AppError('La presentación indicada no existe', 404, 'PRESENTACION_NO_ENCONTRADA');
    }
    if (presentacion.estado !== 'activo') {
      throw new AppError('La presentación indicada está inactiva', 409, 'PRESENTACION_INACTIVA');
    }
  }

  /** RF-CAT-03-02 / CA-CAT-03-03/04: la forma de la variante depende de la clase del producto. */
  private validarForma(clase: EnumClaseColor, idBase: number | null, idColor: number | null): void {
    if (clase === 'entonable') {
      if (idBase === null) {
        throw new AppError('Una variante de un producto entonable requiere una base', 422, 'VARIANTE_REQUIERE_BASE');
      }
      if (idColor !== null) {
        throw new AppError('Una variante entonable se identifica por base, no por color', 409, 'VARIANTE_ENTONABLE_SIN_COLOR');
      }
    } else if (clase === 'colores_fijos') {
      if (idColor === null) {
        throw new AppError('Una variante de un producto de colores fijos requiere un color', 422, 'VARIANTE_REQUIERE_COLOR');
      }
      if (idBase !== null) {
        throw new AppError('Una variante de colores fijos se identifica por color, no por base', 409, 'VARIANTE_FIJA_SIN_BASE');
      }
    } else {
      // sin_color
      if (idBase !== null || idColor !== null) {
        throw new AppError('Un producto sin color no admite base ni color en sus variantes', 409, 'VARIANTE_SIN_COLOR');
      }
    }
  }

  /** RF-CAT-03-03 / CA-CAT-03-06: base/color deben ser de la marca del producto y estar activos. */
  private async validarBaseYColor(idMarca: number, idBase: number | null, idColor: number | null): Promise<void> {
    if (idBase !== null) {
      const base = await this.basesRepo.obtenerPorId(idBase);
      if (!base) {
        throw new AppError('La base indicada no existe', 404, 'BASE_NO_ENCONTRADA');
      }
      if (base.id_marca !== idMarca) {
        throw new AppError('La base no pertenece a la marca del producto', 409, 'BASE_DE_OTRA_MARCA');
      }
      if (base.estado !== 'activo') {
        throw new AppError('La base indicada está inactiva', 409, 'BASE_INACTIVA');
      }
    }
    if (idColor !== null) {
      const color = await this.coloresRepo.obtenerPorId(idColor);
      if (!color) {
        throw new AppError('El color indicado no existe', 404, 'COLOR_NO_ENCONTRADO');
      }
      if (color.id_marca !== idMarca) {
        throw new AppError('El color no pertenece a la marca del producto', 409, 'COLOR_DE_OTRA_MARCA');
      }
      if (color.estado !== 'activo') {
        throw new AppError('El color indicado está inactivo', 409, 'COLOR_INACTIVO');
      }
    }
  }

  /** HU-CAT-12 flujo 2: la base de una variante entonable debe estar declarada en producto_base. */
  private async exigirBaseDeclarada(clase: EnumClaseColor, idProducto: number, idBase: number | null): Promise<void> {
    if (clase === 'entonable' && idBase !== null) {
      const declarada = await this.productoBasesRepo.existe(idProducto, idBase);
      if (!declarada) {
        throw new AppError(
          'La base no está declarada para este producto entonable; asígnela primero (HU-CAT-12 flujo 2)',
          409,
          'BASE_NO_DECLARADA'
        );
      }
    }
  }

  private async exigirCodigoUnico(codigo: string, excluirId?: number): Promise<void> {
    const existente = await this.repo.obtenerPorCodigoProveedor(codigo, excluirId);
    if (existente) {
      throw new AppError('Ya existe una variante con ese código de proveedor', 409, 'CODIGO_PROVEEDOR_DUPLICADO');
    }
  }

  private async exigirFormaUnica(
    idProducto: number,
    idBase: number | null,
    idColor: number | null,
    idPresentacion: number,
    excluirId?: number
  ): Promise<void> {
    const existe = await this.repo.existeForma(idProducto, idBase, idColor, idPresentacion, excluirId);
    if (existe) {
      throw new AppError('Ya existe una variante idéntica para este producto', 409, 'VARIANTE_DUPLICADA');
    }
  }

  private aDetalle(v: Variante): VarianteDetalle {
    return {
      id_variante: v.id_variante,
      id_producto: v.id_producto,
      id_presentacion: v.id_presentacion,
      id_color: v.id_color,
      id_base: v.id_base,
      precio_vigente: Number(v.precio_vigente),
      existencia_referencial: v.existencia_referencial,
      codigo_proveedor: v.codigo_proveedor,
      estado: v.estado,
    };
  }
}
