import type {
  CategoriaConHijos,
  DetalleCategoria,
  NodoCategoria,
} from '../interfaces';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DE CATEGORÍAS Y SUBCATEGORÍAS
 * Ubicación: src/modules/m01-dashboardcatalogo/services/categorias.mock.ts
 *
 * Refleja la maqueta "ADMIN 05 - Categorías y subcategorías".
 * `detalleCategoriaDemo(id)` arma el panel derecho a partir del árbol.
 * ==============================================================================
 */

interface SemillaCategoria {
  slug: string;
  nombre: string;
  descripcion: string;
  productos: number;
  subcategorias: { slug: string; nombre: string; productos: number }[];
}

const SEMILLA: SemillaCategoria[] = [
  {
    slug: 'pinturas',
    nombre: 'Pinturas',
    descripcion:
      'Productos para dar color, protección y acabado a tus espacios. Incluye pinturas para interiores, exteriores, esmaltes, barnices y más.',
    productos: 245,
    subcategorias: [
      { slug: 'pinturas-interiores', nombre: 'Pinturas Interiores', productos: 68 },
      { slug: 'pinturas-exteriores', nombre: 'Pinturas Exteriores', productos: 54 },
      { slug: 'esmaltes', nombre: 'Esmaltes', productos: 42 },
      { slug: 'barnices', nombre: 'Barnices', productos: 28 },
      { slug: 'pinturas-spray', nombre: 'Pinturas en Spray', productos: 31 },
      { slug: 'primarios-imprimantes', nombre: 'Primarios e Imprimantes', productos: 18 },
      { slug: 'accesorios-pintura', nombre: 'Accesorios de Pintura', productos: 24 },
    ],
  },
  {
    slug: 'herramientas',
    nombre: 'Herramientas',
    descripcion: 'Herramientas manuales, eléctricas y de medición para todo tipo de proyecto.',
    productos: 132,
    subcategorias: [
      { slug: 'herramientas-manuales', nombre: 'Herramientas Manuales', productos: 54 },
      { slug: 'herramientas-electricas', nombre: 'Herramientas Eléctricas', productos: 41 },
      { slug: 'herramientas-medicion', nombre: 'Herramientas de Medición', productos: 19 },
      { slug: 'accesorios-herramientas', nombre: 'Accesorios para Herramientas', productos: 18 },
    ],
  },
  {
    slug: 'construccion',
    nombre: 'Construcción',
    descripcion: 'Materiales para obra gris, acabados y sistemas livianos de construcción.',
    productos: 98,
    subcategorias: [
      { slug: 'cementos-morteros', nombre: 'Cementos y Morteros', productos: 27 },
      { slug: 'adhesivos-pegantes', nombre: 'Adhesivos y Pegantes', productos: 22 },
      { slug: 'drywall-superboard', nombre: 'Drywall y Superboard', productos: 18 },
      { slug: 'revestimientos', nombre: 'Revestimientos', productos: 16 },
      { slug: 'mallas-fibras', nombre: 'Mallas y Fibras', productos: 15 },
    ],
  },
  {
    slug: 'accesorios',
    nombre: 'Accesorios',
    descripcion: 'Complementos para aplicar pintura y preparar superficies.',
    productos: 76,
    subcategorias: [
      { slug: 'brochas-rodillos', nombre: 'Brochas y Rodillos', productos: 29 },
      { slug: 'bandejas-recipientes', nombre: 'Bandejas y Recipientes', productos: 14 },
      { slug: 'lijas-abrasivos', nombre: 'Lijas y Abrasivos', productos: 21 },
      { slug: 'cintas-enmascarado', nombre: 'Cintas y Enmascarado', productos: 12 },
    ],
  },
  {
    slug: 'impermeabilizantes',
    nombre: 'Impermeabilizantes',
    descripcion: 'Soluciones para proteger cubiertas, terrazas y muros de la humedad.',
    productos: 54,
    subcategorias: [
      { slug: 'impermeabilizantes-liquidos', nombre: 'Impermeabilizantes Líquidos', productos: 21 },
      { slug: 'mantos-asfalticos', nombre: 'Mantos Asfálticos', productos: 14 },
      { slug: 'selladores', nombre: 'Selladores', productos: 12 },
      { slug: 'aditivos', nombre: 'Aditivos', productos: 7 },
    ],
  },
];

export const ARBOL_CATEGORIAS_DEMO: CategoriaConHijos[] = SEMILLA.map((cat, i) => {
  const hijos: NodoCategoria[] = cat.subcategorias.map((sub, j) => ({
    id: sub.slug,
    nombre: sub.nombre,
    tipo: 'subcategoria',
    padreId: cat.slug,
    padreNombre: cat.nombre,
    nivel: 2,
    orden: j + 1,
    productosAsociados: sub.productos,
    estado: 'publicado',
  }));

  return {
    id: cat.slug,
    nombre: cat.nombre,
    tipo: 'categoria',
    padreId: null,
    padreNombre: null,
    nivel: 1,
    orden: i + 1,
    productosAsociados: cat.productos,
    estado: 'publicado',
    hijos,
  };
});

/** Detalle del panel derecho para una categoría raíz. */
export function detalleCategoriaDemo(id: string): DetalleCategoria | null {
  const cat = ARBOL_CATEGORIAS_DEMO.find((c) => c.id === id);
  const semilla = SEMILLA.find((s) => s.slug === id);
  if (!cat || !semilla) return null;

  const { hijos, ...nodo } = cat;

  return {
    categoria: nodo,
    descripcion: semilla.descripcion,
    totalProductos: cat.productosAsociados,
    totalSubcategorias: hijos.length,
    nivel: 1,
    ordenVisualizacion: cat.orden,
    elementos: [nodo, ...hijos],
  };
}

/** Primera categoría seleccionada por defecto al abrir la vista. */
export const CATEGORIA_INICIAL_DEMO = ARBOL_CATEGORIAS_DEMO[0]?.id ?? 'pinturas';
