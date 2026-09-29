import type { RouteRecordRaw } from 'vue-router';
// import VistaCuentas from './views/VistaCuentas.vue';

export const cuentasRoutes: RouteRecordRaw[] = [
  {
    path: '/perfil',
    name: 'Perfil',
    component: () => import('./views/VistaPerfil.vue'),
  },
];
