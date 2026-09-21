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
  marcas: [
    { valor: 'pintuco', etiqueta: 'Pintuco' },
    { valor: 'corona', etiqueta: 'Corona' },
    { valor: 'sika', etiqueta: 'Sika' },
    { valor: 'dewalt', etiqueta: 'DeWalt' },
    { valor: '3m', etiqueta: '3M' },
    { valor: 'eler', etiqueta: 'Eler' },
  ],
  familias: FAMILIAS_CROMATICAS_DEMO.map((f) => ({ valor: f.clave, etiqueta: f.nombre })),
};

export function formularioColorVacio(): FormularioColor {
  return {
    nombre: '',
    marcaId: '',
    codigo: '',
    familiaClave: '',
    hex: '#0877E8',
    estado: 'publicado',
  };
}

/** Color de ejemplo para el modo "editar" (el de la maqueta ADMIN 18). */
export const FORMULARIO_COLOR_DEMO: FormularioColor = {
  nombre: 'Amarillo Profundo',
  marcaId: 'pintuco',
  codigo: 'AP-001',
  familiaClave: 'amarillos',
  hex: '#FFC928',
  estado: 'publicado',
};

export const RESUMEN_COLOR_PREVIA_DEMO: ResumenColorPrevia = {
  productos: 18,
  variantes: 42,
  coloresRelacionados: ['#F4C430', '#FCE38A', '#FB8C00', '#D62828', '#FFB300', '#FFF3C4'],
};
