/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE LÍNEA COMERCIAL (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/linea-formulario.interface.ts
 *
 * Tipos de la maqueta "ADMIN 16 - Crear / editar línea comercial" (RF-CAT-11).
 * Una línea pertenece a una marca y clasifica un conjunto de productos por gama
 * de uso. Se puede controlar su visibilidad en el catálogo público.
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';
import type { EstadoLinea } from './lineas.interface';

/** Modo de la vista de formulario. */
export type ModoFormularioLinea = 'crear' | 'editar';

/** Modelo editable de la línea comercial. */
export interface FormularioLinea {
  nombre: string;
  descripcion: string;
  imagenUrl: string | null;

  // Clasificación y uso
  marca: string;
  categoria: string;
  subcategoria: string;
  tipoLinea: string;

  // Estado y visibilidad
  estado: EstadoLinea;
  mostrarEnCatalogo: boolean;
  mostrarEnFiltros: boolean;
  destacarEnPortada: boolean;

  // Productos asociados
  productosAsociados: string[];

  // SEO / etiquetas
  etiquetas: string[];

  notasInternas: string;
}

/** Catálogos que llenan los selectores del formulario. */
export interface OpcionesFormularioLinea {
  marcas: OpcionSelect[];
  categorias: OpcionSelect[];
  subcategorias: OpcionSelect[];
  tiposLinea: OpcionSelect[];
  productos: OpcionSelect[];
}

/** Bloque del checklist de publicación de la línea. */
export interface SeccionChecklistLinea {
  clave: string;
  etiqueta: string;
  completa: boolean;
  opcional: boolean;
}

/** Indicadores de la tarjeta "Dependencias / Resumen de impacto". */
export interface ResumenImpactoLinea {
  productosAsociados: number;
  reglasVigentes: number;
}

/** Respuesta de crear / actualizar línea. */
export interface ResultadoGuardadoLinea {
  id: string;
  estado: EstadoLinea;
  mensaje: string;
}
