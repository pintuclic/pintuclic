import { ColoresRepository } from '../repositories/colores.repository';
import { ColorBasesRepository } from '../repositories/color-bases.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Color } from '../../../core/db/types';
import { CrearColorDto, ActualizarColorDto, ListarColoresQueryDto } from '../dtos/colores.dto';
import { ColorDetalle, PaginaColores, ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';
import { familiaCromatica } from './familia-cromatica';

// ==============================================================================
// M01 - SERVICIO DE COLORES (HU-CAT-05)
// Catálogo único de colores (RF-CAT-05-01): no pertenecen a ninguna marca y su
// nombre y su código son únicos en todo el catálogo. El hexadecimal es
// obligatorio y genera la muestra (RF-CAT-05-02); la familia se deriva de él
// (RF-CAT-05-03). Un color se prepara sobre las bases de color_base o se declara
// «sin base» (RF-CAT-12-12/13), nunca ambas cosas.
//
// FUERA DE ALCANCE (documentado): familias administrables y carga masiva de
// colores (RF-CAT-05-03), pendientes de conciliar con el PO (M01-17).
// ==============================================================================

export class ColoresService {
  constructor(
    private readonly repo: ColoresRepository,
    private readonly colorBasesRepo: ColorBasesRepository
  ) {}

  /** RF-CAT-05-01/02, CA-CAT-05-01/02/04. */
  async crear(dto: CrearColorDto): Promise<ColorDetalle> {
    await this.exigirUnico(dto.nombre, dto.codigo ?? null);
    const creado = await this.repo.crear({
      nombre: dto.nombre,
      codigo: dto.codigo ?? null,
      hexadecimal: dto.hexadecimal,
      sin_base: dto.sin_base,
    });
    return aDetalle(creado);
  }

  /** RF-CAT-05-01 / CA-CAT-05-05: consulta y búsqueda paginada del catálogo. */
  async listar(consulta: ListarColoresQueryDto): Promise<PaginaColores> {
    const { colores, total } = await this.repo.listar({
      ...(consulta.q !== undefined ? { busqueda: consulta.q } : {}),
      limite: consulta.limite,
      offset: (consulta.pagina - 1) * consulta.limite,
    });
    return { items: colores.map(aDetalle), total, pagina: consulta.pagina, limite: consulta.limite };
  }

  async obtenerPorId(id: number): Promise<ColorDetalle> {
    return aDetalle(await this.obtenerEntidad(id));
  }

  async actualizar(id: number, dto: ActualizarColorDto): Promise<ColorDetalle> {
    const actual = await this.obtenerEntidad(id);
    if (dto.nombre !== undefined || dto.codigo !== undefined) {
      await this.exigirUnico(dto.nombre ?? actual.nombre, dto.codigo !== undefined ? dto.codigo : actual.codigo, id);
    }
    if (dto.sin_base === true && !actual.sin_base && (await this.colorBasesRepo.listarBases(id)).length > 0) {
      throw new AppError(
        'El color tiene bases asociadas: retírelas antes de declararlo «sin base»',
        409,
        'COLOR_CON_BASES'
      );
    }

    const actualizado = await this.repo.actualizar(id, {
      nombre: dto.nombre,
      codigo: dto.codigo,
      hexadecimal: dto.hexadecimal,
      sin_base: dto.sin_base,
    });
    if (!actualizado) {
      throw new AppError('Color no encontrado', 404, 'NOT_FOUND');
    }
    return aDetalle(actualizado);
  }

  /**
   * RF-CAT-05-05 / RF-CAT-09-02: desactiva el color y, en la misma transacción,
   * las variantes activas de colores fijos que lo usan. En entonables el color
   * solo sale de la carta (la consulta pública exige color activo) y las
   * variantes de base no se tocan (CA-CAT-05-07/08).
   */
  async desactivar(id: number): Promise<ResultadoDesactivacion> {
    const color = await this.obtenerEntidad(id);
    if (color.estado === 'inactivo') {
      throw new AppError('El color ya está inactivo', 400, 'COLOR_YA_INACTIVO');
    }
    await this.repo.desactivarConVariantesFijas(id);
    return { desactivado: true };
  }

  /** RF-CAT-09-04: un color del catálogo único no depende de ninguna marca para reactivarse. */
  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const color = await this.obtenerEntidad(id);
    if (color.estado === 'activo') {
      throw new AppError('El color ya está activo', 400, 'COLOR_YA_ACTIVO');
    }
    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }

  private async obtenerEntidad(id: number): Promise<Color> {
    const color = await this.repo.obtenerPorId(id);
    if (!color) {
      throw new AppError('Color no encontrado', 404, 'NOT_FOUND');
    }
    return color;
  }

  /** RF-CAT-05-01: nombre y código únicos en todo el catálogo. */
  private async exigirUnico(nombre: string, codigo: string | null, excluirId?: number): Promise<void> {
    const duplicado = await this.repo.buscarDuplicado(nombre, codigo, excluirId);
    if (duplicado) {
      throw new AppError('Ya existe un color con ese nombre o ese código en el catálogo', 409, 'COLOR_DUPLICADO');
    }
  }
}

/** RF-CAT-05-02/03: ficha del color con su muestra y su familia derivadas del hexadecimal. */
function aDetalle(color: Color): ColorDetalle {
  return {
    id_color: color.id_color,
    nombre: color.nombre,
    codigo: color.codigo,
    hexadecimal: color.hexadecimal,
    familia: familiaCromatica(color.hexadecimal),
    sin_base: color.sin_base,
    estado: color.estado,
  };
}
