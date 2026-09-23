import type { FiltrosVariantesDTO } from '../dtos/variantes.dto';
import { hayFiltrosVariantesActivos } from '../dtos/variantes.dto';
import type {
  OpcionesFiltroVariantes,
  PaginaVariantes,
  ResumenVariantes,
  VarianteListado,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL LISTADO DE VARIANTES
 * Ubicación: src/modules/m01-dashboardcatalogo/services/variantes.mock.ts
 *
 * Refleja la maqueta "ADMIN 04 - Variantes · Listado". `consultarVariantesDemo`
 * reproduce filtrado, ordenamiento y paginación en memoria.
 * ==============================================================================
 */

const TOTAL_VARIANTES_DEMO = 24;

export const OPCIONES_FILTRO_VARIANTES_DEMO: OpcionesFiltroVariantes = {
  productos: [
    { valor: 'viniltex-advanced', etiqueta: 'Viniltex Advanced' },
    { valor: 'taladro-20v', etiqueta: 'Taladro Inalámbrico 20V' },
    { valor: 'brocha-premium', etiqueta: 'Brocha Premium' },
    { valor: 'pintura-amarillo-profundo', etiqueta: 'Pintura Amarillo Profundo' },
    { valor: 'rodillo-profesional', etiqueta: 'Rodillo Profesional' },
  ],
  presentaciones: [
    { valor: '1-4-galon', etiqueta: '1/4 galón' },
    { valor: '1-galon', etiqueta: '1 galón' },
    { valor: '5-galones', etiqueta: '5 galones' },
    { valor: '1-unidad', etiqueta: '1 unidad' },
    { valor: '2-pulgadas', etiqueta: '2" (50 mm)' },
    { valor: '3-pulgadas', etiqueta: '3" (75 mm)' },
    { valor: '9-pulgadas', etiqueta: '9"' },
    { valor: '4-pulgadas', etiqueta: '4"' },
  ],
  marcas: [
    { valor: 'pintuclic', etiqueta: 'Pintu Clic' },
    { valor: 'pintuco', etiqueta: 'Pintuco' },
    { valor: 'dewalt', etiqueta: 'DeWalt' },
  ],
};

export const RESUMEN_VARIANTES_DEMO: ResumenVariantes = {
  activas: { valor: 18, variacionPorcentaje: 8 },
  sinStock: { valor: 3, variacionPorcentaje: 50 },
  borradores: { valor: 3, variacionPorcentaje: 0 },
};

export const VARIANTES_DEMO: VarianteListado[] = [
  { id: 'var-001', productoId: 'viniltex-advanced', productoNombre: 'Viniltex Advanced', marca: 'Pintu Clic', presentacion: '1/4 galón', presentacionVolumen: 0.25, base: 'Blanco', color: null, codigoProveedor: 'VIN-ADV-025', precio: 28900, existenciaReferencial: 36, estado: 'activo' },
  { id: 'var-002', productoId: 'viniltex-advanced', productoNombre: 'Viniltex Advanced', marca: 'Pintu Clic', presentacion: '1 galón', presentacionVolumen: 1, base: 'Blanco', color: null, codigoProveedor: 'VIN-ADV-100', precio: 89900, existenciaReferencial: 24, estado: 'activo' },
  { id: 'var-003', productoId: 'viniltex-advanced', productoNombre: 'Viniltex Advanced', marca: 'Pintu Clic', presentacion: '5 galones', presentacionVolumen: 5, base: 'Blanco', color: null, codigoProveedor: 'VIN-ADV-500', precio: 399900, existenciaReferencial: 8, estado: 'activo' },
  { id: 'var-004', productoId: 'taladro-20v', productoNombre: 'Taladro Inalámbrico 20V', marca: 'Pintu Clic', presentacion: '1 unidad', presentacionVolumen: 1, base: null, color: null, codigoProveedor: 'TAL-20V-001', precio: 359900, existenciaReferencial: 12, estado: 'activo' },
  { id: 'var-005', productoId: 'brocha-premium', productoNombre: 'Brocha Premium', marca: 'Pintu Clic', presentacion: '2" (50 mm)', presentacionVolumen: 2, base: null, color: null, codigoProveedor: 'BRO-050', precio: 12900, existenciaReferencial: 0, estado: 'activo' },
  { id: 'var-006', productoId: 'brocha-premium', productoNombre: 'Brocha Premium', marca: 'Pintu Clic', presentacion: '3" (75 mm)', presentacionVolumen: 3, base: null, color: null, codigoProveedor: 'BRO-075', precio: 16900, existenciaReferencial: 18, estado: 'activo' },
  { id: 'var-007', productoId: 'pintura-amarillo-profundo', productoNombre: 'Pintura Amarillo Profundo', marca: 'Pintu Clic', presentacion: '1 galón', presentacionVolumen: 1, base: null, color: 'Amarillo Profundo', codigoProveedor: 'AMA-PRO-100', precio: 92900, existenciaReferencial: 6, estado: 'borrador' },
  { id: 'var-008', productoId: 'pintura-amarillo-profundo', productoNombre: 'Pintura Amarillo Profundo', marca: 'Pintu Clic', presentacion: '5 galones', presentacionVolumen: 5, base: null, color: 'Amarillo Profundo', codigoProveedor: 'AMA-PRO-500', precio: 419900, existenciaReferencial: 0, estado: 'activo' },
  { id: 'var-009', productoId: 'rodillo-profesional', productoNombre: 'Rodillo Profesional', marca: 'Pintu Clic', presentacion: '9"', presentacionVolumen: 9, base: null, color: null, codigoProveedor: 'ROD-090', precio: 24900, existenciaReferencial: 31, estado: 'activo' },
  { id: 'var-010', productoId: 'rodillo-profesional', productoNombre: 'Rodillo Profesional', marca: 'Pintu Clic', presentacion: '4"', presentacionVolumen: 4, base: null, color: null, codigoProveedor: 'ROD-040', precio: 14900, existenciaReferencial: 3, estado: 'activo' },
];

function ordenar(a: VarianteListado, b: VarianteListado, filtros: FiltrosVariantesDTO): number {
  const dir = filtros.orden.direccion === 'asc' ? 1 : -1;
  switch (filtros.orden.campo) {
    case 'presentacion':
      return (a.presentacionVolumen - b.presentacionVolumen) * dir;
    case 'base':
      return (a.base ?? '').localeCompare(b.base ?? '', 'es') * dir;
    case 'codigo':
      return a.codigoProveedor.localeCompare(b.codigoProveedor, 'es') * dir;
    case 'precio':
      return (a.precio - b.precio) * dir;
    case 'existencia':
      return (a.existenciaReferencial - b.existenciaReferencial) * dir;
    case 'estado':
      return a.estado.localeCompare(b.estado, 'es') * dir;
    case 'producto':
    default:
      return a.productoNombre.localeCompare(b.productoNombre, 'es') * dir;
  }
}

export function consultarVariantesDemo(filtros: FiltrosVariantesDTO): PaginaVariantes {
  const termino = filtros.busqueda.trim().toLowerCase();

  const filtrados = VARIANTES_DEMO.filter((v) => {
    if (termino && !`${v.productoNombre} ${v.codigoProveedor}`.toLowerCase().includes(termino)) return false;
    if (filtros.estado && v.estado !== filtros.estado) return false;
    if (filtros.productoId && v.productoId !== filtros.productoId) return false;
    return true;
  });

  const ordenados = [...filtrados].sort((a, b) => ordenar(a, b, filtros));

  const total = hayFiltrosVariantesActivos(filtros) ? ordenados.length : TOTAL_VARIANTES_DEMO;
  const totalPaginas = Math.max(1, Math.ceil(total / filtros.porPagina));
  const inicio = (filtros.pagina - 1) * filtros.porPagina;

  return {
    items: ordenados.slice(inicio, inicio + filtros.porPagina),
    total,
    pagina: filtros.pagina,
    porPagina: filtros.porPagina,
    totalPaginas,
  };
}
