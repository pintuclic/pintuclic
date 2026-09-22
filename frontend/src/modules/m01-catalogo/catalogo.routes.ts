import type { RouteRecordRaw } from 'vue-router';

/**
 * ==============================================================================
 * M01 - RUTAS DEL PANEL DE CATÁLOGO (hijas de `/admin` sobre LayoutAdmin)
 * Ubicación: src/modules/m01-catalogo/catalogo.routes.ts
 *
 * Conserva exactamente los paths que ya enlaza el sidebar del core
 * (productos, variantes, categorías, líneas, marcas y colores). La autorización
 * real la aplica el backend con los permisos `catalogo.*` en cada endpoint.
 * ==============================================================================
 */
export const adminCatalogoRoutes: RouteRecordRaw[] = [
  { path: '/admin/catalogo', redirect: '/admin/catalogo/productos' },
  {
    path: '/admin/catalogo/productos',
    name: 'M01Productos',
    component: () => import('./views/admin/VistaProductos.vue'),
    meta: { titulo: 'Productos · Catálogo' },
  },
  {
    path: '/admin/catalogo/productos/:productoId(\\d+)',
    name: 'M01ProductoDetalle',
    component: () => import('./views/admin/VistaProductoDetalle.vue'),
    meta: { titulo: 'Ficha de producto · Catálogo' },
  },
  {
    path: '/admin/catalogo/variantes',
    name: 'M01Variantes',
    component: () => import('./views/admin/VistaVariantes.vue'),
    meta: { titulo: 'Variantes · Catálogo' },
  },
  {
    path: '/admin/catalogo/categorias',
    name: 'M01Categorias',
    component: () => import('./views/admin/VistaCategorias.vue'),
    meta: { titulo: 'Categorías · Catálogo' },
  },
  {
    path: '/admin/catalogo/marcas',
    name: 'M01Marcas',
    component: () => import('./views/admin/VistaMarcas.vue'),
    meta: { titulo: 'Marcas · Catálogo' },
  },
  // Líneas, bases y colores pertenecen siempre a una marca: una sola vista los atiende.
  {
    path: '/admin/catalogo/marcas/:marcaId(\\d+)',
    name: 'M01MarcaDetalle',
    component: () => import('./views/admin/VistaPorMarca.vue'),
    meta: { titulo: 'Marca · Catálogo', recurso: 'lineas' },
  },
  {
    path: '/admin/catalogo/lineas',
    name: 'M01Lineas',
    component: () => import('./views/admin/VistaPorMarca.vue'),
    meta: { titulo: 'Líneas · Catálogo', recurso: 'lineas' },
  },
  {
    path: '/admin/catalogo/colores',
    name: 'M01Colores',
    component: () => import('./views/admin/VistaPorMarca.vue'),
    meta: { titulo: 'Colores · Catálogo', recurso: 'colores' },
  },
  {
    path: '/admin/catalogo/configuracion',
    name: 'M01CatalogosBase',
    component: () => import('./views/admin/VistaCatalogosBase.vue'),
    meta: { titulo: 'Resinas y presentaciones · Catálogo' },
  },
];
