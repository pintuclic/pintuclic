import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { dashboardCatalogoRoutes } from '@/modules/m01-dashboardcatalogo/dashboard-catalogo.routes';

/**
 * Agregador global de rutas. Cada módulo conserva la propiedad de sus vistas y
 * exporta sus registros; los layouts globales quedan disponibles para los
 * módulos que todavía no cuentan con un shell autocontenido.
 */
export const routes: RouteRecordRaw[] = [
  ...dashboardCatalogoRoutes,
  {
    path: '/admin',
    name: 'Administracion',
    component: () => import('@/core/layouts/LayoutAdmin.vue'),
    children: [
      { path: '', redirect: '/admin/catalogo' },
    ],
  },
  {
    path: '/acceso',
    name: 'Acceso',
    component: () => import('@/core/layouts/LayoutAcceso.vue'),
    children: [],
  },
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
