import type { RouteRecordRaw } from 'vue-router';

// || LEER LOS COMENTARIOS ||

export const attendanceRoutes: RouteRecordRaw[] = [
  {
    path: '/attendance',
    name: 'AttendanceDashboard',
    component: () => import('../views/attendance/AttendanceDashboard.vue'), // <-- Asi se importaran las vistas , usando lazy loading, da error por que la vista no exite
  }
];