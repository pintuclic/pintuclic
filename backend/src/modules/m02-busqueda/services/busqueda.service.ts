import { BusquedaRepository } from '../repositories/busqueda.repository';
import { PaginaBusqueda } from '../interfaces/m02.interfaces';

// ==============================================================================
// M02 - SERVICIO DE BÚSQUEDA (HU-BUS-01)
// Normaliza el término (vacío => catálogo completo, RF-BUS-01-01), calcula la
// paginación (HU-BUS-05) y delega el matching tolerante a errores al repositorio.
// No exige autenticación (RF-BUS-01-02 / CA-BUS-01-04): es un caso de uso público.
// ==============================================================================

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

export class BusquedaService {
  constructor(private readonly repo: BusquedaRepository) {}

  async buscar(opciones: { termino?: string; pagina?: number; limite?: number }): Promise<PaginaBusqueda> {
    const termino = opciones.termino && opciones.termino.trim() !== '' ? opciones.termino.trim() : undefined;
    const pagina = opciones.pagina && opciones.pagina > 0 ? Math.floor(opciones.pagina) : 1;
    const limite = Math.min(
      opciones.limite && opciones.limite > 0 ? Math.floor(opciones.limite) : LIMITE_POR_DEFECTO,
      LIMITE_MAXIMO
    );
    const offset = (pagina - 1) * limite;

    const [items, total] = await Promise.all([this.repo.buscar(termino, limite, offset), this.repo.contar(termino)]);

    return {
      items: items.map((p) => ({
        id_producto: p.id_producto,
        nombre: p.nombre,
        id_marca: p.id_marca,
        clase_color: p.clase_color,
      })),
      total,
      pagina,
      limite,
    };
  }
}
