/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE LÍNEA COMERCIAL (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/linea-formulario.interface.ts
 *
 * Tipos de la maqueta "ADMIN 16 - Crear / editar línea comercial" (RF-CAT-11).
 * Sincronizado 1:1 con `CrearLineaDto` / `ActualizarLineaDto` del backend real
 * (backend/src/modules/m01-catalogo/dtos/lineas.dto.ts): nombre, id_marca
 * (obligatorios) y gama_comercial (opcional). `estado` es un concepto de UI
 * local (activar/pausar/desactivar la línea) que no viaja en ese DTO — mismo
 * tratamiento que `EstadoPublicacion` en el formulario de producto.
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';
import type { EstadoLinea } from './lineas.interface';

/** Modo de la vista de formulario. */
export type ModoFormularioLinea = 'crear' | 'editar';

/** Modelo editable de la línea comercial. */
export interface FormularioLinea {
  nombre: string;
  /** Marca a la que pertenece la línea (id_marca). */
  marcaId: string;
  /** Gama comercial: dato descriptivo opcional (gama_comercial). */
  gamaComercial: string;
  estado: EstadoLinea;
}

/** Catálogos que llenan los selectores del formulario. */
export interface OpcionesFormularioLinea {
  marcas: OpcionSelect[];
}

/** Bloque del checklist de publicación de la línea. */
export interface SeccionChecklistLinea {
  clave: string;
  etiqueta: string;
  completa: boolean;
  opcional: boolean;
}

/** Respuesta de crear / actualizar línea. */
export interface ResultadoGuardadoLinea {
  id: string;
  estado: EstadoLinea;
  mensaje: string;
}
