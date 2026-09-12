/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DE GESTIÓN DE COLORES
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/colores.interface.ts
 *
 * Tipos de integración de la vista "ADMIN 07 - Colores" (HU-CAT-05).
 * RF-CAT-05-01: nombre comercial obligatorio, código opcional, color asociado
 * a una marca. RF-CAT-05-02: el valor cromático (CIELAB) es obligatorio y la
 * muestra visual se deriva de él. RF-CAT-05-03: familias cromáticas
 * administrables y carga masiva.
 *
 * `valorCromatico` aquí es el hex derivado del CIELAB para pintar la muestra;
 * es dato de catálogo, no un token de UI.
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';

export type EstadoColor = 'publicado' | 'borrador';

/** Familia cromática administrable (RF-CAT-05-03). */
export interface FamiliaCromatica {
  clave: string;
  nombre: string;
  /** Hex representativo de la familia (para el círculo de la tira superior). */
  hex: string;
  total: number;
}

/** Fila del listado de colores. */
export interface ColorListado {
  id: string;
  nombre: string;
  codigo: string | null;
  marca: string;
  familiaClave: string;
  familiaNombre: string;
  /** Hex derivado del valor CIELAB (RF-CAT-05-02). */
  valorCromatico: string;
  estado: EstadoColor;
}

export interface FiltrosColores {
  busqueda: string;
  marcaId: string | null;
  familiaClave: string | null;
  estado: EstadoColor | null;
  pagina: number;
  porPagina: number;
}

export interface OpcionesFiltroColores {
  marcas: OpcionSelect[];
  familias: OpcionSelect[];
}

export interface PaginaColores {
  items: ColorListado[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface ResumenColores {
  totalColores: { valor: number; variacionPorcentaje: number };
  coloresActivos: { valor: number; variacionPorcentaje: number };
  familiasCromaticas: { valor: number };
}
