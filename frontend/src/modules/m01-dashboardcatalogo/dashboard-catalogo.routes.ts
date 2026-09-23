import type { RouteRecordRaw } from 'vue-router';

/**
 * ==============================================================================
 * M01 - RUTAS DEL STOREFRONT PÚBLICO (HIJAS DE LayoutHome '/')
 * Ubicación: src/modules/m01-dashboardcatalogo/dashboard-catalogo.routes.ts
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
    component: () => import('./views/VistaInicioPublica.vue'),
    meta: {
      requiereAuth: false,
      titulo: 'Pintu Clic · Todo para tu proyecto',
    },
  },
  {
    path: 'catalogo',
    name: 'CatalogoPublico',
    component: () => import('./views/VistaCatalogoPublico.vue'),
    meta: {
      requiereAuth: false,
      titulo: 'Catálogo público · Pintu Clic',
    },
  },
  {
    path: 'productos/:productoId',
    name: 'DetalleProductoPublico',
    component: () => import('./views/VistaDetalleProductoPublico.vue'),
    props: true,
    meta: {
      requiereAuth: false,
      titulo: 'Detalle de producto · Pintu Clic',
    },
  },
  {
    path: 'paleta-colores',
    name: 'PaletaColoresPublica',
    component: () => import('./views/VistaPaletaColoresPublica.vue'),
    meta: {
      requiereAuth: false,
      titulo: 'Paleta de colores · Pintu Clic',
    },
  },
];

/**
 * ==============================================================================
 * M01 - RUTAS ADMINISTRATIVAS DEL CATÁLOGO (HIJAS DE LayoutAdmin '/admin')
 *
 * Se inyectan como `children` de `/admin` sobre `@/core/layouts/LayoutAdmin.vue`.
 * Preservan el sidebar, acordeón y navegación sin parpadeos.
 * ==============================================================================
 */
export const adminCatalogoRoutes: RouteRecordRaw[] = [
  {
    path: 'catalogo',
    name: 'AdminDashboardCatalogo',
    component: () => import('./views/VistaDashboardCatalogo.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Dashboard de catálogo',
    },
  },
  {
    path: 'catalogo/productos',
    name: 'AdminProductosListado',
    component: () => import('./views/VistaProductos.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Gestión de productos',
    },
  },
  {
    path: 'catalogo/productos/nuevo',
    name: 'AdminProductoNuevo',
    component: () => import('./views/VistaProductoFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Crear nuevo producto',
    },
  },
  {
    path: 'catalogo/productos/:productoId',
    name: 'AdminProductoDetalle',
    component: () => import('./views/VistaProductoDetalle.vue'),
    props: true,
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Detalle del producto',
    },
  },
  {
    path: 'catalogo/productos/:productoId/editar',
    name: 'AdminProductoEditar',
    component: () => import('./views/VistaProductoFormulario.vue'),
    props: true,
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Editar producto',
    },
  },
  {
    path: 'catalogo/variantes',
    name: 'AdminVariantesListado',
    component: () => import('./views/VistaVariantes.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Gestión de variantes',
    },
  },
  {
    path: 'catalogo/variantes/nueva',
    name: 'AdminVarianteNueva',
    component: () => import('./views/VistaVarianteFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Crear nueva variante',
    },
  },
  {
    path: 'catalogo/variantes/:varianteId/editar',
    name: 'AdminVarianteEditar',
    component: () => import('./views/VistaVarianteFormulario.vue'),
    props: true,
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Editar variante',
    },
  },
  {
    path: 'catalogo/categorias',
    name: 'AdminCategorias',
    component: () => import('./views/VistaCategorias.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Categorías y subcategorías',
    },
  },
  {
    path: 'catalogo/categorias/nueva',
    name: 'AdminCategoriaNueva',
    component: () => import('./views/VistaCategoriaFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Crear categoría',
    },
  },
  {
    path: 'catalogo/categorias/subcategorias/nueva',
    name: 'AdminSubcategoriaNueva',
    component: () => import('./views/VistaCategoriaFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Crear subcategoría',
    },
  },
  {
    path: 'catalogo/categorias/:categoriaId/editar',
    name: 'AdminCategoriaEditar',
    component: () => import('./views/VistaCategoriaFormulario.vue'),
    props: true,
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Editar categoría',
    },
  },
  {
    path: 'catalogo/marcas',
    name: 'AdminMarcas',
    component: () => import('./views/VistaMarcas.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Marcas',
    },
  },
  {
    path: 'catalogo/marcas/nueva',
    name: 'AdminMarcaNueva',
    component: () => import('./views/VistaMarcaFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Crear marca',
    },
  },
  {
    path: 'catalogo/marcas/:marcaId',
    name: 'AdminMarcaDetalle',
    component: () => import('./views/VistaMarcaDetalle.vue'),
    props: true,
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Detalle de marca',
    },
  },
  {
    path: 'catalogo/marcas/:marcaId/editar',
    name: 'AdminMarcaEditar',
    component: () => import('./views/VistaMarcaFormulario.vue'),
    props: true,
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Editar marca',
    },
  },
  {
    path: 'catalogo/colores',
    name: 'AdminColores',
    component: () => import('./views/VistaColores.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Gestión de colores',
    },
  },
  {
    path: 'catalogo/busquedas-sin-resultado',
    name: 'AdminBusquedasSinResultado',
    component: () => import('./views/VistaBusquedas.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Búsquedas sin resultado',
    },
  },
];

/**
 * Agrupador compuesto para compatibilidad con imports existentes
 */
export const dashboardCatalogoRoutes: RouteRecordRaw[] = [
  ...publicStorefrontRoutes.map((r) => ({
    ...r,
    path: r.path ? `/${r.path}` : '/',
  })),
  ...adminCatalogoRoutes.map((r) => ({
    ...r,
    path: `/admin/${r.path}`,
  })),
];
