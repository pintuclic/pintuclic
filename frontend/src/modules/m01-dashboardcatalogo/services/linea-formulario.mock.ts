import type { FormularioLinea, OpcionesFormularioLinea, ResumenImpactoLinea } from '../interfaces';

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
  categorias: [
    { valor: 'pinturas', etiqueta: 'Pinturas' },
    { valor: 'herramientas', etiqueta: 'Herramientas' },
    { valor: 'accesorios', etiqueta: 'Accesorios' },
    { valor: 'impermeabilizantes', etiqueta: 'Impermeabilizantes' },
  ],
  subcategorias: [
    { valor: 'pinturas-interiores', etiqueta: 'Pinturas interiores' },
    { valor: 'pinturas-exteriores', etiqueta: 'Pinturas exteriores' },
    { valor: 'esmaltes', etiqueta: 'Esmaltes' },
    { valor: 'barnices', etiqueta: 'Barnices' },
  ],
  tiposLinea: [
    { valor: 'premium', etiqueta: 'Premium' },
    { valor: 'profesional', etiqueta: 'Profesional' },
    { valor: 'estandar', etiqueta: 'Estándar' },
    { valor: 'economica', etiqueta: 'Económica' },
  ],
  productos: [
    { valor: 'viniltex-blanco', etiqueta: 'Viniltex Advanced Blanco' },
    { valor: 'viniltex-gris-niebla', etiqueta: 'Viniltex Advanced Gris Niebla' },
    { valor: 'viniltex-amarillo-sol', etiqueta: 'Viniltex Advanced Amarillo Sol' },
    { valor: 'viniltex-azul-cielo', etiqueta: 'Viniltex Advanced Azul Cielo' },
    { valor: 'viniltex-verde-menta', etiqueta: 'Viniltex Advanced Verde Menta' },
  ],
};

/** Formulario en blanco para el modo "crear". */
export function formularioLineaVacio(): FormularioLinea {
  return {
    nombre: '',
    descripcion: '',
    imagenUrl: null,
    marca: '',
    categoria: '',
    subcategoria: '',
    tipoLinea: '',
    estado: 'activa',
    mostrarEnCatalogo: true,
    mostrarEnFiltros: true,
    destacarEnPortada: false,
    productosAsociados: [],
    etiquetas: [],
    notasInternas: '',
  };
}

/** Línea de ejemplo para el modo "editar" (la de la maqueta ADMIN 16). */
export const FORMULARIO_LINEA_DEMO: FormularioLinea = {
  nombre: 'Viniltex Advanced',
  descripcion:
    'Línea de pinturas vinílicas premium para interiores y exteriores. Máximo poder cubriente, lavable y resistente para espacios que inspiran.',
  imagenUrl: null,
  marca: 'pintuco',
  categoria: 'pinturas',
  subcategoria: 'pinturas-interiores',
  tipoLinea: 'profesional',
  estado: 'activa',
  mostrarEnCatalogo: true,
  mostrarEnFiltros: true,
  destacarEnPortada: false,
  productosAsociados: ['viniltex-blanco', 'viniltex-gris-niebla', 'viniltex-amarillo-sol'],
  etiquetas: ['viniltex', 'premium', 'interiores', 'lavable'],
  notasInternas: 'Línea prioritaria para campaña Q3. Revisar precios y stock con el equipo comercial.',
};

export const RESUMEN_IMPACTO_LINEA_DEMO: ResumenImpactoLinea = {
  productosAsociados: 18,
  reglasVigentes: 3,
};
