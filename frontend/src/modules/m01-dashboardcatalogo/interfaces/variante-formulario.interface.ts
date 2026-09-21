/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE VARIANTE (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/variante-formulario.interface.ts
 *
 * Tipos de las maquetas "ADMIN 07 - Crear variante" y "ADMIN 08 - Editar
 * variante". Sincronizado 1:1 con `CrearVarianteDto` / `ActualizarVarianteDto`
 * del backend real (backend/src/modules/m01-catalogo/dtos/variantes.dto.ts):
 * id_producto, id_presentacion, precio_vigente, existencia_referencial,
 * id_color, id_base, codigo_proveedor. `id_presentacion`/`id_base` son
 * referencias a catálogos propios (Presentacion / Base) sin UI de gestión en
 * este módulo; se editan aquí como selectores alimentados por el mock de
 * opciones del formulario.
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
  /** Data URL base64 (jpeg/png/webp, ≤ 5MB) o URL almacenada (`imagen`). */
  url: string;
  nombre: string;
  /** Posición en la galería (`orden`); 0 es la primera. */
  orden: number;
  /** `es_principal`. */
  esPrincipal: boolean;
}

/**
 * Modelo editable de la variante. Se envía tal cual (salvo `imagenes`, que
 * suben por su propio endpoint) al crear o actualizar. Campo a campo,
 * corresponde a `CrearVarianteDto` del backend real.
 */
export interface FormularioVariante {
  // Producto asociado (id_producto)
  productoId: string | null;

  // Presentación (id_presentacion): referencia al catálogo de Presentaciones.
  presentacionId: string | null;

  // Base (id_base) y color (id_color): referencias a catálogo, solo aplican
  // según la clase de color del producto asociado.
  baseId: string | null;
  colorId: string | null;

  // Códigos e identificación (codigo_proveedor)
  codigoProveedor: string;

  // Información comercial (precio_vigente, existencia_referencial)
  precioVigente: number | null;
  existenciaReferencial: number | null;

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
  marca: string;
  linea: string | null;
  /** false en productos sin contenido líquido (herramientas, equipos): oculta "Presentación". */
  requierePresentacion: boolean;
  /** false en productos sin base/color (herramientas, equipos): oculta "Base y color". */
  requiereColor: boolean;
}

/** Catálogos que llenan los selectores del formulario de variante. */
export interface OpcionesFormularioVariante {
  productos: OpcionProductoVariante[];
  /** Catálogo de Presentaciones (id_presentacion): sin UI de gestión en este módulo. */
  presentaciones: OpcionSelect[];
  /** Catálogo de Bases (id_base): sin UI de gestión en este módulo. */
  bases: OpcionSelect[];
  colores: OpcionColorVariante[];
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
