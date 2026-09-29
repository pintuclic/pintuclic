import { ProductosRepository } from '../repositories/productos.repository';
import { PresentacionesRepository } from '../repositories/presentaciones.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { EstablecerRendimientoDto } from '../dtos/rendimiento.dto';
import { RendimientoProducto } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE RENDIMIENTO (HU-CAT-10, alcance aprobado: solo rendimiento)
// El rendimiento se captura por galón (min/máx) y se deriva por presentación a
// partir del volumen (RF-CAT-10-03), sin capturarlo una por una.
//
// FUERA DE ALCANCE (documentado): catálogo genérico de atributos técnicos
// (RF-CAT-10-01) excluido por decisión del PO; conservar el rendimiento en la
// línea de compra (RF-CAT-10-06) depende de M08 (órdenes).
// ==============================================================================

// ponytail: volumen del galón en la misma unidad del volumen de la presentación
// (litros en el seed). Calibrable si el negocio cambia la unidad base.
const VOLUMEN_GALON = 3.785;

/** RF-CAT-10-03: deriva el rendimiento de una presentación desde el valor por galón. */
export function derivarRendimiento(valorPorGalon: number, volumenPresentacion: number): number {
  return Math.round(((valorPorGalon * volumenPresentacion) / VOLUMEN_GALON) * 100) / 100;
}

export class RendimientoService {
  constructor(
    private readonly productosRepo: ProductosRepository,
    private readonly presentacionesRepo: PresentacionesRepository
  ) {}

  /** RF-CAT-10-02/05: fija (o limpia) el rendimiento por galón del producto. */
  async establecer(idProducto: number, dto: EstablecerRendimientoDto): Promise<RendimientoProducto> {
    await this.exigirProducto(idProducto);
    const actualizado = await this.productosRepo.actualizar(idProducto, {
      rendimiento_min: dto.rendimiento_min,
      rendimiento_max: dto.rendimiento_max,
    });
    if (!actualizado) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }
    return this.obtener(idProducto);
  }

  /** RF-CAT-10-03: rendimiento del producto y su derivación por presentación activa. */
  async obtener(idProducto: number): Promise<RendimientoProducto> {
    const producto = await this.exigirProducto(idProducto);
    const min = producto.rendimiento_min === null ? null : Number(producto.rendimiento_min);
    const max = producto.rendimiento_max === null ? null : Number(producto.rendimiento_max);

    if (min === null || max === null) {
      return { id_producto: idProducto, rendimiento_min: null, rendimiento_max: null, por_presentacion: [] };
    }

    const presentaciones = (await this.presentacionesRepo.listar()).filter((p) => p.estado === 'activo');
    const por_presentacion = presentaciones.map((p) => {
      const volumen = Number(p.volumen);
      return {
        id_presentacion: p.id_presentacion,
        nombre: p.nombre,
        volumen,
        rendimiento_min: derivarRendimiento(min, volumen),
        rendimiento_max: derivarRendimiento(max, volumen),
      };
    });

    return { id_producto: idProducto, rendimiento_min: min, rendimiento_max: max, por_presentacion };
  }

  private async exigirProducto(idProducto: number) {
    const producto = await this.productosRepo.obtenerPorId(idProducto);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }
    return producto;
  }
}
