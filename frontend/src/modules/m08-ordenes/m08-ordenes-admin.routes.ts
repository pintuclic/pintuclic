import type { RouteRecordRaw } from 'vue-router';

/**
 * ==============================================================================
 * M08 - RUTAS DEL PERSONAL (HU-ORD-01, HU-ORD-03, HU-ORD-05)
 * Ubicación: src/modules/m08-ordenes/m08-ordenes-admin.routes.ts
 *
 * Viven en su propio archivo, separadas de las del cliente, porque las dos partes
 * del módulo se entregan por separado: la del cliente tiene su diseño aprobado y la
 * del personal todavía no. Mientras ese diseño no se apruebe, basta con no incluir
 * este archivo en la entrega: las rutas del cliente no lo necesitan para nada.
 *
 * Cuelgan de LayoutAdmin. El control de acceso real lo hace el servidor
 * (`ventas.ver` para consultar y `ventas.gestionar` para cambiar estados): estas
 * rutas no deben confiar en ninguna comprobación hecha en el navegador.
 * ==============================================================================
 */
export const ordenesAdminRoutes: RouteRecordRaw[] = [
  {
    path: 'ordenes',
    name: 'AdminGestionOrdenes',
    component: () => import('./views/admin/VistaGestionOrdenes.vue'),
  },
  {
    path: 'ordenes/:codigo',
    name: 'AdminDetalleOrden',
    props: true,
    component: () => import('./views/admin/VistaDetalleOrdenAdmin.vue'),
  },
];
