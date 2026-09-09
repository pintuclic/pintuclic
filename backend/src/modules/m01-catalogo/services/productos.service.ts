import { ProductosRepository } from '../repositories/productos.repository';
import { MarcasRepository } from '../repositories/marcas.repository';
import { LineasRepository } from '../repositories/lineas.repository';
import { TipoResinasRepository } from '../repositories/resinas.repository';
import { SubcategoriasRepository } from '../repositories/subcategorias.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Producto, ProductoUpdate, EnumClaseColor } from '../../../core/db/types';
import { CrearProductoDto, ActualizarProductoDto } from '../dtos/productos.dto';
import { ProductoDetalle, ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE PRODUCTOS (HU-CAT-02)
// Reglas de negocio: marca obligatoria y existente; al menos una subcategoría;
// una pintura (clase != sin_color) exige línea + resina, y la línea debe ser de
// la marca del producto; la clase no puede cambiarse si ya hay variantes.
//
// FUERA DE ALCANCE (documentado):
// - Publicar exige, además de variante activa, al menos una imagen (RF-CAT-02-05):
//   la validación de imagen depende de HU-CAT-07 (aún no existe) y queda diferida.
// - La marca de un producto no es editable tras crearlo (evita romper la
//   integridad línea/color de la marca); si el negocio lo requiere, se abordará
//   como cambio aparte.
// ==============================================================================

export class ProductosService {
  constructor(
    private readonly repo: ProductosRepository,
    private readonly marcasRepo: MarcasRepository,
    private readonly lineasRepo: LineasRepository,
    private readonly resinasRepo: TipoResinasRepository,
    private readonly subcategoriasRepo: SubcategoriasRepository
  ) {}

  async crear(dto: CrearProductoDto): Promise<ProductoDetalle> {
    const marca = await this.marcasRepo.obtenerPorId(dto.id_marca);
    if (!marca) {
      throw new AppError('El producto debe asociarse a una marca existente', 404, 'MARCA_NO_ENCONTRADA');
    }

    await this.validarSubcategorias(dto.id_subcategorias);
    await this.validarLineaYResina(dto.clase_color, dto.id_marca, dto.id_linea ?? null, dto.id_tipo_resina ?? null);

    const creado = await this.repo.crear(
      {
        id_marca: dto.id_marca,
        id_linea: dto.id_linea ?? null,
        id_tipo_resina: dto.id_tipo_resina ?? null,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        clase_color: dto.clase_color,
      },
      dto.id_subcategorias
    );
    return this.aDetalle(creado);
  }

  async listar(filtros?: { busqueda?: string; idMarca?: number }): Promise<ProductoDetalle[]> {
    const productos = await this.repo.listar(filtros);
    return Promise.all(productos.map((p) => this.aDetalle(p)));
  }

  async obtenerPorId(id: number): Promise<ProductoDetalle> {
    return this.aDetalle(await this.obtenerEntidad(id));
  }

  async actualizar(id: number, dto: ActualizarProductoDto): Promise<ProductoDetalle> {
    const actual = await this.obtenerEntidad(id);

    // RF-CAT-02-03: no se puede cambiar la clase si el producto ya tiene variantes.
    if (dto.clase_color !== undefined && dto.clase_color !== actual.clase_color) {
      const variantes = await this.repo.contarVariantes(id);
      if (variantes > 0) {
        throw new AppError(
          'No se puede cambiar la clase de color: el producto ya tiene variantes. Retírelas primero.',
          409,
          'PRODUCTO_CON_VARIANTES'
        );
      }
    }

    const claseEfectiva: EnumClaseColor = dto.clase_color ?? actual.clase_color;
    const lineaEfectiva = dto.id_linea !== undefined ? dto.id_linea : actual.id_linea;
    const resinaEfectiva = dto.id_tipo_resina !== undefined ? dto.id_tipo_resina : actual.id_tipo_resina;

    if (dto.id_subcategorias !== undefined) {
      await this.validarSubcategorias(dto.id_subcategorias);
    }
    await this.validarLineaYResina(claseEfectiva, actual.id_marca, lineaEfectiva, resinaEfectiva);

    const data: ProductoUpdate = {};
    if (dto.nombre !== undefined) data.nombre = dto.nombre;
    if (dto.descripcion !== undefined) data.descripcion = dto.descripcion;
    if (dto.clase_color !== undefined) data.clase_color = dto.clase_color;
    if (dto.id_linea !== undefined) data.id_linea = dto.id_linea;
    if (dto.id_tipo_resina !== undefined) data.id_tipo_resina = dto.id_tipo_resina;

    const actualizado = await this.repo.actualizar(id, data, dto.id_subcategorias);
    if (!actualizado) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }
    return this.aDetalle(actualizado);
  }

  /**
   * RF-CAT-02-05: publicar exige al menos una variante activa y una imagen.
   * La exigencia de imagen queda diferida a HU-CAT-07 (aún no existe); aquí se
   * valida la variante activa, que sí es construible hoy.
   */
  async publicar(id: number): Promise<ProductoDetalle> {
    await this.obtenerEntidad(id);
    const variantesActivas = await this.repo.contarVariantesActivas(id);
    if (variantesActivas < 1) {
      throw new AppError(
        'No se puede publicar: el producto no tiene ninguna variante activa',
        422,
        'PRODUCTO_SIN_VARIANTE_ACTIVA'
      );
    }
    await this.repo.cambiarPublicado(id, true);
    return this.obtenerPorId(id);
  }

  async despublicar(id: number): Promise<ProductoDetalle> {
    await this.obtenerEntidad(id);
    await this.repo.cambiarPublicado(id, false);
    return this.obtenerPorId(id);
  }

  async desactivar(id: number): Promise<ResultadoDesactivacion> {
    const producto = await this.obtenerEntidad(id);
    if (producto.estado === 'inactivo') {
      throw new AppError('El producto ya está inactivo', 400, 'PRODUCTO_YA_INACTIVO');
    }
    await this.repo.cambiarEstado(id, 'inactivo');
    return { desactivado: true };
  }

  /** RF-CAT-09-04: al reactivar, sus dependencias (marca, línea) deben estar activas. */
  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const producto = await this.obtenerEntidad(id);
    if (producto.estado === 'activo') {
      throw new AppError('El producto ya está activo', 400, 'PRODUCTO_YA_ACTIVO');
    }

    const marca = await this.marcasRepo.obtenerPorId(producto.id_marca);
    if (marca?.estado !== 'activo') {
      throw new AppError('No se puede reactivar: la marca está inactiva', 400, 'MARCA_INACTIVA');
    }
    if (producto.id_linea !== null) {
      const linea = await this.lineasRepo.obtenerPorId(producto.id_linea);
      if (linea?.estado !== 'activo') {
        throw new AppError('No se puede reactivar: la línea está inactiva', 400, 'LINEA_INACTIVA');
      }
    }

    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }

  private async obtenerEntidad(id: number): Promise<Producto> {
    const producto = await this.repo.obtenerPorId(id);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }
    return producto;
  }

  /** RF-CAT-02-02: cada subcategoría indicada debe existir. */
  private async validarSubcategorias(ids: number[]): Promise<void> {
    for (const idSub of ids) {
      const sub = await this.subcategoriasRepo.obtenerPorId(idSub);
      if (!sub) {
        throw new AppError(`La subcategoría ${idSub} no existe`, 404, 'SUBCATEGORIA_NO_ENCONTRADA');
      }
    }
  }

  /**
   * RF-CAT-02-02: una pintura (clase != sin_color) exige línea y resina; una
   * brocha (sin_color) puede omitirlas. Toda línea indicada debe pertenecer a la
   * marca del producto (RF-CAT-11-02) y toda resina indicada debe estar activa.
   */
  private async validarLineaYResina(
    clase: EnumClaseColor,
    idMarca: number,
    idLinea: number | null,
    idResina: number | null
  ): Promise<void> {
    const esPintura = clase !== 'sin_color';
    if (esPintura && (idLinea === null || idResina === null)) {
      throw new AppError('Una pintura debe declarar su línea y su tipo de resina', 422, 'PINTURA_REQUIERE_LINEA_RESINA');
    }

    if (idLinea !== null) {
      const linea = await this.lineasRepo.obtenerPorId(idLinea);
      if (!linea) {
        throw new AppError('La línea indicada no existe', 404, 'LINEA_NO_ENCONTRADA');
      }
      if (linea.id_marca !== idMarca) {
        throw new AppError('La línea no pertenece a la marca del producto', 409, 'LINEA_DE_OTRA_MARCA');
      }
    }

    if (idResina !== null) {
      const resina = await this.resinasRepo.obtenerPorId(idResina);
      if (!resina) {
        throw new AppError('El tipo de resina indicado no existe', 404, 'RESINA_NO_ENCONTRADA');
      }
      if (resina.estado !== 'activo') {
        throw new AppError('El tipo de resina indicado está inactivo', 409, 'RESINA_INACTIVA');
      }
    }
  }

  private async aDetalle(producto: Producto): Promise<ProductoDetalle> {
    const id_subcategorias = await this.repo.listarSubcategorias(producto.id_producto);
    return {
      id_producto: producto.id_producto,
      id_marca: producto.id_marca,
      id_linea: producto.id_linea,
      id_tipo_resina: producto.id_tipo_resina,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      clase_color: producto.clase_color,
      estado: producto.estado,
      publicado: producto.publicado,
      id_subcategorias,
    };
  }
}
