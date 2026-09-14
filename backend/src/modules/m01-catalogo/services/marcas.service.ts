import { MarcasRepository } from '../repositories/marcas.repository';
import { LineasRepository } from '../repositories/lineas.repository';
import { BasesRepository } from '../repositories/bases.repository';
import { ColoresRepository } from '../repositories/colores.repository';
import { ProductosRepository } from '../repositories/productos.repository';
import { AppError } from '../../../core/middlewares/errorHandler';
import { CrearMarcaDto, ActualizarMarcaDto } from '../dtos/marcas.dto';
import {
  MarcaResumen,
  MarcaLogotipo,
  ResultadoDesactivacion,
  ResultadoReactivacion,
  ImpactoDesactivacionMarca,
} from '../interfaces/m01.interfaces';

// ==============================================================================
// M01 - SERVICIO DE MARCAS (HU-CAT-04)
// Reglas de negocio: nombre único, logotipo obligatorio y validado, y
// desactivación en cascada según el diagrama oficial (sin paso de confirmación
// explícito, a diferencia de categoría/línea).
// ==============================================================================

export class MarcasService {
  constructor(
    private readonly repo: MarcasRepository,
    private readonly lineasRepo: LineasRepository,
    private readonly basesRepo: BasesRepository,
    private readonly coloresRepo: ColoresRepository,
    private readonly productosRepo: ProductosRepository
  ) {}

  /** RF-CAT-04-01, RF-CAT-04-02, CA-CAT-04-01, CA-CAT-04-02. */
  async crear(dto: CrearMarcaDto): Promise<MarcaResumen> {
    const existente = await this.repo.obtenerPorNombre(dto.nombre);
    if (existente) {
      throw new AppError('Ya existe una marca con ese nombre', 409, 'MARCA_DUPLICADA');
    }

    return this.repo.crear({
      nombre: dto.nombre,
      logotipo: dto.logotipo.buffer,
      logotipo_mime_type: dto.logotipo.mimeType,
    });
  }

  async listar(): Promise<MarcaResumen[]> {
    return this.repo.listar();
  }

  async obtenerPorId(id: number): Promise<MarcaResumen> {
    const marca = await this.repo.obtenerPorId(id);
    if (!marca) {
      throw new AppError('Marca no encontrada', 404, 'NOT_FOUND');
    }
    return marca;
  }

  async obtenerLogotipo(id: number): Promise<MarcaLogotipo> {
    const logotipo = await this.repo.obtenerLogotipo(id);
    if (!logotipo) {
      throw new AppError('Marca no encontrada', 404, 'NOT_FOUND');
    }
    return logotipo;
  }

  async actualizar(id: number, dto: ActualizarMarcaDto): Promise<MarcaResumen> {
    await this.obtenerPorId(id);

    if (dto.nombre !== undefined) {
      const duplicada = await this.repo.obtenerPorNombre(dto.nombre, id);
      if (duplicada) {
        throw new AppError('Ya existe una marca con ese nombre', 409, 'MARCA_DUPLICADA');
      }
    }

    const actualizada = await this.repo.actualizar(id, {
      nombre: dto.nombre,
      logotipo: dto.logotipo?.buffer,
      logotipo_mime_type: dto.logotipo?.mimeType,
    });
    if (!actualizada) {
      throw new AppError('Marca no encontrada', 404, 'NOT_FOUND');
    }
    return actualizada;
  }

  /**
   * RF-CAT-04-03: desactiva la marca y, en cascada, sus líneas activas.
   * El diagrama de esta HU no pide confirmación previa (a diferencia de
   * categoría/línea): se desactiva directamente.
   *
   * RF-CAT-04-03 / HU-CAT-09: la desactivación cascada a `linea`, `base`,
   * `color` y `producto` (esta última se cerró en HU-CAT-09, al existir ya
   * `producto.id_marca` desde HU-CAT-02). El módulo de campañas aún no existe;
   * su cascada queda pendiente de ese módulo.
   */
  async desactivar(id: number): Promise<ResultadoDesactivacion> {
    const marca = await this.obtenerPorId(id);
    if (marca.estado === 'inactivo') {
      throw new AppError('La marca ya está inactiva', 400, 'MARCA_YA_INACTIVA');
    }

    await this.repo.cambiarEstado(id, 'inactivo');
    await this.lineasRepo.desactivarLineasDeMarca(id);
    await this.basesRepo.desactivarBasesDeMarca(id);
    await this.coloresRepo.desactivarColoresDeMarca(id);
    await this.productosRepo.desactivarProductosDeMarca(id);
    return { desactivado: true };
  }

  /** RF-CAT-09-03: informa, antes de desactivar, qué elementos de la marca quedarán ocultos. */
  async impactoDesactivacion(id: number): Promise<ImpactoDesactivacionMarca> {
    await this.obtenerPorId(id);
    const [lineas, bases, colores, productos] = await Promise.all([
      this.lineasRepo.contarActivasPorMarca(id),
      this.basesRepo.contarActivasPorMarca(id),
      this.coloresRepo.contarActivosPorMarca(id),
      this.productosRepo.contarActivosPorMarca(id),
    ]);
    return {
      requiere_confirmacion: true,
      lineas_afectadas: lineas,
      bases_afectadas: bases,
      colores_afectados: colores,
      productos_afectados: productos,
    };
  }

  async reactivar(id: number): Promise<ResultadoReactivacion> {
    const marca = await this.obtenerPorId(id);
    if (marca.estado === 'activo') {
      throw new AppError('La marca ya está activa', 400, 'MARCA_YA_ACTIVA');
    }
    await this.repo.cambiarEstado(id, 'activo');
    return { reactivado: true };
  }
}
