import type { FiltrosProductosDTO } from '../dtos/productos.dto';
import { hayFiltrosActivos } from '../dtos/productos.dto';
import { IMAGEN_PRODUCTO_DEMO } from '../assets/imagenes-catalogo';
import type {
  OpcionesFiltroProductos,
  PaginaProductos,
  ProductoListado,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL LISTADO DE PRODUCTOS
 * Ubicación: src/modules/m01-dashboardcatalogo/services/productos.mock.ts
 *
 * Semilla que refleja la maqueta "ADMIN 02 - Productos · Listado". El store la
 * usa como respaldo mientras el backend de M01 no expone
 * `GET /api/catalogo/productos`. `consultarProductosDemo` reproduce el filtrado,
 * ordenamiento y paginación en memoria para que la vista sea navegable.
 * ==============================================================================
 */

export const OPCIONES_FILTRO_DEMO: OpcionesFiltroProductos = {
  categorias: [
    { valor: 'pinturas-interiores', etiqueta: 'Pinturas interiores' },
    { valor: 'pinturas-exteriores', etiqueta: 'Pinturas exteriores' },
    { valor: 'herramientas', etiqueta: 'Herramientas' },
    { valor: 'accesorios', etiqueta: 'Accesorios' },
    { valor: 'impermeabilizantes', etiqueta: 'Impermeabilizantes' },
  ],
  marcas: [
    { valor: 'pintuco', etiqueta: 'Pintuco' },
    { valor: '3m', etiqueta: '3M' },
    { valor: 'dewalt', etiqueta: 'DeWalt' },
    { valor: 'eler', etiqueta: 'Eler' },
  ],
  lineas: [
    { valor: 'viniltex', etiqueta: 'Viniltex' },
    { valor: 'profesional', etiqueta: 'Profesional' },
    { valor: 'uso-general', etiqueta: 'Uso general' },
    { valor: '20v-max', etiqueta: '20V MAX' },
    { valor: 'premium', etiqueta: 'Premium' },
    { valor: 'elertex', etiqueta: 'Elertex' },
  ],
};

/** Total ilustrativo del catálogo cuando no hay filtros (como en la maqueta). */
const TOTAL_CATALOGO_DEMO = 248;

export const PRODUCTOS_DEMO: ProductoListado[] = [
  {
    id: 'prd-001',
    sku: 'VIN-ADV-001',
    nombre: 'Viniltex Advanced',
    imagenUrl: null,
    marca: 'Pintuco',
    categoria: 'Pinturas interiores',
    linea: 'Viniltex',
    claseColor: 'entonable',
    totalVariantes: 12,
    estado: 'publicado',
    actualizadoEn: '2025-05-27T10:24:00-05:00',
    actualizadoPor: 'Laura Gómez',
  },
  {
    id: 'prd-002',
    sku: 'BRO-PRM-003',
    nombre: 'Brocha Premium 3"',
    imagenUrl: null,
    marca: 'Pintuco',
    categoria: 'Herramientas',
    linea: 'Profesional',
    claseColor: 'sin_color',
    totalVariantes: 3,
    estado: 'publicado',
    actualizadoEn: '2025-05-27T09:18:00-05:00',
    actualizadoPor: 'Carlos Álvarez',
  },
  {
    id: 'prd-003',
    sku: 'CIN-ENM-001',
    nombre: 'Cinta de Enmascarar',
    imagenUrl: null,
    marca: '3M',
    categoria: 'Accesorios',
    linea: 'Uso general',
    claseColor: 'sin_color',
    totalVariantes: 2,
    estado: 'borrador',
    actualizadoEn: '2025-05-26T16:42:00-05:00',
    actualizadoPor: 'María Torres',
  },
  {
    id: 'prd-004',
    sku: 'ROD-PRO-009',
    nombre: 'Rodillo Profesional 9"',
    imagenUrl: null,
    marca: 'Pintuco',
    categoria: 'Herramientas',
    linea: 'Profesional',
    claseColor: 'sin_color',
    totalVariantes: 5,
    estado: 'publicado',
    actualizadoEn: '2025-05-26T14:11:00-05:00',
    actualizadoPor: 'Juan Pérez',
  },
  {
    id: 'prd-005',
    sku: 'TAL-20V-001',
    nombre: 'Taladro Inalámbrico 20V',
    imagenUrl: null,
    marca: 'DeWalt',
    categoria: 'Herramientas',
    linea: '20V MAX',
    claseColor: 'sin_color',
    totalVariantes: 1,
    estado: 'inactivo',
    actualizadoEn: '2025-05-26T11:03:00-05:00',
    actualizadoPor: 'Laura Gómez',
  },
  {
    id: 'prd-006',
    sku: 'PIN-ACR-001',
    nombre: 'Pintura Acrílica Premium',
    imagenUrl: null,
    marca: 'Pintuco',
    categoria: 'Pinturas exteriores',
    linea: 'Premium',
    claseColor: 'entonable',
    totalVariantes: 18,
    estado: 'publicado',
    actualizadoEn: '2025-05-25T18:20:00-05:00',
    actualizadoPor: 'Carlos Álvarez',
  },
  {
    id: 'prd-007',
    sku: 'VIN-TRA-001',
    nombre: 'Viniltex Tradicional',
    imagenUrl: null,
    marca: 'Pintuco',
    categoria: 'Pinturas interiores',
    linea: 'Viniltex',
    claseColor: 'entonable',
    totalVariantes: 8,
    estado: 'borrador',
    actualizadoEn: '2025-05-25T10:15:00-05:00',
    actualizadoPor: 'María Torres',
  },
  {
    id: 'prd-008',
    sku: 'IMP-ELR-001',
    nombre: 'Impermeabilizante Eler',
    imagenUrl: null,
    marca: 'Eler',
    categoria: 'Impermeabilizantes',
    linea: 'Elertex',
    claseColor: 'colores_fijos',
    totalVariantes: 4,
    estado: 'publicado',
    actualizadoEn: '2025-05-24T09:32:00-05:00',
    actualizadoPor: 'Juan Pérez',
  },
];

// Miniatura de la maqueta "ADMIN 02" (RF-CAT-07-01): ilustración plana por
// producto hasta que el backend entregue la foto real optimizada.
for (const producto of PRODUCTOS_DEMO) {
  producto.imagenUrl = IMAGEN_PRODUCTO_DEMO[producto.id] ?? null;
}

function coincideOpcion(valorFiltro: string | null, textoFila: string | null): boolean {
  if (valorFiltro === null) return true;
  if (textoFila === null) return false;
  const normalizado = textoFila
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return normalizado === valorFiltro;
}

/**
 * Reproduce en memoria la respuesta del backend: filtra, ordena y pagina la
 * semilla local según los filtros indicados.
 */
export function consultarProductosDemo(filtros: FiltrosProductosDTO): PaginaProductos {
  const termino = filtros.busqueda.trim().toLowerCase();

  const filtrados = PRODUCTOS_DEMO.filter((p) => {
    if (termino && !`${p.nombre} ${p.sku}`.toLowerCase().includes(termino)) return false;
    if (!coincideOpcion(filtros.categoriaId, p.categoria)) return false;
    if (!coincideOpcion(filtros.marcaId, p.marca)) return false;
    if (!coincideOpcion(filtros.lineaId, p.linea)) return false;
    if (filtros.estado && p.estado !== filtros.estado) return false;
    if (filtros.claseColor && p.claseColor !== filtros.claseColor) return false;
    return true;
  });

  const ordenados = [...filtrados].sort((a, b) => {
    switch (filtros.orden) {
      case 'nombre_asc':
        return a.nombre.localeCompare(b.nombre, 'es');
      case 'nombre_desc':
        return b.nombre.localeCompare(a.nombre, 'es');
      case 'variantes_desc':
        return b.totalVariantes - a.totalVariantes;
      case 'recientes':
      default:
        return b.actualizadoEn.localeCompare(a.actualizadoEn);
    }
  });

  // Sin filtros mostramos el total ilustrativo de la maqueta (248 / 31 páginas).
  const total = hayFiltrosActivos(filtros) ? ordenados.length : TOTAL_CATALOGO_DEMO;
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
