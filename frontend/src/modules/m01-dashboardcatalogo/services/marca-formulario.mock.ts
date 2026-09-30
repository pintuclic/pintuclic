import type { FormularioMarca, OpcionesFormularioMarca } from '../interfaces';
import { LOGO_MARCA_DEMO } from '../assets/imagenes-catalogo';

/**
 * ==============================================================================
 * M01 - DATOS DE EJEMPLO DEL FORMULARIO DE MARCA
 * Ubicación: src/modules/m01-dashboardcatalogo/services/marca-formulario.mock.ts
 *
 * Refleja la maqueta "ADMIN 13 - Crear / editar marca" (ejemplo: "Pintuco").
 * ==============================================================================
 */

export const OPCIONES_FORMULARIO_MARCA_DEMO: OpcionesFormularioMarca = {
  paises: [
    { valor: 'colombia', etiqueta: 'Colombia' },
    { valor: 'mexico', etiqueta: 'México' },
    { valor: 'chile', etiqueta: 'Chile' },
    { valor: 'estados-unidos', etiqueta: 'Estados Unidos' },
    { valor: 'alemania', etiqueta: 'Alemania' },
  ],
  lineas: [
    { valor: 'pinturas-interiores', etiqueta: 'Pinturas interiores' },
    { valor: 'pinturas-exteriores', etiqueta: 'Pinturas exteriores' },
    { valor: 'esmaltes', etiqueta: 'Esmaltes' },
    { valor: 'impermeabilizantes', etiqueta: 'Impermeabilizantes' },
    { valor: 'maderas', etiqueta: 'Maderas' },
    { valor: 'accesorios', etiqueta: 'Accesorios' },
  ],
  bases: [
    { valor: 'base-agua', etiqueta: 'Base agua' },
    { valor: 'base-solvente', etiqueta: 'Base solvente' },
    { valor: 'base-universal', etiqueta: 'Base universal' },
    { valor: 'base-epoxica', etiqueta: 'Base epóxica' },
  ],
  politicasColor: [
    { valor: 'todos', etiqueta: 'Todos los colores' },
    { valor: 'especificos', etiqueta: 'Solo colores específicos' },
  ],
};

/** Formulario en blanco para el modo "crear". */
export function formularioMarcaVacio(): FormularioMarca {
  return {
    nombre: '',
    descripcion: '',
    logoUrl: null,
    sitioWeb: '',
    paisOrigen: '',
    contactoEmail: '',
    telefono: '',
    lineas: [],
    politicaColor: 'todos',
    basesCompatibles: [],
    tituloSeo: '',
    descripcionSeo: '',
    etiquetas: [],
    notasInternas: '',
    estado: 'activa',
  };
}

/** Marca de ejemplo para el modo "editar" (la de la maqueta ADMIN 13). */
export const FORMULARIO_MARCA_DEMO: FormularioMarca = {
  nombre: 'Pintuco',
  descripcion:
    'Pintuco es la marca líder en pinturas y recubrimientos en Colombia, con más de 70 años de experiencia, ofreciendo soluciones innovadoras para embellecer, proteger y transformar espacios.',
  logoUrl: LOGO_MARCA_DEMO['pintuco'] ?? null,
  sitioWeb: 'https://www.pintuco.com',
  paisOrigen: 'colombia',
  contactoEmail: 'contacto@pintuco.com',
  telefono: '+57 601 634 4000',
  lineas: ['pinturas-interiores', 'pinturas-exteriores', 'esmaltes'],
  politicaColor: 'todos',
  basesCompatibles: ['base-agua', 'base-solvente', 'base-universal'],
  tituloSeo: 'Pintuco | Pinturas y recubrimientos para tu hogar y empresa',
  descripcionSeo:
    'Pintuco, la marca líder en pinturas y recubrimientos en Colombia. Descubre nuestra línea de productos para interiores, exteriores y soluciones profesionales.',
  etiquetas: ['pintura', 'recubrimientos', 'colombia', 'hogar', 'profesional'],
  notasInternas:
    'Marca estratégica para promociones. Coordinar lanzamientos con equipo comercial. Contactar a representante para acuerdos de exclusividad.',
  estado: 'activa',
};
