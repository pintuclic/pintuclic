import { BusquedaRepository } from '../repositories/busqueda.repository';
import {
  PaginaBusqueda,
  FiltrosBusqueda,
  OrdenBusqueda,
  PeriodoEstadistica,
  TerminoSinResultado,
} from '../interfaces/m02.interfaces';

// Ventana en días por periodo para la analítica de HU-BUS-06 (RF-BUS-06-02).
const DIAS_POR_PERIODO: Record<PeriodoEstadistica, number> = { diario: 1, semanal: 7, mensual: 30, anual: 365 };
const MS_POR_DIA = 24 * 60 * 60 * 1000;

// ponytail: criterio por defecto fijo (`relevancia`). RF-BUS-03-01 lo llama
// "configurable"; moverlo a configuración del sistema cuando exista ese módulo.
const ORDEN_POR_DEFECTO: OrdenBusqueda = 'relevancia';

// ==============================================================================
// M02 - SERVICIO DE BÚSQUEDA Y FILTROS (HU-BUS-01, HU-BUS-02)
// Normaliza el término (vacío => catálogo completo, RF-BUS-01-01), calcula la
// paginación (HU-BUS-05) y delega el matching y los filtros al repositorio.
// No exige autenticación (RF-BUS-01-02 / CA-BUS-01-04): es un caso de uso público.
// La validación del rango de precio (min ≤ max) la resuelve el DTO (CA-BUS-02-06).
// ==============================================================================

const LIMITE_POR_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

export class BusquedaService {
  constructor(private readonly repo: BusquedaRepository) {}

  async buscar(opciones: {
    termino?: string;
    filtros?: FiltrosBusqueda;
    orden?: OrdenBusqueda;
    pagina?: number;
    limite?: number;
  }): Promise<PaginaBusqueda> {
    const termino = opciones.termino && opciones.termino.trim() !== '' ? opciones.termino.trim() : undefined;
    const pagina = opciones.pagina && opciones.pagina > 0 ? Math.floor(opciones.pagina) : 1;
    const limite = Math.min(
      opciones.limite && opciones.limite > 0 ? Math.floor(opciones.limite) : LIMITE_POR_DEFECTO,
      LIMITE_MAXIMO
    );
    const offset = (pagina - 1) * limite;
    const filtros = opciones.filtros;
    const orden = opciones.orden ?? ORDEN_POR_DEFECTO;

    const [items, total] = await Promise.all([
      this.repo.buscar(termino, filtros, orden, limite, offset),
      this.repo.contar(termino, filtros),
    ]);

    // HU-BUS-06: registrar el término cuando una búsqueda con texto no arroja
    // resultados. La analítica nunca debe tumbar la búsqueda (RF-BUS-01-06), por
    // eso se aísla en try/catch. Sin identidad de usuario (M20 / CA-BUS-06-02).
    if (termino && total === 0) {
      try {
        await this.repo.registrarSinResultado(termino.toLowerCase());
      } catch (error) {
        console.error('[M02][HU-BUS-06] No se pudo registrar la búsqueda sin resultado:', error);
      }
    }

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
      // Páginas numeradas (RF-BUS-05-02). 0 cuando no hay resultados.
      total_paginas: Math.ceil(total / limite),
    };
  }

  /**
   * Estadística de búsquedas sin resultado en la ventana pedida (HU-BUS-06,
   * RF-BUS-06-02). Devuelve los términos agregados por frecuencia, sin identidad
   * de usuario (CA-BUS-06-02). La autorización («Consultar estadísticas») se
   * exige en la ruta vía guardas de M20 (CA-BUS-06-03).
   */
  async estadisticasSinResultado(periodo: PeriodoEstadistica): Promise<TerminoSinResultado[]> {
    const desde = new Date(Date.now() - DIAS_POR_PERIODO[periodo] * MS_POR_DIA);
    return this.repo.listarSinResultado(desde);
  }
}
