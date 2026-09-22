import { ImagenesRepository, ImagenMetadatos } from '../repositories/imagenes.repository';
import { ProductosRepository } from '../repositories/productos.repository';
import { VariantesRepository } from '../repositories/variantes.repository';
import { ColoresRepository } from '../repositories/colores.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Producto } from '../../../core/db/types';
import { CrearImagenDto, ActualizarImagenDto } from '../dtos/imagenes.dto';
import { ImagenDetalle, ImagenContenido } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE IMÁGENES (HU-CAT-07)
// Cargar/reemplazar/eliminar/ordenar imágenes de un producto (RF-CAT-07-01),
// asociarlas a una variante o color del propio producto (RF-CAT-07-02) y
// mantener una sola imagen principal por producto (CA-CAT-07-02).
//
// FUERA DE ALCANCE (documentado): generación de miniaturas optimizadas
// (RNF-CAT-07-01) — se sirve el binario con caché; las miniaturas requieren una
// librería de imágenes y quedan pendientes.
// ==============================================================================

export class ImagenesService {
  constructor(
    private readonly repo: ImagenesRepository,
    private readonly productosRepo: ProductosRepository,
    private readonly variantesRepo: VariantesRepository,
    private readonly coloresRepo: ColoresRepository
  ) {}

  async crear(idProducto: number, dto: CrearImagenDto): Promise<ImagenDetalle> {
    const producto = await this.exigirProducto(idProducto);
    await this.validarAsociaciones(idProducto, producto, dto.id_variante ?? null, dto.id_color ?? null);

    if (dto.es_principal) {
      await this.repo.desmarcarPrincipal(idProducto);
    }

    const creada = await this.repo.crear({
      id_producto: idProducto,
      id_variante: dto.id_variante ?? null,
      id_color: dto.id_color ?? null,
      datos: dto.imagen.buffer,
      mime_type: dto.imagen.mimeType,
      orden: dto.orden ?? 0,
      es_principal: dto.es_principal ?? false,
    });
    return this.aDetalle(creada);
  }

  async listarPorProducto(idProducto: number): Promise<ImagenDetalle[]> {
    await this.exigirProducto(idProducto);
    const imagenes = await this.repo.listarPorProducto(idProducto);
    return imagenes.map((i) => this.aDetalle(i));
  }

  async obtenerContenido(id: number): Promise<ImagenContenido> {
    const contenido = await this.repo.obtenerContenido(id);
    if (!contenido) {
      throw new AppError('Imagen no encontrada', 404, 'NOT_FOUND');
    }
    return contenido;
  }

  async actualizar(id: number, dto: ActualizarImagenDto): Promise<ImagenDetalle> {
    const meta = await this.exigirImagen(id);
    const producto = await this.exigirProducto(meta.id_producto);

    const idVariante = dto.id_variante !== undefined ? dto.id_variante : meta.id_variante;
    const idColor = dto.id_color !== undefined ? dto.id_color : meta.id_color;
    await this.validarAsociaciones(meta.id_producto, producto, idVariante, idColor);

    if (dto.es_principal === true) {
      await this.repo.desmarcarPrincipal(meta.id_producto, id);
    }

    const actualizada = await this.repo.actualizar(id, {
      id_variante: dto.id_variante,
      id_color: dto.id_color,
      orden: dto.orden,
      es_principal: dto.es_principal,
      ...(dto.imagen !== undefined ? { datos: dto.imagen.buffer, mime_type: dto.imagen.mimeType } : {}),
    });
    if (!actualizada) {
      throw new AppError('Imagen no encontrada', 404, 'NOT_FOUND');
    }
    return this.aDetalle(actualizada);
  }

  /** RF-CAT-07-01: eliminar una imagen (borrado físico permitido; no la referencian órdenes). */
  async eliminar(id: number): Promise<{ readonly eliminado: true }> {
    await this.exigirImagen(id);
    await this.repo.eliminar(id);
    return { eliminado: true };
  }

  private async exigirProducto(idProducto: number): Promise<Producto> {
    const producto = await this.productosRepo.obtenerPorId(idProducto);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }
    return producto;
  }

  private async exigirImagen(id: number): Promise<ImagenMetadatos> {
    const imagen = await this.repo.obtenerMetadatos(id);
    if (!imagen) {
      throw new AppError('Imagen no encontrada', 404, 'NOT_FOUND');
    }
    return imagen;
  }

  /** RF-CAT-07-02: la variante debe ser del producto y el color, de su marca. */
  private async validarAsociaciones(
    idProducto: number,
    producto: Producto,
    idVariante: number | null,
    idColor: number | null
  ): Promise<void> {
    if (idVariante !== null) {
      const variante = await this.variantesRepo.obtenerPorId(idVariante);
      if (!variante) {
        throw new AppError('La variante indicada no existe', 404, 'VARIANTE_NO_ENCONTRADA');
      }
      if (variante.id_producto !== idProducto) {
        throw new AppError('La variante no pertenece a este producto', 409, 'VARIANTE_DE_OTRO_PRODUCTO');
      }
    }
    if (idColor !== null) {
      const color = await this.coloresRepo.obtenerPorId(idColor);
      if (!color) {
        throw new AppError('El color indicado no existe', 404, 'COLOR_NO_ENCONTRADO');
      }
      if (color.id_marca !== producto.id_marca) {
        throw new AppError('El color no pertenece a la marca del producto', 409, 'COLOR_DE_OTRA_MARCA');
      }
    }
  }

  private aDetalle(meta: ImagenMetadatos): ImagenDetalle {
    return {
      id_imagen: meta.id_imagen,
      id_producto: meta.id_producto,
      id_variante: meta.id_variante,
      id_color: meta.id_color,
      mime_type: meta.mime_type,
      orden: meta.orden,
      es_principal: meta.es_principal,
      contenido_url: `/api/catalogo/imagenes/${meta.id_imagen}/contenido`,
    };
  }
}
