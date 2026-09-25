import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
<<<<<<< HEAD
import { publicStorefrontRoutes } from '@/modules/m01-catalogo/publico.routes';
import { adminCatalogoRoutes } from '@/modules/m01-dashboardcatalogo/dashboard-catalogo.routes';

export const routes: RouteRecordRaw[] = [
  // 1. Tienda Pública / Storefront (LayoutHome maestro permanente)
=======
import { adminCatalogoRoutes } from '@/modules/m01-catalogo/catalogo.routes';

export const routes: RouteRecordRaw[] = [
  // 1. Portal Público / Tienda (LayoutHome)
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  {
    path: '/',
    name: 'Tienda',
    component: () => import('@/core/layouts/LayoutHome.vue'),
    children: [
<<<<<<< HEAD
      ...publicStorefrontRoutes,
    ],
  },

  // 2. Panel Administrativo (LayoutAdmin maestro permanente con sidebar + acordeón)
=======
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
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  {
    path: '/admin',
    name: 'Administracion',
    component: () => import('@/core/layouts/LayoutAdmin.vue'),
    children: [
<<<<<<< HEAD
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
=======
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
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  {
    path: '/acceso',
    name: 'Acceso',
    component: () => import('@/core/layouts/LayoutAcceso.vue'),
<<<<<<< HEAD
    children: [],
  },

=======
    children: []
  },
  
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  // 4. Fallback: Cualquier ruta no reconocida redirige al inicio
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
<<<<<<< HEAD
  },
=======
  }
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

export default router;
