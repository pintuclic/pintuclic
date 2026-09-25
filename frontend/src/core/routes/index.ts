import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { publicStorefrontRoutes } from '@/modules/m01-catalogo/publico.routes';
import { adminCatalogoRoutes } from '@/modules/m01-dashboardcatalogo/dashboard-catalogo.routes';

export const routes: RouteRecordRaw[] = [
  // 1. Tienda Pública / Storefront (LayoutHome maestro permanente)
  {
    path: '/',
    name: 'Tienda',
    component: () => import('@/core/layouts/LayoutHome.vue'),
    children: [
      ...publicStorefrontRoutes,
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
