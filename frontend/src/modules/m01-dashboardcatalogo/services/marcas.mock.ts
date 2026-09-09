import type { FiltrosMarcasDTO } from '../dtos/marcas.dto';
import { hayFiltrosMarcasActivos } from '../dtos/marcas.dto';
import type { MarcaListado, PaginaMarcas, ResumenMarcas } from '../interfaces';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DE GESTIÓN DE MARCAS
 * Ubicación: src/modules/m01-dashboardcatalogo/services/marcas.mock.ts
 *
 * Refleja la maqueta "ADMIN 06 - Marcas". `consultarMarcasDemo` reproduce
 * búsqueda, filtro y paginación en memoria.
 * ==============================================================================
 */

const TOTAL_MARCAS_DEMO = 28;

export const RESUMEN_MARCAS_DEMO: ResumenMarcas = {
  marcasActivas: { valor: 28, variacionPorcentaje: 12 },
  totalProductos: { valor: 1392, variacionPorcentaje: 8 },
  lineasProductos: { valor: 86, variacionPorcentaje: 6 },
  coloresDisponibles: { valor: 156, variacionPorcentaje: 4 },
};

export const MARCAS_DEMO: MarcaListado[] = [
  { id: 'pintuco', nombre: 'Pintuco', descripcionCorta: 'El color de la calidad', logoUrl: null, lineasAsociadas: 12, productos: 342, colores: 48, estado: 'activa' },
  { id: 'corona', nombre: 'Corona', descripcionCorta: 'Hogares que inspiran', logoUrl: null, lineasAsociadas: 8, productos: 218, colores: 36, estado: 'activa' },
  { id: 'sika', nombre: 'Sika', descripcionCorta: 'Construyendo confianza', logoUrl: null, lineasAsociadas: 6, productos: 124, colores: 22, estado: 'activa' },
  { id: 'viniltex', nombre: 'Viniltex', descripcionCorta: 'Pintura que perdura', logoUrl: null, lineasAsociadas: 5, productos: 180, colores: 28, estado: 'activa' },
  { id: '3m', nombre: '3M', descripcionCorta: 'Ciencia. Aplicada a la vida.', logoUrl: null, lineasAsociadas: 4, productos: 96, colores: 16, estado: 'activa' },
  { id: 'rust-oleum', nombre: 'Rust-Oleum', descripcionCorta: 'Protege y renueva', logoUrl: null, lineasAsociadas: 3, productos: 72, colores: 14, estado: 'inactiva' },
  { id: 'flex', nombre: 'Flex', descripcionCorta: 'Soluciones en pintura', logoUrl: null, lineasAsociadas: 4, productos: 68, colores: 12, estado: 'activa' },
  { id: 'tak', nombre: 'Tak', descripcionCorta: 'Innovación en cada obra', logoUrl: null, lineasAsociadas: 3, productos: 54, colores: 10, estado: 'inactiva' },
];

/** Líneas de ejemplo para el panel de edición (marca "Pintuco"). */
export const LINEAS_MARCA_DEMO: Record<string, string[]> = {
  pintuco: [
    'Pinturas interiores',
    'Pinturas exteriores',
    'Esmaltes',
    'Impermeabilizantes',
    'Maderas',
  ],
};

export function consultarMarcasDemo(filtros: FiltrosMarcasDTO): PaginaMarcas {
  const q = filtros.busqueda.trim().toLowerCase();

  const filtrados = MARCAS_DEMO.filter((m) => {
    if (q && !`${m.nombre} ${m.descripcionCorta}`.toLowerCase().includes(q)) return false;
    if (filtros.estado && m.estado !== filtros.estado) return false;
    return true;
  });

  const total = hayFiltrosMarcasActivos(filtros) ? filtrados.length : TOTAL_MARCAS_DEMO;
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
