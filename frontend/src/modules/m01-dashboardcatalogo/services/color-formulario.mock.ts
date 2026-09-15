import type {
  FormularioColor,
  OpcionesFormularioColor,
  ResumenColorPrevia,
} from '../interfaces';
import { FAMILIAS_CROMATICAS_DEMO } from './colores.mock';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL FORMULARIO DE COLOR
 * Ubicación: src/modules/m01-dashboardcatalogo/services/color-formulario.mock.ts
 * Refleja la maqueta "ADMIN 18 - Crear / editar color" (ej. "Amarillo Profundo").
 * ==============================================================================
 */

export const OPCIONES_FORMULARIO_COLOR_DEMO: OpcionesFormularioColor = {
  familias: FAMILIAS_CROMATICAS_DEMO.map((f) => ({ valor: f.clave, etiqueta: f.nombre })),
  bases: [
    { valor: 'base-agua', etiqueta: 'Base agua' },
    { valor: 'base-solvente', etiqueta: 'Base solvente' },
    { valor: 'base-epoxica', etiqueta: 'Base epóxica' },
  ],
};

export function formularioColorVacio(): FormularioColor {
  return {
    nombre: '',
    nombreCorto: '',
    descripcion: '',
    familiaClave: '',
    hex: '#0877E8',
    estado: 'publicado',
    mostrarEnTienda: true,
    incluirEnBuscador: true,
    basesCompatibles: [],
    politicaProductos: 'todos',
    tituloSeo: '',
    metaDescripcion: '',
    etiquetas: [],
    notasInternas: '',
  };
}

/** Color de ejemplo para el modo "editar" (el de la maqueta ADMIN 18). */
export const FORMULARIO_COLOR_DEMO: FormularioColor = {
  nombre: 'Amarillo Profundo',
  nombreCorto: 'Amarillo Prof.',
  descripcion:
    'Color amarillo intenso, con alta cobertura y resistencia. Ideal para interiores y exteriores. Aporta luminosidad y vitalidad a los espacios.',
  familiaClave: 'amarillos',
  hex: '#FFC928',
  estado: 'publicado',
  mostrarEnTienda: true,
  incluirEnBuscador: true,
  basesCompatibles: ['base-agua', 'base-solvente'],
  politicaProductos: 'todos',
  tituloSeo: 'Amarillo Profundo | Color Pintu Clic',
  metaDescripcion:
    'Color amarillo profundo de alta cobertura. Ideal para interiores y exteriores. Encuéntralo en pinturas Pintu Clic.',
  etiquetas: ['amarillo', 'vibrante', 'interiores', 'exteriores', 'alta cobertura'],
  notasInternas:
    'Color recomendado para campañas de temporada. Funciona bien en cocinas y zonas de alto tránsito. Revisar compatibilidad con línea industrial.',
};

export const RESUMEN_COLOR_PREVIA_DEMO: ResumenColorPrevia = {
  productos: 18,
  variantes: 42,
  coloresRelacionados: ['#F4C430', '#FCE38A', '#FB8C00', '#D62828', '#FFB300', '#FFF3C4'],
};
