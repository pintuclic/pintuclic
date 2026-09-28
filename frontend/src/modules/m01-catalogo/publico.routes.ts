import type { RouteRecordRaw } from 'vue-router';

/**
 * ==============================================================================
 * M01 - RUTAS DEL STOREFRONT PÚBLICO (HIJAS DE LayoutHome '/')
 * Ubicación: src/modules/m01-catalogo/publico.routes.ts
 *
 * Se inyectan como `children` de la ruta raíz montada sobre `@/core/layouts/LayoutHome.vue`.
 * De esta manera, el header global, categorías, carrito y FooterPrincipal se
 * mantienen fijos y permanentes, sin duplicidades en las vistas.
 * ==============================================================================
 */
export const publicStorefrontRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'InicioTiendaPublica',
    component: () => import('./views/publicas/VistaInicioPublica.vue'),
    meta: {
      requiereAuth: false,
      titulo: 'Pintu Clic · Todo para tu proyecto',
    },
  },
  {
    path: 'catalogo',
    name: 'CatalogoPublico',
    component: () => import('./views/publicas/VistaCatalogoPublico.vue'),
    meta: {
      requiereAuth: false,
      titulo: 'Catálogo público · Pintu Clic',
    },
  },
  {
    path: 'productos/:productoId',
    name: 'DetalleProductoPublico',
    component: () => import('./views/publicas/VistaDetalleProductoPublico.vue'),
    props: true,
    meta: {
      requiereAuth: false,
      titulo: 'Detalle de producto · Pintu Clic',
    },
  },
  {
    path: 'productos/:productoId/calculadora',
    name: 'CalculadoraPinturaProductoPublica',
    component: () => import('./views/publicas/VistaCalculadoraPinturaPublica.vue'),
    props: true,
    meta: {
      requiereAuth: false,
      titulo: 'Calculadora de pintura · Pintu Clic',
    },
  },
  {
    path: 'paleta-colores',
    name: 'PaletaColoresPublica',
    component: () => import('./views/publicas/VistaPaletaColoresPublica.vue'),
    meta: {
      requiereAuth: false,
      titulo: 'Paleta de colores · Pintu Clic',
    },
  },
];
