import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { dashboardCatalogoRoutes } from '@/modules/m01-dashboardcatalogo/dashboard-catalogo.routes';

export const routes: RouteRecordRaw[] = [
  // 1. Portal Público / Tienda (LayoutHome)
  {
    path: '/',
    name: 'Tienda',
    component: () => import('@/core/layouts/LayoutHome.vue'),
    children: [
      {
        path: '',
        name: 'Inicio',
        component: () => import('@/modules/m02-productos/views/VistaInicio.vue'),
      },
    ],
  },

  // 2. Módulo M01: Panel Administrativo de Catálogo
  ...dashboardCatalogoRoutes,

  // Redirección y alias para enlaces directos de catálogo
  {
    path: '/admin/catalogo/busquedas',
    redirect: '/admin/catalogo/busquedas-sin-resultado',
  },

  // Redirección raíz de administración al dashboard principal
  {
    path: '/admin',
    name: 'Administracion',
    redirect: '/admin/catalogo',
  },

  // 3. Layout de Acceso / Auth independiente (para vistas de login/recuperación fullscreen si aplica)
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
