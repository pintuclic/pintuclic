import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

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
      // Aqui los otros equipos inyectaran sus vistas
    ]
  },
  {
    path: '/acceso',
    name: 'Acceso',
    component: () => import('@/core/layouts/LayoutAcceso.vue'),
    children: []
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
