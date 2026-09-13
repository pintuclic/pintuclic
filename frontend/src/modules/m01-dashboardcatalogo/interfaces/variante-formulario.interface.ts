/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE VARIANTE (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/variante-formulario.interface.ts
 *
 * Tipos de las maquetas "ADMIN 07 - Crear variante" y "ADMIN 08 - Editar
 * variante". El precio y la existencia referencial viven SIEMPRE en la variante
 * física (RF-CAT-03-04). El modelo de variante depende del producto:
 *   - entonable  → producto + base + presentación
 *   - fijo       → producto + color + presentación
 *   - sin color  → producto + presentación
 *
 * Permiso M17 requerido: «Gestión de productos», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';

/** Modo de edición de la vista. */
export type ModoFormularioVariante = 'crear' | 'editar';

/** Estado que el formulario de variante puede fijar. */
export type EstadoVarianteForm = 'borrador' | 'activo' | 'inactivo';

/** Imagen específica de la variante (HU-CAT-07). La primera es la principal. */
export interface ImagenVariante {
  id: string;
  url: string;
  nombre: string;
  esPrincipal: boolean;
}

/**
 * Modelo editable de la variante. Se envía tal cual (salvo `imagenes`, que
 * suben por su propio endpoint) al crear o actualizar.
 */
export interface FormularioVariante {
  // Producto asociado
  productoId: string | null;

  // Presentación / unidad / base
  presentacion: string;
  unidadMedida: string;
  base: string;

  // Color asociado (solo colores fijos)
  colorId: string | null;

  // Códigos e identificación
  sku: string;
  codigoProveedor: string;
  codigoBarras: string;

  // Información comercial
  precioVenta: number | null;
  precioReferencia: number | null;
  costoCompra: number | null;
  /** Porcentaje de IVA: 0 | 5 | 19. */
  impuestoIva: number;

  // Inventario
  stockInicial: number | null;
  stockMinimo: number | null;
  bodegaId: string | null;

  // Dimensiones / peso (opcional)
  pesoKg: number | null;
  altoCm: number | null;
  anchoCm: number | null;
  profundidadCm: number | null;

  // Notas logísticas (opcional)
  notasLogisticas: string;

  // Imágenes (opcional)
  imagenes: ImagenVariante[];

  // Estado
  estado: EstadoVarianteForm;
}

/** Color administrado disponible para la variante (HU-CAT-05). */
export interface OpcionColorVariante {
  id: string;
  nombre: string;
  codigo: string | null;
  /** Hex derivado del valor CIELAB (dato de catálogo, no token de UI). */
  hex: string;
  familia: string;
}

/** Producto al que se puede asociar la variante (incluye datos de contexto). */
export interface OpcionProductoVariante extends OpcionSelect {
  sku: string;
  marca: string;
  linea: string | null;
}

/** Catálogos que llenan los selectores del formulario de variante. */
export interface OpcionesFormularioVariante {
  productos: OpcionProductoVariante[];
  presentaciones: OpcionSelect[];
  unidades: OpcionSelect[];
  bases: OpcionSelect[];
  colores: OpcionColorVariante[];
  impuestos: OpcionSelect[];
  bodegas: OpcionSelect[];
}

/** Bloque del checklist de publicación de la variante. */
export interface SeccionChecklistVariante {
  clave: string;
  etiqueta: string;
  completa: boolean;
  opcional: boolean;
}

/** Movimiento del historial de inventario (maqueta ADMIN 08). */
export interface MovimientoInventario {
  id: string;
  fechaHora: string;
  tipo: 'entrada' | 'salida' | 'ajuste';
  cantidad: number;
  usuario: string;
}

/**
 * Datos que solo existen al editar una variante ya creada (maqueta ADMIN 08):
 * movimientos de inventario, rotación y disponibilidad en tiendas.
 */
export interface DetalleEdicionVariante {
  movimientos: MovimientoInventario[];
  rotacion: 'alta' | 'media' | 'baja';
  /** Porcentaje de venta frente al promedio del catálogo. */
  rotacionComparativa: number;
  disponibilidadPorcentaje: number;
  tiendasConStock: number;
  tiendasTotales: number;
}

/** Respuesta de crear / actualizar variante. */
export interface ResultadoGuardadoVariante {
  id: string;
  estado: EstadoVarianteForm;
  mensaje: string;
}
