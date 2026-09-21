import type { FormularioMarca } from '../interfaces';
import { LOGO_MARCA_DEMO } from '../assets/imagenes-catalogo';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL FORMULARIO DE MARCA
 * Ubicación: src/modules/m01-dashboardcatalogo/services/marca-formulario.mock.ts
 *
 * Refleja la maqueta "ADMIN 13 - Crear / editar marca" (ejemplo: "Pintuco").
 * ==============================================================================
 */

/** Formulario en blanco para el modo "crear". */
export function formularioMarcaVacio(): FormularioMarca {
  return {
    nombre: '',
    logoUrl: null,
    estado: 'activa',
  };
}

/** Marca de ejemplo para el modo "editar" (la de la maqueta ADMIN 13). */
export const FORMULARIO_MARCA_DEMO: FormularioMarca = {
  nombre: 'Pintuco',
  logoUrl: LOGO_MARCA_DEMO['pintuco'] ?? null,
  estado: 'activa',
};
