/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE MARCA (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/marca-formulario.interface.ts
 *
 * Tipos de la maqueta "ADMIN 13 - Crear / editar marca" (HU-CAT-04).
 * RF-CAT-04-01/02: nombre y logotipo obligatorios; unicidad de nombre validada
 * en el servidor. Se pueden asociar líneas, colores y bases.
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';
import type { EstadoMarca } from './marcas.interface';

/** Modo de la vista de formulario. */
export type ModoFormularioMarca = 'crear' | 'editar';

/** Modelo editable de la marca. */
export interface FormularioMarca {
  nombre: string;
  descripcion: string;
  logoUrl: string | null;

  // Datos de contacto
  sitioWeb: string;
  paisOrigen: string;
  contactoEmail: string;
  telefono: string;

  // Relaciones del catálogo
  lineas: string[];
  /** Política de colores: 'todos' o 'especificos'. */
  politicaColor: string;
  basesCompatibles: string[];

  // SEO
  tituloSeo: string;
  descripcionSeo: string;
  etiquetas: string[];

  notasInternas: string;
  estado: EstadoMarca;
}

/** Catálogos que llenan los selectores del formulario. */
export interface OpcionesFormularioMarca {
  paises: OpcionSelect[];
  lineas: OpcionSelect[];
  bases: OpcionSelect[];
  politicasColor: OpcionSelect[];
}

/** Bloque del checklist de publicación de la marca. */
export interface SeccionChecklistMarca {
  clave: string;
  etiqueta: string;
  completa: boolean;
  opcional: boolean;
}

/** Indicadores de la tarjeta "Vista previa de la marca". */
export interface ResumenPreviaMarca {
  productos: number;
  lineas: number;
  colores: number;
}

/** Respuesta de crear / actualizar marca. */
export interface ResultadoGuardadoMarca {
  id: string;
  estado: EstadoMarca;
  mensaje: string;
}
