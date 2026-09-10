/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL DETALLE ADMINISTRATIVO DE MARCA
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/marca-detalle.interface.ts
 *
 * Tipos de la maqueta "ADMIN 14 - Detalle de marca": ficha de solo lectura con
 * encabezado, 4 indicadores y pestañas (información general, líneas, colores,
 * productos destacados, bases, historial).
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * ==============================================================================
 */
import type { EstadoMarca } from './marcas.interface';
import type { MovimientoAuditoriaProducto } from './producto-formulario.interface';

/** Recurso descargable o imagen de marca. */
export interface RecursoMarca {
  id: string;
  nombre: string;
  tipo: 'imagen' | 'documento';
  url: string;
  /** Peso legible del archivo, p. ej. "4.2 MB" (solo documentos). */
  peso: string | null;
}

/** Pestañas de la ficha de detalle de marca. */
export type PestanaDetalleMarca =
  | 'general'
  | 'lineas'
  | 'colores'
  | 'destacados'
  | 'bases'
  | 'historial';

/** Ficha administrativa completa de la marca (maqueta ADMIN 14). */
export interface DetalleAdministrativoMarca {
  id: string;
  nombre: string;
  estado: EstadoMarca;
  eslogan: string;
  descripcion: string;
  logoUrl: string | null;

  // Datos
  sitioWeb: string;
  paisOrigen: string;
  anioFundacion: number;
  tipoMarca: string;

  // Indicadores
  productosAsociados: number;
  lineasComerciales: number;
  coloresActivos: number;
  basesAsociadas: number;

  // Estado y visibilidad
  visibleEnTienda: boolean;
  apareceEnBusquedas: boolean;
  ordenVisualizacion: number;
  actualizadoEn: string;
  actualizadoPor: string;

  // Pestañas
  lineas: { id: string; nombre: string; productos: number; estado: EstadoMarca }[];
  colores: { nombre: string; hex: string; codigo: string }[];
  productosDestacados: { id: string; nombre: string; precio: number }[];
  bases: string[];
  imagenes: RecursoMarca[];
  documentos: RecursoMarca[];
  historial: MovimientoAuditoriaProducto[];
}
