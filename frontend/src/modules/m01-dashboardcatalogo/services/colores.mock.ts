import type { FiltrosColoresDTO } from '../dtos/colores.dto';
import { hayFiltrosColoresActivos } from '../dtos/colores.dto';
import type {
  ColorListado,
  FamiliaCromatica,
  OpcionesFiltroColores,
  PaginaColores,
  ResumenColores,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DE GESTIÓN DE COLORES
 * Ubicación: src/modules/m01-dashboardcatalogo/services/colores.mock.ts
 *
 * Refleja la maqueta "ADMIN 07 - Colores". Los `hex` son la representación
 * visual derivada del valor CIELAB (RF-CAT-05-02); aquí, valores de ejemplo.
 * ==============================================================================
 */

const TOTAL_COLORES_DEMO = 248;

export const FAMILIAS_CROMATICAS_DEMO: FamiliaCromatica[] = [
  { clave: 'rojos', nombre: 'Rojos', hex: '#D62828', total: 28 },
  { clave: 'naranjas', nombre: 'Naranjas', hex: '#FB8C00', total: 18 },
  { clave: 'amarillos', nombre: 'Amarillos', hex: '#F4C430', total: 24 },
  { clave: 'verdes', nombre: 'Verdes', hex: '#43A047', total: 32 },
  { clave: 'azules', nombre: 'Azules', hex: '#1E88E5', total: 46 },
  { clave: 'violetas', nombre: 'Violetas', hex: '#8E24AA', total: 20 },
  { clave: 'marrones', nombre: 'Marrones', hex: '#6D4C41', total: 18 },
  { clave: 'grises', nombre: 'Grises', hex: '#9E9E9E', total: 36 },
  { clave: 'blancos', nombre: 'Blancos', hex: '#F5F5F5', total: 12 },
  { clave: 'negros', nombre: 'Negros', hex: '#212121', total: 8 },
];

export const OPCIONES_FILTRO_COLORES_DEMO: OpcionesFiltroColores = {
  marcas: [
    { valor: 'viniltex-advanced', etiqueta: 'Viniltex Advanced' },
    { valor: 'pintuclic-pro', etiqueta: 'PintuClic Pro' },
    { valor: 'taladro-20v', etiqueta: 'Taladro Inalámbrico 20V' },
  ],
  familias: FAMILIAS_CROMATICAS_DEMO.map((f) => ({ valor: f.clave, etiqueta: f.nombre })),
};

export const RESUMEN_COLORES_DEMO: ResumenColores = {
  totalColores: { valor: 248, variacionPorcentaje: 12 },
  coloresActivos: { valor: 218, variacionPorcentaje: 8 },
  familiasCromaticas: { valor: 10 },
};

export const COLORES_DEMO: ColorListado[] = [
  { id: 'col-ap-001', nombre: 'Amarillo Profundo', codigo: 'AP-001', marca: 'Viniltex Advanced', familiaClave: 'amarillos', familiaNombre: 'Amarillos', valorCromatico: '#F4C430', estado: 'publicado' },
  { id: 'col-bn-001', nombre: 'Blanco Nieve', codigo: 'BN-001', marca: 'PintuClic Pro', familiaClave: 'blancos', familiaNombre: 'Blancos', valorCromatico: '#F8F8F8', estado: 'publicado' },
  { id: 'col-rc-015', nombre: 'Rojo Carmesí', codigo: 'RC-015', marca: 'Viniltex Advanced', familiaClave: 'rojos', familiaNombre: 'Rojos', valorCromatico: '#D62828', estado: 'publicado' },
  { id: 'col-ao-012', nombre: 'Azul Océano', codigo: 'AO-012', marca: 'Viniltex Advanced', familiaClave: 'azules', familiaNombre: 'Azules', valorCromatico: '#0077B6', estado: 'publicado' },
  { id: 'col-vo-008', nombre: 'Verde Olivo', codigo: 'VO-008', marca: 'PintuClic Pro', familiaClave: 'verdes', familiaNombre: 'Verdes', valorCromatico: '#556B2F', estado: 'publicado' },
  { id: 'col-gm-003', nombre: 'Gris Moderno', codigo: 'GM-003', marca: 'Viniltex Advanced', familiaClave: 'grises', familiaNombre: 'Grises', valorCromatico: '#6C757D', estado: 'publicado' },
  { id: 'col-ce-020', nombre: 'Café Espresso', codigo: 'CE-020', marca: 'Taladro Inalámbrico 20V', familiaClave: 'marrones', familiaNombre: 'Marrones', valorCromatico: '#5C4033', estado: 'borrador' },
  { id: 'col-vr-011', nombre: 'Violeta Real', codigo: 'VR-011', marca: 'PintuClic Pro', familiaClave: 'violetas', familiaNombre: 'Violetas', valorCromatico: '#7B1FA2', estado: 'publicado' },
  { id: 'col-na-006', nombre: 'Naranja Atardecer', codigo: 'NA-006', marca: 'Viniltex Advanced', familiaClave: 'naranjas', familiaNombre: 'Naranjas', valorCromatico: '#FB8C00', estado: 'publicado' },
  { id: 'col-ni-001', nombre: 'Negro Intenso', codigo: 'NI-001', marca: 'PintuClic Pro', familiaClave: 'negros', familiaNombre: 'Negros', valorCromatico: '#212121', estado: 'publicado' },
];

export function consultarColoresDemo(filtros: FiltrosColoresDTO): PaginaColores {
  const q = filtros.busqueda.trim().toLowerCase();

  const filtrados = COLORES_DEMO.filter((c) => {
    if (q && !`${c.nombre} ${c.codigo ?? ''}`.toLowerCase().includes(q)) return false;
    if (filtros.familiaClave && c.familiaClave !== filtros.familiaClave) return false;
    if (filtros.estado && c.estado !== filtros.estado) return false;
    return true;
  });

  const total = hayFiltrosColoresActivos(filtros) ? filtrados.length : TOTAL_COLORES_DEMO;
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
