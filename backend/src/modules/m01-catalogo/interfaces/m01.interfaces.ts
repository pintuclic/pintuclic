import { EnumEstadoGeneral } from '../../../core/db/types';

// ==============================================================================
// M01 - CATÁLOGO DE PRODUCTOS
// Contratos e interfaces públicas del módulo (Solo tipos de compilación, 0 runtime)
// ==============================================================================

// ------------------------------------------------------------------------------
// CATEGORÍAS Y SUBCATEGORÍAS (HU-CAT-01)
// ------------------------------------------------------------------------------

/** Ficha de una categoría raíz tal como se expone en el panel administrativo. */
export interface CategoriaDetalle {
  readonly id_categoria: number;
  readonly nombre: string;
  readonly orden: number;
  readonly estado: EnumEstadoGeneral;
}

/** Ficha de una subcategoría, siempre atada a una única categoría padre (RF-CAT-01-02). */
export interface SubcategoriaDetalle {
  readonly id_subcategoria: number;
  readonly id_categoria: number;
  readonly nombre: string;
  readonly orden: number;
  readonly estado: EnumEstadoGeneral;
}

/**
 * Resultado de contar el impacto de una desactivación antes de confirmarla
 * (RF-CAT-01-04, CA-CAT-01-05: "el sistema me dice antes cuántos productos
 * dejarán de verse").
 */
export interface ImpactoDesactivacion {
  readonly requiere_confirmacion: true;
  readonly productos_afectados: number;
  readonly subcategorias_afectadas?: number;
}

/** Confirmación de que la desactivación (o reactivación) se aplicó. */
export interface ResultadoDesactivacion {
  readonly desactivado: true;
}

export interface ResultadoReactivacion {
  readonly reactivado: true;
}
