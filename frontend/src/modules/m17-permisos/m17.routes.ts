import type { RouteRecordRaw } from 'vue-router';

export const m17Routes: RouteRecordRaw[] = [{
  path: '',
  component: () => import('./M17Shell.vue'),
  children: [
        { path: "", component: () => import("./views/Dashboard.vue"), meta: { title: "Dashboard" } },
        {
          path: "empleados", alias: "usuarios",
          component: () => import("./views/PeopleList.vue"),
          props: { kind: "empleados" },
          meta: { title: "Empleados" },
        },
        {
          path: "empleados/nuevo",
          component: () => import("./views/EmployeeForm.vue"),
          meta: { title: "Nuevo empleado" },
        },
        {
          path: "empleados/:id/editar",
          component: () => import("./views/EmployeeForm.vue"),
          meta: { title: "Editar empleado" },
        },
        {
          path: "empleados/:id",
          component: () => import("./views/PersonDetail.vue"),
          props: { kind: "empleados" },
          meta: { title: "Ficha del empleado" },
        },
        {
          path: "clientes",
          component: () => import("./views/PeopleList.vue"),
          props: { kind: "clientes" },
          meta: { title: "Clientes" },
        },
        {
          path: "clientes/:id",
          component: () => import("./views/PersonDetail.vue"),
          props: { kind: "clientes" },
          meta: { title: "Ficha del cliente" },
        },
        {
          path: "permisos", alias: "roles",
          component: () => import("./views/Permissions.vue"),
          meta: { title: "Permisos y accesos" },
        },
        {
          path: "configuracion",
          component: () => import("./views/Configuration.vue"),
          meta: { title: "Configuración" },
        },
        {
          path: "administrador",
          redirect: "/admin/perfil",
        },
        {
          path: "perfil",
          component: () => import("./views/Profile.vue"),
          meta: { title: "Mi perfil" },
        },
        {
          path: ":pathMatch(.*)*",
          component: () => import("./views/NotFound.vue"),
          meta: { title: "Página no encontrada" },
        },

  ],
}];
