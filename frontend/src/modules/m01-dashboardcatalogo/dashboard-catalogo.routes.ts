import type { RouteRecordRaw } from 'vue-router';

/**
 * ==============================================================================
 * M01 - RUTAS DEL PANEL DE CATÁLOGO
 * Ubicación: src/modules/m01-dashboardcatalogo/dashboard-catalogo.routes.ts
 *
 * Se exportan para que el router del panel administrativo (aún por montar,
 * ver App.vue / main.ts) las agregue con `...dashboardCatalogoRoutes`.
 * Carga diferida (lazy loading) por vista, igual que en core/routes.
 *
 * `meta.permiso` documenta el permiso de M17 que el guard de navegación y,
 * sobre todo, el backend deben exigir (Seguridad por Defecto).
 * ==============================================================================
 */
export const dashboardCatalogoRoutes: RouteRecordRaw[] = [
  {
    path: '/admin/catalogo',
    name: 'AdminDashboardCatalogo',
    component: () => import('./views/VistaDashboardCatalogo.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Dashboard de catálogo',
    },
  },
  {
    path: '/admin/catalogo/productos',
    name: 'AdminProductosListado',
    component: () => import('./views/VistaProductos.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Gestión de productos',
    },
  },
  {
    path: '/admin/catalogo/productos/nuevo',
    name: 'AdminProductoNuevo',
    component: () => import('./views/VistaProductoFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Crear nuevo producto',
    },
  },
  {
    path: '/admin/catalogo/productos/:productoId',
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
    path: '/admin/catalogo/productos/:productoId/editar',
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
    path: '/admin/catalogo/variantes',
    name: 'AdminVariantesListado',
    component: () => import('./views/VistaVariantes.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Gestión de variantes',
    },
  },
  {
    path: '/admin/catalogo/variantes/nueva',
    name: 'AdminVarianteNueva',
    component: () => import('./views/VistaVarianteFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_PRODUCTOS',
      titulo: 'Crear nueva variante',
    },
  },
  {
    path: '/admin/catalogo/variantes/:varianteId/editar',
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
    path: '/admin/catalogo/categorias',
    name: 'AdminCategorias',
    component: () => import('./views/VistaCategorias.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Categorías y subcategorías',
    },
  },
  {
    path: '/admin/catalogo/categorias/nueva',
    name: 'AdminCategoriaNueva',
    component: () => import('./views/VistaCategoriaFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Crear categoría',
    },
  },
  {
    path: '/admin/catalogo/categorias/subcategorias/nueva',
    name: 'AdminSubcategoriaNueva',
    component: () => import('./views/VistaCategoriaFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Crear subcategoría',
    },
  },
  {
    path: '/admin/catalogo/categorias/:categoriaId/editar',
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
    path: '/admin/catalogo/marcas',
    name: 'AdminMarcas',
    component: () => import('./views/VistaMarcas.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Marcas',
    },
  },
  {
    path: '/admin/catalogo/marcas/nueva',
    name: 'AdminMarcaNueva',
    component: () => import('./views/VistaMarcaFormulario.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Crear marca',
    },
  },
  {
    path: '/admin/catalogo/marcas/:marcaId',
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
    path: '/admin/catalogo/marcas/:marcaId/editar',
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
    path: '/admin/catalogo/colores',
    name: 'AdminColores',
    component: () => import('./views/VistaColores.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Gestión de colores',
    },
  },
  {
    path: '/admin/catalogo/busquedas-sin-resultado',
    name: 'AdminBusquedasSinResultado',
    component: () => import('./views/VistaBusquedas.vue'),
    meta: {
      requiereAuth: true,
      permiso: 'GESTION_CATALOGO',
      titulo: 'Búsquedas sin resultado',
    },
  },
];
