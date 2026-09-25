import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { adminCatalogoRoutes } from '@/modules/m01-catalogo/catalogo.routes';

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
      {
        path: 'perfil',
        name: 'Perfil',
        component: () => import('@/modules/m04-cuentas/views/VistaPerfil.vue'),
      },
    ],
  },

  // 2. Panel Administrativo (LayoutAdmin con M01 Catálogo y M04 Cuentas)
  {
    path: '/admin',
    name: 'Administracion',
    component: () => import('@/core/layouts/LayoutAdmin.vue'),
    children: [
      ...adminCatalogoRoutes,
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

  // 3. Layout de Acceso / Auth independiente
  {
    path: '/acceso',
    name: 'Acceso',
    component: () => import('@/core/layouts/LayoutAcceso.vue'),
    children: []
  },
  
  // 4. Fallback: Cualquier ruta no reconocida redirige al inicio
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
