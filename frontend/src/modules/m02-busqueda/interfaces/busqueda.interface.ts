/**
 * ==============================================================================
 * M02 - INTERFACES DE BÚSQUEDA Y FACETAS
 * Ubicación: src/modules/m02-busqueda/interfaces/busqueda.interface.ts
 *
 * Contratos de datos TypeScript puros (0 runtime) para el motor de búsqueda,
 * facetas multielección, ordenamiento y analítica de búsquedas fallidas.
 * ==============================================================================
 */

export type OrdenBusqueda = 'relevancia' | 'precio_asc' | 'precio_desc' | 'novedad';

export interface FiltrosBusquedaFrontend {
  q?: string;
  categoria?: number;
  subcategoria?: number;
  marca?: number[];
  linea?: number[];
  resina?: number[];
  color?: number[];
  presentacion?: number[];
  precio_min?: number;
  precio_max?: number;
  orden?: OrdenBusqueda;
  pagina?: number;
  limite?: number;
}

export interface FacetaValorFrontend {
  id: number;
  nombre: string;
  cantidad: number;
}

export interface FacetasBusquedaFrontend {
  categorias: FacetaValorFrontend[];
  subcategorias: FacetaValorFrontend[];
  marcas: FacetaValorFrontend[];
  lineas: FacetaValorFrontend[];
  resinas: FacetaValorFrontend[];
  colores: FacetaValorFrontend[];
  presentaciones: FacetaValorFrontend[];
}

export interface ItemProductoBusqueda {
  id_producto: number;
  nombre: string;
  id_marca: number;
  clase_color: 'entonable' | 'colores_fijos' | 'sin_color';
}

export interface PaginaBusquedaFrontend {
  items: ItemProductoBusqueda[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

export interface EstadisticaBusquedaSinResultado {
  termino: string;
  repeticiones: number;
  ultima_busqueda: string;
}
