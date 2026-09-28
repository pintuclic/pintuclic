import type {
  FormularioCategoria,
  OpcionesFormularioCategoria,
  ResumenImpactoCategoria,
} from '../interfaces';
import type { TipoNodoCategoria } from '../interfaces';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL FORMULARIO DE CATEGORÍA / SUBCATEGORÍA
 * Ubicación: src/modules/m01-dashboardcatalogo/services/categoria-formulario.mock.ts
 *
 * Refleja las maquetas "ADMIN 10 - Crear / editar categoría" y
 * "ADMIN 11 - Crear nueva subcategoría" (ejemplo: subcategoría
 * "Pinturas Interiores" dentro de "Pinturas").
 * ==============================================================================
 */

export const OPCIONES_FORMULARIO_CATEGORIA_DEMO: OpcionesFormularioCategoria = {
  categoriasPadre: [
    { valor: 'pinturas', etiqueta: 'Pinturas' },
    { valor: 'herramientas', etiqueta: 'Herramientas' },
    { valor: 'construccion', etiqueta: 'Construcción' },
    { valor: 'accesorios', etiqueta: 'Accesorios' },
    { valor: 'impermeabilizantes', etiqueta: 'Impermeabilizantes' },
  ],
  filtros: [
    { valor: 'tipo-acabado', etiqueta: 'Tipo de acabado' },
    { valor: 'rendimiento', etiqueta: 'Rendimiento' },
    { valor: 'tiempo-secado', etiqueta: 'Tiempo de secado' },
    { valor: 'resistencia-lavado', etiqueta: 'Resistencia al lavado' },
    { valor: 'color', etiqueta: 'Color' },
  ],
  lineas: [
    { valor: 'viniltex', etiqueta: 'Viniltex' },
    { valor: 'pintuclic', etiqueta: 'Pintu Clic' },
    { valor: 'corona', etiqueta: 'Corona' },
    { valor: '3m', etiqueta: '3M' },
    { valor: 'pintuco-profesional', etiqueta: 'Pintuco Profesional' },
    { valor: 'koraza', etiqueta: 'Koraza' },
  ],
  arbolPreview: [
    { id: 'pinturas', nombre: 'Pinturas', padreId: null },
    { id: 'pinturas-interiores', nombre: 'Pinturas Interiores', padreId: 'pinturas' },
    { id: 'pinturas-exteriores', nombre: 'Pinturas Exteriores', padreId: 'pinturas' },
    { id: 'esmaltes', nombre: 'Esmaltes', padreId: 'pinturas' },
    { id: 'barnices', nombre: 'Barnices', padreId: 'pinturas' },
    { id: 'pinturas-spray', nombre: 'Pinturas en Spray', padreId: 'pinturas' },
    { id: 'primarios-imprimantes', nombre: 'Primarios e Imprimantes', padreId: 'pinturas' },
    { id: 'accesorios-pintura', nombre: 'Accesorios de Pintura', padreId: 'pinturas' },
  ],
};

/** Formulario en blanco para el modo "crear". */
export function formularioCategoriaVacio(tipo: TipoNodoCategoria): FormularioCategoria {
  return {
    tipo,
    nombre: '',
    slug: '',
    descripcion: '',
    iconoUrl: null,
    padreId: null,
    estado: 'publicado',
    ordenVisualizacion: 1,
    filtros: [],
    lineas: [],
    tituloSeo: '',
    metaDescripcion: '',
    etiquetas: [],
    notas: '',
  };
}

/** Ejemplo para el modo "editar" (subcategoría "Pinturas Interiores"). */
export const CATEGORIA_FORMULARIO_DEMO: FormularioCategoria = {
  tipo: 'subcategoria',
  nombre: 'Pinturas Interiores',
  slug: 'pinturas-interiores',
  descripcion:
    'Productos de pintura para interiores que embellecen, protegen y dan color a tus espacios. Incluye pinturas lavables, mates y satinadas para todo tipo de ambientes interiores.',
  iconoUrl: null,
  padreId: 'pinturas',
  estado: 'publicado',
  ordenVisualizacion: 1,
  filtros: ['tipo-acabado', 'rendimiento', 'tiempo-secado', 'resistencia-lavado'],
  lineas: ['viniltex', 'pintuclic', 'corona', '3m'],
  tituloSeo: 'Pinturas para Interiores | Pintu Clic',
  metaDescripcion:
    'Descubre nuestra línea de pinturas interiores. Colores de alta calidad, lavables y de gran cobertura para tus espacios.',
  etiquetas: ['interiores', 'hogar', 'paredes', 'decoración'],
  notas: '',
};

/** Panel "Resumen e impacto" de la maqueta ADMIN 10. */
export const RESUMEN_IMPACTO_CATEGORIA_DEMO: ResumenImpactoCategoria = {
  productosAsociados: 68,
  subcategorias: 7,
  visibilidadPublica: true,
  herenciaFiltros: 4,
  nivel: 2,
};
