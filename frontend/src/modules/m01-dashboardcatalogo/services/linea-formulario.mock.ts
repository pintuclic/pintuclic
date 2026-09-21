import type { FormularioLinea, OpcionesFormularioLinea } from '../interfaces';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL FORMULARIO DE LÍNEA COMERCIAL
 * Ubicación: src/modules/m01-dashboardcatalogo/services/linea-formulario.mock.ts
 *
 * Refleja la maqueta "ADMIN 16 - Crear / editar línea" (ejemplo:
 * "Viniltex Advanced" de Pintuco).
 * ==============================================================================
 */

export const OPCIONES_FORMULARIO_LINEA_DEMO: OpcionesFormularioLinea = {
  marcas: [
    { valor: 'pintuco', etiqueta: 'Pintuco' },
    { valor: 'corona', etiqueta: 'Corona' },
    { valor: 'sika', etiqueta: 'Sika' },
    { valor: 'dewalt', etiqueta: 'DeWalt' },
    { valor: '3m', etiqueta: '3M' },
    { valor: 'eler', etiqueta: 'Eler' },
  ],
};

/** Formulario en blanco para el modo "crear". */
export function formularioLineaVacio(): FormularioLinea {
  return {
    nombre: '',
    marcaId: '',
    gamaComercial: '',
    estado: 'activa',
  };
}

/** Línea de ejemplo para el modo "editar" (la de la maqueta ADMIN 16). */
export const FORMULARIO_LINEA_DEMO: FormularioLinea = {
  nombre: 'Viniltex Advanced',
  marcaId: 'pintuco',
  gamaComercial: 'Profesional',
  estado: 'activa',
};
