import { apiClient } from '@/core/api/axios';
import type {
  ApiResponse,
  PaginaBusquedas,
  OpcionesFiltroBusquedas,
  ResumenBusquedas,
  TerminoBusqueda,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 / M02 - SERVICIO HTTP CLIENTE (BÚSQUEDAS SIN RESULTADO - HU-BUS-06)
 * Ubicación: src/modules/m01-dashboardcatalogo/services/busquedas.service.ts
 *
 * Conectado con el endpoint oficial de M02: /api/busqueda/estadisticas/sin-resultado.
 * Exige permiso «Consultar estadísticas» (M17) verificado en el servidor.
 * ==============================================================================
 */

export const BusquedasService = {
  /** GET /api/busqueda/estadisticas/sin-resultado — HU-BUS-06 */
  async listar(filtros?: { periodo?: string }): Promise<ApiResponse<PaginaBusquedas>> {
    const periodoMap: Record<string, 'diario' | 'semanal' | 'mensual' | 'anual'> = {
      '7d': 'semanal',
      '30d': 'mensual',
      '90d': 'anual',
      todo: 'anual',
    };
    const periodo = filtros?.periodo ? periodoMap[filtros.periodo] || 'mensual' : 'mensual';

    const { data } = await apiClient.get<
      ApiResponse<Array<{ termino: string; repeticiones: number | string; ultima_busqueda: string }>>
    >('/busqueda/estadisticas/sin-resultado', { params: { periodo } });

    const raw = data.data || [];
    const items: TerminoBusqueda[] = raw.map((item, idx) => ({
      id: String(idx + 1),
      termino: item.termino,
      frecuencia: Number(item.repeticiones),
      ultimaBusqueda: item.ultima_busqueda,
      posibleCategoria: 'Sin categorizar',
      accionSugerida: 'crear_producto',
      estado: 'pendiente',
    }));

    return {
      success: true,
      data: {
        items,
        total: items.length,
        pagina: 1,
        porPagina: Math.max(items.length, 10),
        totalPaginas: 1,
      },
    };
  },

  /** Opciones de filtrado auxiliar para la vista */
  async opcionesFiltro(): Promise<ApiResponse<OpcionesFiltroBusquedas>> {
    return { success: true, data: { categorias: [] } };
  },

  /** Indicadores calculados a partir de los datos reales del backend */
  async resumen(): Promise<ApiResponse<ResumenBusquedas>> {
    const { data } = await apiClient.get<
      ApiResponse<Array<{ termino: string; repeticiones: number | string; ultima_busqueda: string }>>
    >('/busqueda/estadisticas/sin-resultado');

    const lista = data.data || [];
    const total = lista.length;
    const masRepetido = lista.length > 0 ? lista[0] : { termino: '—', repeticiones: 0 };
    const ultima = lista.length > 0 ? lista[0] : { termino: '—', ultima_busqueda: new Date().toISOString() };

    return {
      success: true,
      data: {
        totalTerminos: { valor: total, variacionPorcentaje: 0 },
        masRepetido: { termino: masRepetido.termino, frecuencia: Number(masRepetido.repeticiones) },
        ultimaBusqueda: { termino: ultima.termino, fechaHora: ultima.ultima_busqueda },
        oportunidadesDetectadas: { valor: total, variacionPorcentaje: 0 },
      },
    };
  },
};
