/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE CATEGORÍA / SUBCATEGORÍA
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/categoria-formulario.interface.ts
 *
 * Tipos de las maquetas "ADMIN 10 - Crear / editar categoría", "ADMIN 11 - Crear
 * nueva subcategoría" y "ADMIN 12 - Modal desactivar categoría/subcategoría".
 * Sincronizado 1:1 con `CrearCategoriaDto`/`CrearSubcategoriaDto` del backend
 * real (backend/src/modules/m01-catalogo/dtos/categorias.dto.ts y
 * subcategorias.dto.ts): nombre (≤ 100, obligatorio), orden (opcional) y,
 * en subcategoría, id_categoria (padre, obligatorio). `tipo` distingue la UI
 * de categoría/subcategoría (no es un campo del backend, cada nivel tiene su
 * propio DTO). `estado` es un concepto de UI local (publicar/desactivar) que
 * no viaja en esos DTOs — mismo tratamiento que `EstadoPublicacion` en el
 * formulario de producto.
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

  /** Obligatorio cuando `tipo === 'subcategoria'` (id_categoria). */
  padreId: string | null;
  estado: EstadoCategoria;
  /** Orden de visualización dentro de su nivel. */
  ordenVisualizacion: number;
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
  arbolPreview: NodoPreviewCategoria[];
}

/** Panel "Resumen e impacto" (lado derecho). */
export interface ResumenImpactoCategoria {
  productosAsociados: number;
  subcategorias: number;
  visibilidadPublica: boolean;
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
