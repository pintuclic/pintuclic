/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL DETALLE ADMINISTRATIVO DE MARCA
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/marca-detalle.interface.ts
 *
 * Ficha de solo lectura de la maqueta "ADMIN 14 - Detalle de marca".
 *
 * La marca real solo tiene `{nombre, logotipo}` (backend/src/modules/
 * m01-catalogo/dtos/marcas.dto.ts) más `estado`, que es un concepto de UI local
 * (activar / desactivar) igual que en `FormularioMarca`. Todo lo demás que vive
 * aquí es dato DERIVADO de solo lectura que el backend expone en su modelo de
 * lectura: contadores de productos / líneas / colores, marcas de auditoría y
 * las colecciones relacionadas que alimentan las pestañas.
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { EstadoMarca } from './marcas.interface';
import type { MovimientoAuditoriaProducto } from './producto-formulario.interface';

/** Pestañas de la ficha de detalle de marca. */
export type PestanaDetalleMarca = 'general' | 'lineas' | 'colores' | 'patrocinados' | 'historial';

/** Ficha administrativa completa de la marca (maqueta ADMIN 14). */
export interface DetalleAdministrativoMarca {
  // Datos propios de la marca (CrearMarcaDto + estado de UI)
  id: string;
  nombre: string;
  estado: EstadoMarca;
  /** Logotipo (RF-CAT-04-02). */
  logoUrl: string | null;

  // Indicadores derivados (solo lectura, del modelo de lectura del backend)
  productosAsociados: number;
  lineasComerciales: number;
  coloresActivos: number;

  // Auditoría (solo lectura)
  actualizadoEn: string;
  actualizadoPor: string;

  // Colecciones relacionadas que alimentan las pestañas (solo lectura)
  lineas: { id: string; nombre: string; productos: number; estado: EstadoMarca }[];
  colores: { nombre: string; hex: string; codigo: string }[];
  /** Productos marcados como `patrocinado` en `CrearProductoDto`. */
  productosPatrocinados: { id: string; nombre: string; precio: number }[];
  historial: MovimientoAuditoriaProducto[];
}
