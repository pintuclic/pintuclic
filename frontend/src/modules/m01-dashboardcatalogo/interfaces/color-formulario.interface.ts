/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE COLOR (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/color-formulario.interface.ts
 *
 * Tipos de la maqueta "ADMIN 18 - Crear / editar color" (HU-CAT-05).
 * RF-CAT-05-01: nombre comercial obligatorio, código opcional.
 * RF-CAT-05-02: el valor cromático es obligatorio y la muestra se deriva de él
 * (aquí se captura como HEX; el RGB se deriva del HEX para la vista).
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';
import type { EstadoColor } from './colores.interface';

export type ModoFormularioColor = 'crear' | 'editar';

/** Política de productos donde el color puede usarse. */
export type PoliticaProductoColor = 'todos' | 'especificos' | 'personalizadas';

/** Modelo editable del color. */
export interface FormularioColor {
  nombre: string;
  nombreCorto: string;
  descripcion: string;
  familiaClave: string;

  /** Valor cromático capturado como HEX (RF-CAT-05-02). */
  hex: string;

  estado: EstadoColor;
  mostrarEnTienda: boolean;
  incluirEnBuscador: boolean;

  /** Bases sobre las que puede prepararse (RF-CAT-12-04). */
  basesCompatibles: string[];
  politicaProductos: PoliticaProductoColor;

  tituloSeo: string;
  metaDescripcion: string;
  etiquetas: string[];

  notasInternas: string;
}

/** Catálogos que llenan los selectores del formulario. */
export interface OpcionesFormularioColor {
  familias: OpcionSelect[];
  bases: OpcionSelect[];
}

/** Ítem del bloque "Impacto y uso" (checklist informativo). */
export interface ImpactoColor {
  clave: string;
  etiqueta: string;
  detalle: string;
  cumple: boolean;
}

/** Datos de la tarjeta "Vista previa" y métricas de uso. */
export interface ResumenColorPrevia {
  productos: number;
  variantes: number;
  coloresRelacionados: string[];
}

/** Respuesta de crear / actualizar color. */
export interface ResultadoGuardadoColor {
  id: string;
  estado: EstadoColor;
  mensaje: string;
}
