/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE MARCA (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/marca-formulario.interface.ts
 *
 * Tipos de la maqueta "ADMIN 13 - Crear / editar marca" (HU-CAT-04).
 * Sincronizado 1:1 con `CrearMarcaDto` / `ActualizarMarcaDto` del backend real
 * (backend/src/modules/m01-catalogo/dtos/marcas.dto.ts): únicamente `nombre` y
 * `logotipo`. RF-CAT-04-01/02: ambos obligatorios; unicidad de nombre validada
 * en el servidor. `estado` es un concepto de UI local (activar/desactivar la
 * marca) que no viaja en ese DTO — mismo tratamiento que `EstadoPublicacion`
 * en el formulario de producto.
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { EstadoMarca } from './marcas.interface';

/** Modo de la vista de formulario. */
export type ModoFormularioMarca = 'crear' | 'editar';

/** Modelo editable de la marca. */
export interface FormularioMarca {
  nombre: string;
  /** Logotipo (data URL base64, jpeg/png/webp, máx. 5MB — RF-CAT-04-02). */
  logoUrl: string | null;
  estado: EstadoMarca;
}

/** Bloque del checklist de publicación de la marca. */
export interface SeccionChecklistMarca {
  clave: string;
  etiqueta: string;
  completa: boolean;
  opcional: boolean;
}

/** Respuesta de crear / actualizar marca. */
export interface ResultadoGuardadoMarca {
  id: string;
  estado: EstadoMarca;
  mensaje: string;
}
