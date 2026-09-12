import type { FiltrosBusquedasDTO } from '../dtos/busquedas.dto';
import { hayFiltrosBusquedasActivos } from '../dtos/busquedas.dto';
import type {
  OpcionesFiltroBusquedas,
  PaginaBusquedas,
  ResumenBusquedas,
  TerminoBusqueda,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DE BÚSQUEDAS SIN RESULTADO
 * Ubicación: src/modules/m01-dashboardcatalogo/services/busquedas.mock.ts
 *
 * Refleja la maqueta "ADMIN 08 - Búsquedas sin resultado".
 * ==============================================================================
 */

const TOTAL_BUSQUEDAS_DEMO = 24;

export const OPCIONES_FILTRO_BUSQUEDAS_DEMO: OpcionesFiltroBusquedas = {
  categorias: [
    { valor: 'esmaltes', etiqueta: 'Esmaltes' },
    { valor: 'pinturas-especiales', etiqueta: 'Pinturas Especiales' },
    { valor: 'impermeabilizantes', etiqueta: 'Impermeabilizantes' },
    { valor: 'selladores', etiqueta: 'Selladores' },
    { valor: 'recubrimientos', etiqueta: 'Recubrimientos' },
    { valor: 'diluyentes', etiqueta: 'Diluyentes' },
    { valor: 'masillas', etiqueta: 'Masillas' },
  ],
};

export const RESUMEN_BUSQUEDAS_DEMO: ResumenBusquedas = {
  totalTerminos: { valor: 24, variacionPorcentaje: 20 },
  masRepetido: { termino: 'esmalte negro mate', frecuencia: 18 },
  ultimaBusqueda: { termino: 'impermeabilizante terraza', fechaHora: '2025-05-27T10:24:00-05:00' },
  oportunidadesDetectadas: { valor: 18, variacionPorcentaje: 28 },
};

export const BUSQUEDAS_DEMO: TerminoBusqueda[] = [
  { id: 'bsq-01', termino: 'esmalte negro mate', frecuencia: 18, ultimaBusqueda: '2025-05-27T10:24:00-05:00', posibleCategoria: 'Esmaltes', accionSugerida: 'crear_producto', estado: 'pendiente' },
  { id: 'bsq-02', termino: 'pintura tráfico', frecuencia: 12, ultimaBusqueda: '2025-05-26T16:42:00-05:00', posibleCategoria: 'Pinturas Especiales', accionSugerida: 'crear_producto', estado: 'pendiente' },
  { id: 'bsq-03', termino: 'impermeabilizante terraza', frecuencia: 11, ultimaBusqueda: '2025-05-26T14:11:00-05:00', posibleCategoria: 'Impermeabilizantes', accionSugerida: 'crear_producto', estado: 'pendiente' },
  { id: 'bsq-04', termino: 'pintura para piscinas', frecuencia: 8, ultimaBusqueda: '2025-05-25T18:20:00-05:00', posibleCategoria: 'Pinturas Especiales', accionSugerida: 'crear_producto', estado: 'revisado' },
  { id: 'bsq-05', termino: 'sellador para madera', frecuencia: 7, ultimaBusqueda: '2025-05-24T09:32:00-05:00', posibleCategoria: 'Selladores', accionSugerida: 'agregar_sinonimo', estado: 'atendido' },
  { id: 'bsq-06', termino: 'pintura termica', frecuencia: 6, ultimaBusqueda: '2025-05-24T11:05:00-05:00', posibleCategoria: 'Pinturas Especiales', accionSugerida: 'crear_producto', estado: 'pendiente' },
  { id: 'bsq-07', termino: 'antideslizante piso', frecuencia: 5, ultimaBusqueda: '2025-05-23T17:48:00-05:00', posibleCategoria: 'Recubrimientos', accionSugerida: 'agregar_sinonimo', estado: 'revisado' },
  { id: 'bsq-08', termino: 'pintura epóxica', frecuencia: 5, ultimaBusqueda: '2025-05-23T10:19:00-05:00', posibleCategoria: 'Pinturas Especiales', accionSugerida: 'crear_producto', estado: 'pendiente' },
  { id: 'bsq-09', termino: 'diluyente poliuretano', frecuencia: 4, ultimaBusqueda: '2025-05-22T16:21:00-05:00', posibleCategoria: 'Diluyentes', accionSugerida: 'crear_producto', estado: 'atendido' },
  { id: 'bsq-10', termino: 'masilla acrilica exterior', frecuencia: 4, ultimaBusqueda: '2025-05-21T15:37:00-05:00', posibleCategoria: 'Masillas', accionSugerida: 'agregar_sinonimo', estado: 'revisado' },
];

function pasaFrecuencia(frecuencia: number, filtro: FiltrosBusquedasDTO['frecuencia']): boolean {
  switch (filtro) {
    case 'alta':
      return frecuencia >= 10;
    case 'media':
      return frecuencia >= 4 && frecuencia <= 9;
    case 'baja':
      return frecuencia <= 3;
    default:
      return true;
  }
}

export function consultarBusquedasDemo(filtros: FiltrosBusquedasDTO): PaginaBusquedas {
  const q = filtros.busqueda.trim().toLowerCase();

  const filtrados = BUSQUEDAS_DEMO.filter((b) => {
    if (q && !b.termino.toLowerCase().includes(q)) return false;
    if (!pasaFrecuencia(b.frecuencia, filtros.frecuencia)) return false;
    return true;
  });

  const total = hayFiltrosBusquedasActivos(filtros) ? filtrados.length : TOTAL_BUSQUEDAS_DEMO;
  const totalPaginas = Math.max(1, Math.ceil(total / filtros.porPagina));
  const inicio = (filtros.pagina - 1) * filtros.porPagina;

  return {
    items: filtrados.slice(inicio, inicio + filtros.porPagina),
    total,
    pagina: filtros.pagina,
    porPagina: filtros.porPagina,
    totalPaginas,
  };
}
