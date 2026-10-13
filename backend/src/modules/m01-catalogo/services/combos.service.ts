import { CombosRepository, EjecutorCatalogo } from '../repositories/combos.repository';
import { ProductosRepository } from '../repositories/productos.repository';
import { VariantesRepository } from '../repositories/variantes.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { DefinirComboDto } from '../dtos/combos.dto';
import { Combo } from '../../../core/db/types';
import { ComboDetalle, ComponenteCombo, LineaExistencia } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE COMBOS (HU-CAT-13)
// Un combo es un producto propio (con nombre, imagen, variante, precio y
// existencia) marcado en `combo`; declarar sus componentes es opcional
// (CA-CAT-13-02). A diferencia del resto del catálogo, su existencia es real:
// no se vende por encima de ella (RF-CAT-13-02) y se descuenta al generar la
// orden, no al agregarlo al carrito (CA-CAT-13-04). La existencia se ajusta
// desde el panel con PATCH /variantes/:id (RF-CAT-13-05).
//
// Contrato para M08: `reservarExistencias` al generar la orden (dentro de su
// transacción) y `liberarExistencias` al cancelarla (CA-CAT-13-07).
// ==============================================================================

export class CombosService {
  constructor(
    private readonly repo: CombosRepository,
    private readonly productosRepo: ProductosRepository,
    private readonly variantesRepo: VariantesRepository
  ) {}

  /** RF-CAT-13-01 / CA-CAT-13-01/02: registra el producto como combo y, si se indican, sus componentes. */
  async definir(idProducto: number, dto: DefinirComboDto): Promise<ComboDetalle> {
    const producto = await this.productosRepo.obtenerPorId(idProducto);
    if (!producto) {
      throw new AppError('Producto no encontrado', 404, 'NOT_FOUND');
    }

    for (const componente of dto.componentes) {
      const variante = await this.variantesRepo.obtenerPorId(componente.id_variante);
      if (!variante) {
        throw new AppError(`La variante ${componente.id_variante} no existe`, 404, 'VARIANTE_NO_ENCONTRADA');
      }
      if (variante.id_producto === idProducto) {
        throw new AppError('Un combo no puede incluirse a sí mismo como componente', 409, 'COMBO_AUTORREFERENCIA');
      }
    }

    const combo = await this.repo.definir(idProducto, dto.excluido_descuentos, dto.componentes);
    return aDetalle(combo, dto.componentes);
  }

  async obtener(idProducto: number): Promise<ComboDetalle> {
    const combo = await this.repo.obtenerPorProducto(idProducto);
    if (!combo) {
      throw new AppError('El producto no es un combo', 404, 'COMBO_NO_ENCONTRADO');
    }
    return aDetalle(combo, await this.repo.listarComponentes(combo.id_combo));
  }

  /**
   * CA-CAT-13-09: contrato para M06/M08 al calcular precios. Un producto que no
   * es combo no tiene esta restricción.
   */
  async excluidoDeDescuentos(idProducto: number): Promise<boolean> {
    return (await this.repo.obtenerPorProducto(idProducto))?.excluido_descuentos ?? false;
  }

  /**
   * RF-CAT-13-02/03 / CA-CAT-13-03/05: descuenta la existencia de los combos de
   * la orden e impide que quede negativa. Las demás variantes no se tocan
   * (regla general de venta sin stock). Con `ejecutor`, quien llama debe
   * revertir su transacción si se lanza COMBO_SIN_EXISTENCIA.
   */
  async reservarExistencias(lineas: readonly LineaExistencia[], ejecutor?: EjecutorCatalogo): Promise<void> {
    const faltante = await this.repo.reservar(consolidar(lineas), ejecutor);
    if (faltante !== null) {
      throw new AppError(`No hay unidades suficientes del combo (variante ${faltante})`, 409, 'COMBO_SIN_EXISTENCIA');
    }
  }

  /** CA-CAT-13-07: al cancelar una orden, las unidades de sus combos vuelven a la existencia. */
  async liberarExistencias(lineas: readonly LineaExistencia[], ejecutor?: EjecutorCatalogo): Promise<void> {
    await this.repo.liberar(consolidar(lineas), ejecutor);
  }
}

function aDetalle(combo: Combo, componentes: readonly ComponenteCombo[]): ComboDetalle {
  return {
    id_combo: combo.id_combo,
    id_producto: combo.id_producto,
    excluido_descuentos: combo.excluido_descuentos,
    componentes,
  };
}

/**
 * Agrupa las líneas por variante y las ordena por id: un único UPDATE por fila
 * y un orden de bloqueo estable entre órdenes concurrentes (evita interbloqueos).
 */
function consolidar(lineas: readonly LineaExistencia[]): LineaExistencia[] {
  const porVariante = new Map<number, number>();
  for (const { id_variante, cantidad } of lineas) {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new AppError('La cantidad a reservar o liberar debe ser un entero positivo', 400, 'CANTIDAD_INVALIDA');
    }
    porVariante.set(id_variante, (porVariante.get(id_variante) ?? 0) + cantidad);
  }
  return [...porVariante.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id_variante, cantidad]) => ({ id_variante, cantidad }));
}
