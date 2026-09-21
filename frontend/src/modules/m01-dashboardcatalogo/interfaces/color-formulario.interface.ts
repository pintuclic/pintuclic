/**
 * ==============================================================================
 * M01 - CONTRATOS DE DATOS DEL FORMULARIO DE COLOR (CREAR / EDITAR)
 * Ubicación: src/modules/m01-dashboardcatalogo/interfaces/color-formulario.interface.ts
 *
 * Tipos de la maqueta "ADMIN 18 - Crear / editar color" (HU-CAT-05).
 * Sincronizado con `CrearColorDto` / `ActualizarColorDto` del backend real
 * (backend/src/modules/m01-catalogo/dtos/colores.dto.ts): `nombre`, `id_marca`
 * y `cielab` son obligatorios; `codigo` es opcional.
 *
 * RF-CAT-05-01: nombre comercial obligatorio, código opcional, color asociado
 * a una marca.
 * RF-CAT-05-02: el valor cromático (CIELAB) es obligatorio y la muestra se
 * deriva de él. En la UI se captura como HEX (un color-picker es la UX
 * correcta) y el CIELAB del payload se deriva del HEX con `useColorCielab`.
 * RF-CAT-05-03: familias cromáticas administrables (`familiaClave`).
 *
 * `estado` es un concepto de UI local (publicar / borrador) que no viaja en el
 * DTO del backend — mismo tratamiento que en los demás formularios del módulo.
 *
 * Permiso M17 requerido: «Gestión del catálogo», revalidado en el servidor.
 * Pureza estricta de compilación TypeScript: 0 bytes de runtime.
 * ==============================================================================
 */
import type { OpcionSelect } from './productos.interface';
import type { EstadoColor } from './colores.interface';

export type ModoFormularioColor = 'crear' | 'editar';

/**
 * Valor cromático CIELAB tal como lo exige el backend (RF-CAT-05-02).
 * L* ∈ [0, 100]; a*, b* ∈ [-128, 128].
 */
export interface Cielab {
  l: number;
  a: number;
  b: number;
}

/** Modelo editable del color. */
export interface FormularioColor {
  nombre: string;

  /** Marca a la que pertenece el color (id_marca, obligatorio en el backend). */
  marcaId: string;

  /** Código interno opcional del color (`codigo`). */
  codigo: string;

  /** Familia cromática administrable (RF-CAT-05-03). */
  familiaClave: string;

  /** Valor cromático capturado como HEX; el `cielab` del payload se deriva de él. */
  hex: string;

  estado: EstadoColor;
}

/** Payload real enviado al backend (RF-CAT-05-01/02). */
export interface PayloadColor {
  nombre: string;
  marcaId: string;
  codigo?: string;
  cielab: Cielab;
  /** Familia cromática administrable; no forma parte del DTO mínimo del backend. */
  familiaClave: string;
  estado: EstadoColor;
}

/** Catálogos que llenan los selectores del formulario. */
export interface OpcionesFormularioColor {
  marcas: OpcionSelect[];
  familias: OpcionSelect[];
}

/** Ítem del bloque "Impacto y uso" (checklist informativo). */
export interface ImpactoColor {
  clave: string;
  etiqueta: string;
  detalle: string;
  cumple: boolean;
}

/** Datos de la tarjeta "Vista previa" y métricas de uso. */
export interface ResumenColorPrevia {
  productos: number;
  variantes: number;
  coloresRelacionados: string[];
}

/** Respuesta de crear / actualizar color. */
export interface ResultadoGuardadoColor {
  id: string;
  estado: EstadoColor;
  mensaje: string;
}
