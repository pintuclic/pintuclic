import type { RouteRecordRaw } from 'vue-router';
import { dashboardCatalogoRoutes } from '@/modules/m01-dashboardcatalogo/dashboard-catalogo.routes';

/**
 * ==============================================================================
 * RUTAS DE LA APLICACIÓN
 * Ubicación: src/core/routes/index.ts
 *
 * Cada módulo exporta su propio arreglo de rutas y aquí se agregan con spread.
 * `main.ts` monta el router con este arreglo.
 * ==============================================================================
 */
export const routes: RouteRecordRaw[] = [
  // M01 · Storefront público y panel de catálogo.
  ...dashboardCatalogoRoutes,

  // Cualquier otra ruta vuelve al inicio.
  { path: '/:pathMatch(.*)*', redirect: '/' },
];
