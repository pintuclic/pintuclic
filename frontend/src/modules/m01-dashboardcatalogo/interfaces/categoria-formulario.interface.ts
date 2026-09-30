/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE CATEGORÍA / SUBCATEGORÍA
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/categoria-formulario.interface.ts
 *
 * Tipos de las maquetas "ADMIN 10 - Crear / editar categoría", "ADMIN 11 - Crear
 * nueva subcategoría" y "ADMIN 12 - Modal desactivar categoría/subcategoría".
 * HU-CAT-01: exactamente dos niveles, nombre ≤ 100 obligatorio, padre
 * obligatorio en la subcategoría, baja lógica en cascada (RF-CAT-01-01..05).
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';
import type { TipoNodoCategoria, EstadoCategoria } from './categorias.interface';

/** Modo de la vista de formulario. */
export type ModoFormularioCategoria = 'crear' | 'editar';

/** Modelo editable de la categoría o subcategoría. */
export interface FormularioCategoria {
  tipo: TipoNodoCategoria;
  nombre: string;
  /** Slug para la URL. Solo letras, números y guiones (RF-CAT-01). */
  slug: string;
  descripcion: string;
  iconoUrl: string | null;

  /** Obligatorio cuando `tipo === 'subcategoria'`. */
  padreId: string | null;
  estado: EstadoCategoria;
  ordenVisualizacion: number;

  /** Ids de atributos/filtros que heredan los productos de la categoría. */
  filtros: string[];
  /** Ids de líneas comerciales asociadas. */
  lineas: string[];

  tituloSeo: string;
  metaDescripcion: string;
  etiquetas: string[];
  notas: string;
}

/** Nodo del árbol usado en la "Vista previa en la jerarquía". */
export interface NodoPreviewCategoria {
  id: string;
  nombre: string;
  padreId: string | null;
}

/** Catálogos que llenan los selectores del formulario. */
export interface OpcionesFormularioCategoria {
  categoriasPadre: OpcionSelect[];
  filtros: OpcionSelect[];
  lineas: OpcionSelect[];
  arbolPreview: NodoPreviewCategoria[];
}

/** Panel "Resumen e impacto" (lado derecho). */
export interface ResumenImpactoCategoria {
  productosAsociados: number;
  subcategorias: number;
  visibilidadPublica: boolean;
  herenciaFiltros: number;
  nivel: 1 | 2;
}

/** Datos del modal "ADMIN 12 - Desactivar categoría/subcategoría". */
export interface ImpactoDesactivarCategoria {
  id: string;
  nombre: string;
  tipo: TipoNodoCategoria;
  ruta: string;
  productosAfectados: number;
  subcategoriasAfectadas: number;
}

/** Respuesta de crear / actualizar categoría. */
export interface ResultadoGuardadoCategoria {
  id: string;
  estado: EstadoCategoria;
  mensaje: string;
}
