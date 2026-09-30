import { apiClient } from '@/core/api/axios';
import type {
  FiltrosBusquedaFrontend,
  FacetasBusquedaFrontend,
  PaginaBusquedaFrontend,
  EstadisticaBusquedaSinResultado,
} from '../interfaces/busqueda.interface';

const BASE = '/busqueda';

function formatearParametros(filtros: FiltrosBusquedaFrontend): Record<string, string | number | undefined> {
  const params: Record<string, string | number | undefined> = {};

  if (filtros.q && filtros.q.trim()) params.q = filtros.q.trim();
  if (filtros.categoria !== undefined) params.categoria = filtros.categoria;
  if (filtros.subcategoria !== undefined) params.subcategoria = filtros.subcategoria;
  if (filtros.marca && filtros.marca.length) params.marca = filtros.marca.join(',');
  if (filtros.linea && filtros.linea.length) params.linea = filtros.linea.join(',');
  if (filtros.resina && filtros.resina.length) params.resina = filtros.resina.join(',');
  if (filtros.color && filtros.color.length) params.color = filtros.color.join(',');
  if (filtros.presentacion && filtros.presentacion.length) params.presentacion = filtros.presentacion.join(',');
  if (filtros.precio_min !== undefined && filtros.precio_min > 0) params.precio_min = filtros.precio_min;
  if (filtros.precio_max !== undefined && filtros.precio_max > 0) params.precio_max = filtros.precio_max;
  if (filtros.orden) params.orden = filtros.orden;
  if (filtros.pagina) params.pagina = filtros.pagina;
  if (filtros.limite) params.limite = filtros.limite;

  return params;
}

export const BusquedaService = {
  /**
   * HU-BUS-01 / HU-BUS-02 / HU-BUS-03 / HU-BUS-05:
   * Búsqueda en servidor tolerante a acentos y errores tipográficos con filtros y orden.
   */
  async buscar(filtros: FiltrosBusquedaFrontend = {}): Promise<PaginaBusquedaFrontend> {
    const params = formatearParametros(filtros);
    const { data } = await apiClient.get<{ success: boolean; data: PaginaBusquedaFrontend }>(
      `${BASE}/productos`,
      { params }
    );
    return data.data;
  },

  /**
   * HU-BUS-02:
   * Obtiene los valores de filtro con conteo de coincidencias según el término y filtros activos.
   */
  async facetas(filtros: FiltrosBusquedaFrontend = {}): Promise<FacetasBusquedaFrontend> {
    const params = formatearParametros(filtros);
    const { data } = await apiClient.get<{ success: boolean; data: FacetasBusquedaFrontend }>(
      `${BASE}/facetas`,
      { params }
    );
    return data.data;
  },

  /**
   * HU-BUS-06:
   * Obtiene las estadísticas de términos buscados sin resultado (requiere sesión admin).
   */
  async estadisticasSinResultado(periodo: 'diario' | 'semanal' | 'mensual' | 'anual' = 'mensual'): Promise<EstadisticaBusquedaSinResultado[]> {
    const { data } = await apiClient.get<{ success: boolean; data: EstadisticaBusquedaSinResultado[] }>(
      `${BASE}/estadisticas/sin-resultado`,
      { params: { periodo } }
    );
    return data.data;
  },
};
