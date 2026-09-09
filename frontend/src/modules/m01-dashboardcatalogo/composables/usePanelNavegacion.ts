import { inject, ref } from 'vue';
import type { InjectionKey, Ref } from 'vue';

/**
 * ==============================================================================
 * M01 - NAVEGACIÓN INTERNA DEL PANEL DE CATÁLOGO
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/usePanelNavegacion.ts
 *
 * Mientras el panel administrativo no monte `vue-router`, `VistaPanelCatalogo.vue`
 * actúa de "shell": mantiene la vista activa y la cambia con `<component :is>`.
 * Este composable expone esa API a cualquier vista/componente por `inject`.
 *
 * Si una vista se monta suelta (sin shell), devuelve una implementación inerte:
 * `irA()` no hace nada, igual que el marcador de posición anterior.
 * ==============================================================================
 */

export type ClaveVistaPanel =
  | 'dashboard'
  | 'productos'
  | 'producto-formulario'
  | 'variantes'
  | 'categorias'
  | 'marcas'
  | 'colores'
  | 'busquedas';

export interface PanelNavegacion {
  /** Vista actualmente visible en el shell. */
  vistaActiva: Ref<ClaveVistaPanel>;
  /** Parámetro de ruta (p. ej. el id de producto al editar). */
  parametro: Ref<string | null>;
  /** Navega a una ruta interna del panel; acepta el path completo o la clave. */
  irA: (destino: string) => void;
}

export const NAV_PANEL_CATALOGO = Symbol('nav-panel-catalogo') as InjectionKey<PanelNavegacion>;

export function usePanelNavegacion(): PanelNavegacion {
  return inject(NAV_PANEL_CATALOGO, {
    vistaActiva: ref<ClaveVistaPanel>('dashboard'),
    parametro: ref<string | null>(null),
    irA: () => {},
  });
}

/**
 * Traduce un path interno (`/admin/catalogo/...`) o una clave a la vista del
 * shell y su parámetro. Devuelve `clave: null` para rutas sin vista propia
 * (reportes, configuración, acciones de fila…): en ese caso el shell no cambia.
 */
export function resolverRutaPanel(destino: string): {
  clave: ClaveVistaPanel | null;
  parametro: string | null;
} {
  const ruta = destino
    .replace(/^\/+/, '')
    .replace(/^admin\/catalogo\/?/, '')
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '');

  if (ruta === '' || ruta === 'dashboard') return { clave: 'dashboard', parametro: null };
  if (ruta === 'productos/nuevo') return { clave: 'producto-formulario', parametro: null };

  const edicion = ruta.match(/^productos\/([^/]+)(?:\/editar)?$/);
  const idProducto = edicion?.[1];
  if (idProducto && idProducto !== 'nuevo') {
    return { clave: 'producto-formulario', parametro: idProducto };
  }

  if (ruta === 'productos') return { clave: 'productos', parametro: null };
  if (ruta.startsWith('variantes')) return { clave: 'variantes', parametro: null };
  if (ruta.startsWith('categorias')) return { clave: 'categorias', parametro: null };
  if (ruta.startsWith('marcas')) return { clave: 'marcas', parametro: null };
  if (ruta.startsWith('colores')) return { clave: 'colores', parametro: null };
  if (ruta.startsWith('busquedas')) return { clave: 'busquedas', parametro: null };

  return { clave: null, parametro: null };
}
