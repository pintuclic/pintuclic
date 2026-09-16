import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { dashboardCatalogoRoutes } from '@/modules/m01-dashboardcatalogo/dashboard-catalogo.routes';

/**
 * ==============================================================================
 * RUTAS DE LA APLICACIÓN
 * Ubicación: src/core/routes/index.ts
 *
 * Árbol de rutas con tres layouts raíz (LayoutHome, LayoutAdmin, LayoutAcceso).
 * Cada módulo admin cuelga sus vistas como `children` de `/admin`; como esas
 * rutas ya traen path absoluto (p. ej. `/admin/catalogo/productos`), vue-router
 * las resuelve igual sin necesidad de reescribirlas como relativas.
 * ==============================================================================
 */
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

  // 2. Panel Administrativo (LayoutAdmin puro, sin M01 inyectado)
  {
    path: '/admin',
    name: 'Administracion',
    component: () => import('@/core/layouts/LayoutAdmin.vue'),
    children: [
      // M01 · Panel de catálogo (dashboard, productos, variantes, categorías,
      // marcas, colores, búsquedas sin resultado).
      ...dashboardCatalogoRoutes,
    ],
  },

  // 3. Layout de Acceso / Auth independiente
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
