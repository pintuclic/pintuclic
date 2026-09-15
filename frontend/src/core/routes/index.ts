import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { m17Routes } from '@/modules/m17-permisos/m17.routes';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Tienda',
    component: () => import('@/core/layouts/LayoutHome.vue'),
    children: [
      {
        path: '',
        name: 'Inicio',
        component: () => import('@/modules/m02-productos/views/VistaInicio.vue')
      }
    ]
  },
  {
    path: '/admin',
    name: 'Administracion',
    component: () => import('@/core/layouts/LayoutAdmin.vue'),
    children: [
      ...m17Routes,
    ]
  },
  {
    path: '/acceso',
    name: 'Acceso',
    component: () => import('@/core/layouts/LayoutAcceso.vue'),
    children: []
  },
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
