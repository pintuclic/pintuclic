import type { RouteRecordRaw } from 'vue-router'

export const m05CarritoRoutes: RouteRecordRaw[] = [
  {
    path: 'carrito',
    name: 'carrito',
    component: () => import('./views/CartView.vue'),
  },
]
