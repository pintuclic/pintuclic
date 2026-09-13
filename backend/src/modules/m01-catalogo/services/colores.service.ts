import { ColoresRepository } from '../repositories/colores.repository';
import { MarcasRepository } from '../repositories/marcas.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { Color } from '../../../core/db/types';
import { CrearColorDto, ActualizarColorDto } from '../dtos/colores.dto';
import { ColorDetalle, ResultadoDesactivacion, ResultadoReactivacion } from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE COLORES (HU-CAT-05, alcance aprobado)
// Reglas de negocio: un color pertenece a una única marca existente, su nombre
// es único dentro de esa marca y su valor CIELAB es obligatorio. La muestra
// visual se deriva del CIELAB (RF-CAT-05-02) sin requerir imagen.
//
// FUERA DE ALCANCE (documentado, no implementado):
// - Familias cromáticas administrables y carga masiva (RF-CAT-05-03): excluido
//   a petición del PO en esta conversación.
// - Uso del color en carta/variantes de producto (RF-CAT-05-04/05/06): requiere
//   producto (HU-CAT-02) y variante (HU-CAT-03), aún no implementados.
// - Asociación color↔base (RF-CAT-12-04): flujo 3 de HU-CAT-12; además la regla
//   que determina la base de un color está sin definir (RF-CAT-12-12).
// ==============================================================================

export class ColoresService {
  constructor(
    private readonly repo: ColoresRepository,
    private readonly marcasRepo: MarcasRepository
  ) {}

  /** RF-CAT-05-01, RF-CAT-05-02, CA-CAT-05-01, CA-CAT-05-02, CA-CAT-05-04. */
  async crear(dto: CrearColorDto): Promise<ColorDetalle> {
    const marca = await this.marcasRepo.obtenerPorId(dto.id_marca);
    if (!marca) {
      throw new AppError('El color debe asociarse a una marca existente', 404, 'MARCA_NO_ENCONTRADA');
    }

    const duplicado = await this.repo.obtenerPorNombreYMarca(dto.nombre, dto.id_marca);
    if (duplicado) {
      throw new AppError('Ya existe un color con ese nombre dentro de la misma marca', 409, 'COLOR_DUPLICADO');
    }

    const creado = await this.repo.crear({
      id_marca: dto.id_marca,
      nombre: dto.nombre,
      codigo: dto.codigo ?? null,
      cie_l: dto.cielab.l,
      cie_a: dto.cielab.a,
      cie_b: dto.cielab.b,
    });
    return this.aDetalle(creado);
  }

  /** RF-CAT-05-01: consulta y búsqueda de los colores de una marca (CA-CAT-05-05 filtrado). */
  async listarPorMarca(idMarca: number, busqueda?: string): Promise<ColorDetalle[]> {
    const marca = await this.marcasRepo.obtenerPorId(idMarca);
    if (!marca) {
      throw new AppError('Marca no encontrada', 404, 'NOT_FOUND');
    }
    const colores = await this.repo.listarPorMarca(idMarca, busqueda);
    return colores.map((c) => this.aDetalle(c));
  }

  async obtenerPorId(id: number): Promise<ColorDetalle> {
    return this.aDetalle(await this.obtenerEntidad(id));
  }

  async actualizar(id: number, dto: ActualizarColorDto): Promise<ColorDetalle> {
    const actual = await this.obtenerEntidad(id);

    if (dto.nombre !== undefined) {
      const duplicado = await this.repo.obtenerPorNombreYMarca(dto.nombre, actual.id_marca, id);
      if (duplicado) {
        throw new AppError('Ya existe un color con ese nombre dentro de la misma marca', 409, 'COLOR_DUPLICADO');
      }
    }

    const actualizado = await this.repo.actualizar(id, {
      nombre: dto.nombre,
      codigo: dto.codigo,
      cie_l: dto.cielab?.l,
      cie_a: dto.cielab?.a,
      cie_b: dto.cielab?.b,
    });
    if (!actualizado) {
      throw new AppError('Color no encontrado', 404, 'NOT_FOUND');
    }
    return this.aDetalle(actualizado);
  }

  /** RF-CAT-05-01: cambio de estado. La cascada sobre variantes (RF-CAT-05-05) se difiere a HU-CAT-03. */
  async desactivar(id: number): Promise<ResultadoDesactivacion> {
    const color = await this.obtenerEntidad(id);
    if (color.estado === 'inactivo') {
      throw new AppError('El color ya está inactivo', 400, 'COLOR_YA_INACTIVO');
    }
    await this.repo.cambiarEstado(id, 'inactivo');
    return { desactivado: true };
  }

  /** RF-CAT-09-04: no se puede reactivar un color cuya marca siga inactiva. */
  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const color = await this.obtenerEntidad(id);
    if (color.estado === 'activo') {
      throw new AppError('El color ya está activo', 400, 'COLOR_YA_ACTIVO');
    }

    const marca = await this.marcasRepo.obtenerPorId(color.id_marca);
    if (marca?.estado !== 'activo') {
      throw new AppError('No se puede reactivar: la marca está inactiva', 400, 'MARCA_INACTIVA');
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

  /** RF-CAT-05-02: arma la ficha derivando la muestra visual del valor CIELAB. */
  private aDetalle(color: Color): ColorDetalle {
    const l = Number(color.cie_l);
    const a = Number(color.cie_a);
    const b = Number(color.cie_b);
    return {
      id_color: color.id_color,
      id_marca: color.id_marca,
      nombre: color.nombre,
      codigo: color.codigo,
      cielab: { l, a, b },
      muestra_hex: cielabAHex(l, a, b),
      estado: color.estado,
    };
  }
}

/**
 * RF-CAT-05-02: convierte un valor CIELAB (D65) a su color sRGB en formato hex
 * (`#RRGGBB`), para generar la muestra visual sin requerir imagen. Algoritmo
 * estándar LAB → XYZ → sRGB (EasyRGB), con recorte al gamut visible.
 */
export function cielabAHex(l: number, a: number, b: number): string {
  // LAB -> XYZ (blanco de referencia D65)
  let y = (l + 16) / 116;
  let x = a / 500 + y;
  let z = y - b / 200;
  const expandir = (t: number): number => {
    const t3 = t * t * t;
    return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
  };
  x = 95.047 * expandir(x);
  y = 100.0 * expandir(y);
  z = 108.883 * expandir(z);

  // XYZ -> sRGB lineal
  x /= 100;
  y /= 100;
  z /= 100;
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let bl = x * 0.0557 + y * -0.204 + z * 1.057;

  // Compansión gamma
  const gamma = (c: number): number => (c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c);
  r = gamma(r);
  g = gamma(g);
  bl = gamma(bl);

  const aByte = (c: number): string =>
    Math.round(Math.min(1, Math.max(0, c)) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${aByte(r)}${aByte(g)}${aByte(bl)}`.toUpperCase();
}
