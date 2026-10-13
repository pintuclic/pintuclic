import { ColorBasesRepository } from '../repositories/color-bases.repository';
import { ColoresRepository } from '../repositories/colores.repository';
import { BasesRepository } from '../repositories/bases.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Base, Color } from '../../../core/db/types';

// ==============================================================================
// M01 - SERVICIO DE COLOR_BASE (HU-CAT-12 flujo 3)
// Declara sobre qué base o bases se prepara cada color de la carta
// (RF-CAT-12-04). La base debe ser de la marca del color (RF-CAT-12-03) y estar
// activa. Qué base exige cada color lo define el negocio (RF-CAT-12-12): el
// sistema no la infiere, la registra el administrador.
// ==============================================================================

export class ColorBasesService {
  constructor(
    private readonly repo: ColorBasesRepository,
    private readonly coloresRepo: ColoresRepository,
    private readonly basesRepo: BasesRepository
  ) {}

  async asignar(idColor: number, idBase: number): Promise<Base[]> {
    const color = await this.exigirColor(idColor);

    const base = await this.basesRepo.obtenerPorId(idBase);
    if (!base) {
      throw new AppError('La base indicada no existe', 404, 'BASE_NO_ENCONTRADA');
    }
    if (base.id_marca !== color.id_marca) {
      throw new AppError('La base no pertenece a la marca del color', 409, 'BASE_DE_OTRA_MARCA');
    }
    if (base.estado !== 'activo') {
      throw new AppError('La base indicada está inactiva', 409, 'BASE_INACTIVA');
    }
    if (await this.repo.existe(idColor, idBase)) {
      throw new AppError('El color ya está asociado a esa base', 409, 'BASE_YA_ASIGNADA');
    }

    await this.repo.asignar(idColor, idBase);
    return this.repo.listarBases(idColor);
  }

  async listar(idColor: number): Promise<Base[]> {
    await this.exigirColor(idColor);
    return this.repo.listarBases(idColor);
  }

  async quitar(idColor: number, idBase: number): Promise<Base[]> {
    await this.exigirColor(idColor);
    if (!(await this.repo.existe(idColor, idBase))) {
      throw new AppError('El color no está asociado a esa base', 404, 'BASE_NO_ASIGNADA');
    }
    await this.repo.quitar(idColor, idBase);
    return this.repo.listarBases(idColor);
  }

  private async exigirColor(idColor: number): Promise<Color> {
    const color = await this.coloresRepo.obtenerPorId(idColor);
    if (!color) {
      throw new AppError('Color no encontrado', 404, 'NOT_FOUND');
    }
    return color;
  }
}
