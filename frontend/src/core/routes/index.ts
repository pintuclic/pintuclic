import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { publicStorefrontRoutes } from '@/modules/m01-catalogo/publico.routes';
import { adminCatalogoRoutes } from '@/modules/m01-catalogo/catalogo.routes';
import { m17Routes } from '@/modules/m17-permisos/m17.routes';
import { ordenesRoutes } from '@/modules/m08-ordenes/m08-ordenes.routes';

export const routes: RouteRecordRaw[] = [
  // 1. Tienda Pública / Storefront (LayoutHome maestro permanente)
  {
    path: '/',
    name: 'Tienda',
    component: () => import('@/core/layouts/LayoutHome.vue'),
    children: [
      ...publicStorefrontRoutes,
      {
        path: 'perfil',
        name: 'Perfil',
        component: () => import('@/modules/m04-cuentas/views/VistaPerfil.vue'),
      },
      // M08: sección de pedidos del cliente (pendiente de aprobación, ver reporte de parada)
      ...ordenesRoutes,
    ],
  },

  // 2. Panel Administrativo (LayoutAdmin maestro permanente con sidebar + acordeón)
  {
    path: '/admin',
    name: 'Administracion',
    component: () => import('@/core/layouts/LayoutAdmin.vue'),
    children: [
      { path: '', redirect: '/admin/catalogo' },
      ...adminCatalogoRoutes,
      ...m17Routes,
      {
        path: 'solicitudes',
        name: 'AdminSolicitudesEmpresa',
        component: () =>
          import(
            '@/modules/m04-cuentas/views/admin/VistaAprobacionEmpresas.vue'
          ),
      },
    ],
  },

  // Redirección directa para búsquedas del catálogo administrativo
  {
    path: '/admin/catalogo/busquedas',
    redirect: '/admin/catalogo/busquedas-sin-resultado',
  },

  // 3. Layout de Acceso / Auth independiente (fullscreen si aplica)
  {
    path: '/acceso',
    name: 'Acceso',
    component: () => import('@/core/layouts/LayoutAcceso.vue'),
    children: [],
  },

  // 4. Fallback: Cualquier ruta no reconocida redirige al inicio
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
