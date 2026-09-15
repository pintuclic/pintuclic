<script setup lang="ts">
import { Table, Button, Icon } from "@/core/components";
import { computed, defineAsyncComponent, ref } from "vue";
import { RouterLink } from "vue-router";
import { useM17 } from "../store/useM17";
import Badge from "../components/EstadoBadge.vue";
const EmployeeForm = defineAsyncComponent(() => import("./EmployeeForm.vue"));
const creatingEmployee = ref(false);
const { state, demo } = useM17();
const columns = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'tipo', label: 'Tipo de cuenta' },
  { key: 'estado', label: 'Estado' },
  { key: 'accion', label: 'Acción' },
];
const metrics = computed(() => [
  {
    label: "Empleados activos",
    value: state.employees.filter((p) => p.estado === "activo").length,
    icon: "users",
    color: "bg-conversion/15 text-conversion-hover",
    to: "/admin/empleados",
    note: "Cuentas habilitadas",
  },
  {
    label: "Permisos disponibles",
    value: state.catalog.length,
    icon: "shield",
    color: "bg-subaction text-action",
    to: "/admin/permisos",
    note: "Acceso por persona",
  },
  {
    label: "Clientes registrados",
    value: state.clients.length,
    icon: "building",
    color: "bg-subaction/12 text-corporate",
    to: "/admin/clientes",
    note: "Particulares y empresas",
  },
  {
    label: "Empleados inactivos",
    value: state.employees.filter((p) => p.estado !== "activo").length,
    icon: "lock",
    color: "bg-highlight/20 text-neutral-dark",
    to: "/admin/empleados?estado=inactivo",
    note: "Historial conservado",
  },
]);
const quick = [
  {
    label: "Crear empleado",
    text: "Incorpora una persona a tu equipo.",
    icon: "plus",
    to: "/admin/empleados/nuevo",
    color: "bg-action text-neutral-white",
  },
  {
    label: "Asignar permisos",
    text: "Define a qué puede acceder cada empleado.",
    icon: "shield",
    to: "/admin/permisos",
    color: "bg-conversion/15 text-conversion-hover",
  },
  {
    label: "Consultar clientes",
    text: "Encuentra la información de tus clientes.",
    icon: "users",
    to: "/admin/clientes",
    color: "bg-subaction/12 text-corporate",
  },
  {
    label: "Configurar sistema",
    text: "Consulta los parámetros de tu comercio.",
    icon: "settings",
    to: "/admin/configuracion",
    color: "bg-subaction text-action",
  },
];
</script>
<template>
  <div class="mb-7 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-corporate">
        ¡Hola, administrador! <span class="text-2xl">👋</span>
      </h1>
      <p class="mt-2 text-sm text-neutral-medium">
        Aquí tienes un resumen de tu equipo y los accesos de Pintu Clic.
      </p>
    </div>
    <p class="text-left sm:text-right text-sm leading-6 text-neutral-medium">
      {{
        new Intl.DateTimeFormat("es-CO", { dateStyle: "long" }).format(
          new Date(),
        )
      }}<br />Pintu Clic Admin
    </p>
  </div>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <RouterLink
      v-for="m in metrics"
      :key="m.label"
      :to="m.to"
      class="rounded-xl border border-neutral-light/80 bg-neutral-white p-5 transition hover:border-action/40"
      ><div class="mb-4 flex items-center gap-3">
        <span class="rounded-xl p-3" :class="m.color"
          ><Icon :name="m.icon" /></span
        ><span class="text-sm font-semibold text-corporate">{{
          m.label
        }}</span>
      </div>
      <p class="text-3xl font-bold text-corporate">{{ m.value }}</p>
      <p class="mt-2 text-xs text-neutral-medium">{{ m.note }}</p></RouterLink
    >
  </div>
  <section class="my-7">
    <h2 class="mb-4 text-lg font-bold text-corporate">Accesos rápidos</h2>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="q in quick"
        :key="q.to"
        class="rounded-xl border border-neutral-light/80 bg-neutral-white p-4"
      >
        <div class="mb-4 flex gap-3">
          <span
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
            :class="q.color"
            ><Icon :name="q.icon"
          /></span>
          <div>
            <h3 class="text-sm font-semibold text-corporate">
              {{ q.label }}
            </h3>
            <p class="mt-1 text-sm leading-5 text-neutral-medium">
              {{ q.text }}
            </p>
          </div>
        </div>
        <Button
          v-if="q.to === '/admin/empleados/nuevo'"
          aria-haspopup="dialog"
          variant="action"
          size="full"
          custom-class="min-h-10 text-sm font-semibold hover:opacity-80"
          @click="creatingEmployee = true"
        >{{ q.label }}</Button>
        <RouterLink
          v-else
          :to="q.to"
          class="flex min-h-10 items-center justify-center rounded-lg text-sm font-semibold transition hover:opacity-80"
          :class="q.color"
          >{{ q.label }}</RouterLink
        >
      </div>
    </div>
  </section>
  <div class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
    <section
      class="min-w-0 rounded-xl border border-neutral-light/80 bg-neutral-white p-5"
    >
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-corporate">
            Clientes de tu comercio
          </h2>
          <p class="mt-1 text-sm text-neutral-medium">
            Consulta rápida de las cuentas registradas.
          </p>
        </div>
        <RouterLink
          to="/admin/clientes"
          class="flex items-center gap-2 text-sm font-semibold text-action"
          >Ver clientes <Icon name="arrow"
        /></RouterLink>
      </div>
      <div class="overflow-x-auto">
        <Table mobile-cards :rows="state.clients.slice(0, 5)" :columns="columns" row-key="id_usuario" caption="Clientes de tu comercio">
          <template #cell-cliente="{ row: p }">
                <p class="font-semibold text-corporate">{{ p.nombre }}</p>
                <p class="mt-1 text-xs text-neutral-medium">{{ p.correo }}</p>
              </template>
          <template #cell-tipo="{ row: p }">
                {{ p.tipo === "empresa" ? "Empresa" : "Particular" }}
              </template>
          <template #cell-estado="{ row: p }"><Badge :estado="p.estado" table /></template>
          <template #cell-accion="{ row: p }">
                <RouterLink
                  :to="`/admin/clientes/${p.id_usuario}`"
                  :aria-label="`Ver ${p.nombre}`"
                  class="text-action"
                  ><Icon name="chevron"
                /></RouterLink>
              </template>
          <template #empty>No hay clientes registrados.</template>
        </Table>
      </div>
      <div class="mt-5 rounded-lg bg-subaction/40 p-4 text-sm text-corporate">
        <strong>Un acceso para cada función.</strong> Asigna únicamente los
        permisos que necesita cada empleado.
      </div>
    </section>
    <section
      class="rounded-xl border border-neutral-light/80 bg-neutral-white p-5"
    >
      <h2 class="text-lg font-bold text-corporate">Control de acceso</h2>
      <p class="mt-1 text-sm text-neutral-medium">Administración protegida.</p>
      <div
        class="mx-auto my-6 flex h-36 w-36 flex-col items-center justify-center rounded-full border-[14px] border-conversion/20 border-t-conversion text-corporate"
      >
        <Icon name="shield" class="mb-2 h-8 w-8 text-conversion" /><strong
          class="text-3xl"
          >1</strong
        ><span class="text-xs">Administrador</span>
      </div>
      <div class="space-y-4 text-sm">
        <p class="flex justify-between">
          <span class="text-neutral-medium">Permisos</span
          ><strong>Individuales</strong>
        </p>
        <p class="flex justify-between">
          <span class="text-neutral-medium">Baja de cuentas</span
          ><strong>Lógica</strong>
        </p>
      </div>
      <div
        class="mt-5 flex gap-2 rounded-lg bg-subaction/50 p-3 text-xs leading-5 text-corporate"
      >
        <Icon name="info" />
        <p>
          {{
            demo
              ? "Vista de demostración. Los cambios se conservan solo durante esta sesión."
              : "Las operaciones se validan en el servidor con la sesión vigente."
          }}
        </p>
      </div>
    </section>
  </div>
  <EmployeeForm v-if="creatingEmployee" modal @close="creatingEmployee = false" />
</template>
