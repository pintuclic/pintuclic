import type { FiltrosLineasDTO } from '../dtos/lineas.dto';
import { hayFiltrosLineasActivos } from '../dtos/lineas.dto';
import type {
  LineaListado,
  PaginaLineas,
  ResumenLineas,
  OpcionesFiltroLineas,
} from '../interfaces';
import { IMAGEN_PRODUCTO_DEMO } from '../assets/imagenes-catalogo';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DE LÍNEAS COMERCIALES
 * Ubicación: src/modules/m01-dashboardcatalogo/services/lineas.mock.ts
 *
 * Refleja la maqueta "ADMIN 15 - Listado de líneas comerciales".
 * `consultarLineasDemo` reproduce búsqueda, filtros y paginación en memoria
 * mientras el backend de M01 no expone los endpoints reales.
 * ==============================================================================
 */

const TOTAL_LINEAS_DEMO = 28;

export const RESUMEN_LINEAS_DEMO: ResumenLineas = {
  lineasActivas: { valor: 24, total: 28 },
  marcasAsociadas: { valor: 12 },
  productosVinculados: { valor: 248 },
  reglasDependientes: { valor: 18 },
};

export const OPCIONES_FILTRO_LINEAS_DEMO: OpcionesFiltroLineas = {
  marcas: [
    { valor: 'pintuco', etiqueta: 'Pintuco' },
    { valor: 'dewalt', etiqueta: 'DeWalt' },
    { valor: '3m', etiqueta: '3M' },
    { valor: 'eler', etiqueta: 'Eler' },
  ],
  segmentos: [
    { valor: 'premium', etiqueta: 'Premium' },
    { valor: 'profesional', etiqueta: 'Profesional' },
    { valor: 'estandar', etiqueta: 'Estándar' },
    { valor: 'economica', etiqueta: 'Económica' },
  ],
};

export const LINEAS_DEMO: LineaListado[] = [
  { id: 'viniltex-advanced', nombre: 'Viniltex Advanced', descripcionCorta: 'Línea premium interior', imagenUrl: null, marca: 'Pintuco', gamaComercial: 'Premium', productosAsociados: 42, estado: 'activa', actualizadoEn: '2025-05-27T10:24:00-05:00', actualizadoPor: 'Laura Gómez' },
  { id: 'koraza', nombre: 'Koraza', descripcionCorta: 'Protección exterior', imagenUrl: null, marca: 'Pintuco', gamaComercial: 'Profesional', productosAsociados: 36, estado: 'activa', actualizadoEn: '2025-05-27T09:18:00-05:00', actualizadoPor: 'Carlos Álvarez' },
  { id: 'aqualock', nombre: 'Aqualock', descripcionCorta: 'Impermeabilizantes', imagenUrl: null, marca: 'Pintuco', gamaComercial: 'Profesional', productosAsociados: 28, estado: 'activa', actualizadoEn: '2025-05-26T16:42:00-05:00', actualizadoPor: 'María Torres' },
  { id: 'osel', nombre: 'Osel', descripcionCorta: 'Esmaltes y barnices', imagenUrl: null, marca: 'Pintuco', gamaComercial: 'Estándar', productosAsociados: 21, estado: 'activa', actualizadoEn: '2025-05-26T14:11:00-05:00', actualizadoPor: 'Juan Pérez' },
  { id: 'pro-4000', nombre: 'Pro 4000', descripcionCorta: 'Línea contratista', imagenUrl: null, marca: 'Pintuco', gamaComercial: 'Económica', productosAsociados: 18, estado: 'inactiva', actualizadoEn: '2025-05-26T11:03:00-05:00', actualizadoPor: 'Laura Gómez' },
  { id: 'dewalt-herramientas', nombre: 'DeWalt Herramientas', descripcionCorta: 'Herramientas eléctricas', imagenUrl: null, marca: 'DeWalt', gamaComercial: 'Profesional', productosAsociados: 15, estado: 'activa', actualizadoEn: '2025-05-25T18:20:00-05:00', actualizadoPor: 'Carlos Álvarez' },
  { id: '3m-accesorios', nombre: '3M Accesorios', descripcionCorta: 'Cintas y adhesivos', imagenUrl: null, marca: '3M', gamaComercial: 'Estándar', productosAsociados: 12, estado: 'activa', actualizadoEn: '2025-05-25T10:15:00-05:00', actualizadoPor: 'María Torres' },
  { id: 'eler-impermeabilizantes', nombre: 'Eler Impermeabilizantes', descripcionCorta: 'Soluciones de construcción', imagenUrl: null, marca: 'Eler', gamaComercial: 'Profesional', productosAsociados: 8, estado: 'pausada', actualizadoEn: '2025-05-24T09:32:00-05:00', actualizadoPor: 'Juan Pérez' },
];

// Miniatura de la maqueta "ADMIN 15": reutiliza las fotos de producto (tarros)
// mientras el backend no entrega el asset propio de cada línea.
const IMG_LINEA_DEMO: Record<string, string> = {
  'viniltex-advanced': IMAGEN_PRODUCTO_DEMO['prd-001'],
  koraza: IMAGEN_PRODUCTO_DEMO['prd-007'],
  aqualock: IMAGEN_PRODUCTO_DEMO['prd-008'],
  osel: IMAGEN_PRODUCTO_DEMO['prd-006'],
  'pro-4000': IMAGEN_PRODUCTO_DEMO['prd-001'],
  'dewalt-herramientas': IMAGEN_PRODUCTO_DEMO['prd-005'],
  '3m-accesorios': IMAGEN_PRODUCTO_DEMO['prd-003'],
  'eler-impermeabilizantes': IMAGEN_PRODUCTO_DEMO['prd-008'],
};
for (const linea of LINEAS_DEMO) {
  linea.imagenUrl = IMG_LINEA_DEMO[linea.id] ?? null;
}

/** Normaliza texto para comparar (minúsculas, sin tildes). */
function plano(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function consultarLineasDemo(filtros: FiltrosLineasDTO): PaginaLineas {
  const q = plano(filtros.busqueda.trim());

  const filtrados = LINEAS_DEMO.filter((l) => {
    if (q && !plano(`${l.nombre} ${l.descripcionCorta} ${l.marca} ${l.gamaComercial}`).includes(q)) {
      return false;
    }
    if (filtros.marca && plano(l.marca) !== plano(filtros.marca)) return false;
    if (filtros.estado && l.estado !== filtros.estado) return false;
    if (filtros.segmento && plano(l.gamaComercial) !== plano(filtros.segmento)) return false;
    return true;
  });

  switch (filtros.orden) {
    case 'nombre_asc':
      filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    case 'nombre_desc':
      filtrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
      break;
    case 'productos_desc':
      filtrados.sort((a, b) => b.productosAsociados - a.productosAsociados);
      break;
    // 'recientes': se conserva el orden de la semilla (ya viene por fecha desc).
  }

  const total = hayFiltrosLineasActivos(filtros) ? filtrados.length : TOTAL_LINEAS_DEMO;
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
