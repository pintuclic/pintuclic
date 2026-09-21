/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DE GESTIÓN DE MARCAS
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/marcas.interface.ts
 *
 * Tipos de integración de la vista "ADMIN 06 - Marcas" (HU-CAT-04).
 * RF-CAT-04-01: nombre y logotipo obligatorios; se pueden consultar productos,
 * líneas y colores asociados. RF-CAT-04-03: desactivar una marca desactiva en
 * cascada sus productos, líneas, colores y campañas.
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * ==============================================================================
 */

export type EstadoMarca = 'activa' | 'inactiva';

/** Fila del listado de marcas. */
export interface MarcaListado {
  id: string;
  nombre: string;
  /** URL del logotipo optimizado; `null` mientras no se ha cargado. */
  logoUrl: string | null;
  lineasAsociadas: number;
  productos: number;
  colores: number;
  estado: EstadoMarca;
}

export interface FiltrosMarcas {
  busqueda: string;
  estado: EstadoMarca | null;
  pagina: number;
  porPagina: number;
}

export interface PaginaMarcas {
  items: MarcaListado[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

/** Indicadores de la fila de KPIs. */
export interface ResumenMarcas {
  marcasActivas: { valor: number; variacionPorcentaje: number };
  totalProductos: { valor: number; variacionPorcentaje: number };
  lineasProductos: { valor: number; variacionPorcentaje: number };
  coloresDisponibles: { valor: number; variacionPorcentaje: number };
}

/**
 * Modelo editable del panel lateral "Editar marca". Sincronizado 1:1 con
 * `CrearMarcaDto` / `ActualizarMarcaDto` del backend real: solo nombre y
 * logotipo. `lineas` no vive aquí — una línea referencia su marca por
 * `id_marca`, la marca no guarda la lista de sus líneas.
 */
export interface MarcaFormulario {
  id: string | null;
  nombre: string;
  logoUrl: string | null;
  estado: EstadoMarca;
}
