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
    padreId: null,
    estado: 'publicado',
    ordenVisualizacion: 0,
  };
}

/** Ejemplo para el modo "editar" (subcategoría "Pinturas Interiores"). */
export const CATEGORIA_FORMULARIO_DEMO: FormularioCategoria = {
  tipo: 'subcategoria',
  nombre: 'Pinturas Interiores',
  padreId: 'pinturas',
  estado: 'publicado',
  ordenVisualizacion: 1,
};

/** Panel "Resumen e impacto" de la maqueta ADMIN 10. */
export const RESUMEN_IMPACTO_CATEGORIA_DEMO: ResumenImpactoCategoria = {
  productosAsociados: 68,
  subcategorias: 7,
  visibilidadPublica: true,
  nivel: 2,
};
