import { useRouter } from 'vue-router';

/**
 * ==============================================================================
 * M01 - NAVEGACIÓN INTERNA DEL PANEL DE CATÁLOGO
 * Ubicación: src/modules/m01-dashboardcatalogo/composables/usePanelNavegacion.ts
 *
 * `dashboardCatalogoRoutes` registra cada vista con su URL real bajo
 * `/admin/catalogo/**`; `irA()` traduce el destino (path o clave corta) a esa
 * URL y navega con `router.push`. Si no hay router montado (tests, render
 * aislado), `irA()` es inerte.
 * ==============================================================================
 */

export type ClaveVistaPanel =
  | 'dashboard'
  | 'productos'
  | 'producto-formulario'
  | 'producto-detalle'
  | 'variantes'
  | 'variante-formulario'
  | 'categorias'
  | 'categoria-formulario'
  | 'marcas'
  | 'marca-formulario'
  | 'marca-detalle'
  | 'lineas'
  | 'linea-formulario'
  | 'colores'
  | 'color-formulario'
  | 'busquedas';

export interface PanelNavegacion {
  /** Navega a una ruta interna del panel; acepta el path completo o la clave. */
  irA: (destino: string) => void;
}

export function usePanelNavegacion(): PanelNavegacion {
  const router = useRouter();
  return {
    irA: (destino: string): void => {
      const { clave, parametro } = resolverRutaPanel(destino);
      if (!clave || !router) return;
      void router.push(rutaRealPanel(clave, parametro));
    },
  };
}

/**
 * Inverso de `resolverRutaPanel`: traduce la clave de vista (y su parámetro)
 * al `path` real registrado en `dashboardCatalogoRoutes`.
 */
export function rutaRealPanel(
  clave: ClaveVistaPanel,
  parametro: string | null = null
): string {
  switch (clave) {
    case 'productos':
      return '/admin/catalogo/productos';
    case 'producto-formulario':
      return parametro
        ? `/admin/catalogo/productos/${parametro}/editar`
        : '/admin/catalogo/productos/nuevo';
    case 'producto-detalle':
      return parametro
        ? `/admin/catalogo/productos/${parametro}`
        : '/admin/catalogo/productos';
    case 'variantes':
      return '/admin/catalogo/variantes';
    case 'variante-formulario':
      return parametro
        ? `/admin/catalogo/variantes/${parametro}/editar`
        : '/admin/catalogo/variantes/nueva';
    case 'categorias':
      return '/admin/catalogo/categorias';
    case 'categoria-formulario':
      if (parametro === 'nueva-subcategoria') {
        return '/admin/catalogo/categorias/subcategorias/nueva';
      }
      return parametro && parametro !== 'nueva-categoria'
        ? `/admin/catalogo/categorias/${parametro}/editar`
        : '/admin/catalogo/categorias/nueva';
    case 'marcas':
      return '/admin/catalogo/marcas';
    case 'marca-formulario':
      return parametro
        ? `/admin/catalogo/marcas/${parametro}/editar`
        : '/admin/catalogo/marcas/nueva';
    case 'marca-detalle':
      return parametro ? `/admin/catalogo/marcas/${parametro}` : '/admin/catalogo/marcas';
    case 'lineas':
      return '/admin/catalogo/lineas';
    case 'linea-formulario':
      return parametro
        ? `/admin/catalogo/lineas/${parametro}/editar`
        : '/admin/catalogo/lineas/nueva';
    case 'colores':
      return '/admin/catalogo/colores';
    case 'color-formulario':
      return parametro
        ? `/admin/catalogo/colores/${parametro}/editar`
        : '/admin/catalogo/colores/nuevo';
    case 'busquedas':
      return '/admin/catalogo/busquedas-sin-resultado';
    case 'dashboard':
    default:
      return '/admin/catalogo';
  }
}

/**
 * Traduce un path interno (`/admin/catalogo/...`) o una clave a la vista y
 * su parámetro. Devuelve `clave: null` para rutas sin vista propia
 * (reportes, configuración, acciones de fila…): en ese caso `irA()` no navega.
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

  const edicion = ruta.match(/^productos\/([^/]+)\/editar$/);
  if (edicion?.[1]) return { clave: 'producto-formulario', parametro: edicion[1] };

  const detalle = ruta.match(/^productos\/([^/]+)$/);
  if (detalle?.[1] && detalle[1] !== 'nuevo') {
    return { clave: 'producto-detalle', parametro: detalle[1] };
  }

  if (ruta === 'productos') return { clave: 'productos', parametro: null };

  if (ruta === 'variantes/nueva') return { clave: 'variante-formulario', parametro: null };
  const varEdicion = ruta.match(/^variantes\/([^/]+)\/(editar|duplicar)$/);
  if (varEdicion?.[1]) {
    return {
      clave: 'variante-formulario',
      parametro: varEdicion[2] === 'duplicar' ? null : varEdicion[1],
    };
  }
  if (ruta.startsWith('variantes')) return { clave: 'variantes', parametro: null };
  if (ruta === 'categorias/nueva') {
    return { clave: 'categoria-formulario', parametro: 'nueva-categoria' };
  }
  if (ruta === 'categorias/subcategorias/nueva') {
    return { clave: 'categoria-formulario', parametro: 'nueva-subcategoria' };
  }
  const catEdicion = ruta.match(/^categorias\/([^/]+)\/editar$/);
  if (catEdicion?.[1]) return { clave: 'categoria-formulario', parametro: catEdicion[1] };
  if (ruta.startsWith('categorias')) return { clave: 'categorias', parametro: null };

  // Líneas comerciales (sección propia en el menú).
  if (ruta === 'lineas/nueva') return { clave: 'linea-formulario', parametro: null };
  const lineaEdicion = ruta.match(/^lineas\/([^/]+)\/editar$/);
  if (lineaEdicion?.[1]) return { clave: 'linea-formulario', parametro: lineaEdicion[1] };
  if (ruta.startsWith('lineas')) return { clave: 'lineas', parametro: null };

  if (ruta === 'marcas/nueva') return { clave: 'marca-formulario', parametro: null };
  const marcaEdicion = ruta.match(/^marcas\/([^/]+)\/editar$/);
  if (marcaEdicion?.[1]) return { clave: 'marca-formulario', parametro: marcaEdicion[1] };
  const marcaDetalle = ruta.match(/^marcas\/([^/]+)$/);
  if (marcaDetalle?.[1] && marcaDetalle[1] !== 'nueva') {
    return { clave: 'marca-detalle', parametro: marcaDetalle[1] };
  }
  if (ruta.startsWith('marcas')) return { clave: 'marcas', parametro: null };

  if (ruta === 'colores/nuevo') return { clave: 'color-formulario', parametro: null };
  const colorEdicion = ruta.match(/^colores\/([^/]+)\/editar$/);
  if (colorEdicion?.[1]) return { clave: 'color-formulario', parametro: colorEdicion[1] };
  if (ruta.startsWith('colores')) return { clave: 'colores', parametro: null };

  if (ruta.startsWith('busquedas')) return { clave: 'busquedas', parametro: null };

  return { clave: null, parametro: null };
}
