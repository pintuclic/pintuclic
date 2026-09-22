<script setup lang="ts">
import { Table, Paginacion, Button, IconButton, Icon, Drawer, PageHeader, Badge, Input, Select, SinResultados } from "@/core/components";
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { useM17 } from "../store/useM17";
import type { TableColumn } from "@/core/types/table.type";
import type { Persona } from "../interfaces";
import StatusModal from "../components/StatusModal.vue";
const PersonDetail = defineAsyncComponent(() => import("./PersonDetail.vue"));
const viewingClient = ref<number | null>(null);
const EmployeeForm = defineAsyncComponent(() => import("./EmployeeForm.vue"));
const creatingEmployee = ref(false);
const props = defineProps<{ kind: "empleados" | "clientes" }>();
const { state, isAdmin, refresh } = useM17();
const route = useRoute();
const q = ref(String(route.query.q || ""));
const status = ref(String(route.query.estado || ""));
const type = ref("");
const page = ref(1);
const selected = ref<Persona | null>(null);
const isEmployees = computed(() => props.kind === "empleados");
const columns = computed<TableColumn[]>(() => [
  { key: 'nombre', label: isEmployees.value ? 'Empleado' : 'Cliente' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
]);
const rows = computed(() =>
  isEmployees.value ? state.employees : state.clients,
);
const filtered = computed(() =>
  rows.value
    .filter(
      (p) =>
        (!status.value || p.estado === status.value) &&
        (!type.value || p.tipo === type.value) &&
        `${p.nombre} ${p.correo}`
          .toLocaleLowerCase("es")
          .includes(q.value.toLocaleLowerCase("es").trim()),
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
);
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 8)));
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * 8, page.value * 8),
);
watch([q, status, type, () => props.kind], () => (page.value = 1));
watch(
  () => route.query.q,
  (v) => (q.value = String(v || "")),
);
watch(
  () => route.query.estado,
  (v) => (status.value = String(v || "")),
);
watch(pages, (n) => (page.value = Math.min(page.value, n)));
function exportCsv() {
  const cell = (s: unknown) =>
    '"' +
    String(s ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const csv = [
    ["Nombre", "Correo", "Teléfono", "Estado"],
    ...filtered.value.map((p) => [p.nombre, p.correo, p.telefono, p.estado]),
  ]
    .map((r) => r.map(cell).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${props.kind}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>
<template>
  <PageHeader
    :title="isEmployees ? 'Gestión de empleados' : 'Gestión de clientes'"
    :description="
      isEmployees
        ? 'Administra tu equipo y mantén sus accesos al día.'
        : 'Consulta la información de tus clientes desde un solo lugar.'
    "
    ><Button variant="outline" icon="download" :disabled="!filtered.length" @click="exportCsv"
      >Exportar</Button
    ><Button variant="action" icon="plus"
      v-if="isEmployees"
      type="button"
      aria-haspopup="dialog"
      @click="creatingEmployee = true"
      >Nuevo empleado</Button
    ></PageHeader
  >
  <div class="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
    <div
      v-for="metric in [
        {
          label: isEmployees ? 'Total de empleados' : 'Total de clientes',
          value: rows.length,
          icon: 'users',
        },
        {
          label: 'Cuentas activas',
          value: rows.filter((p) => p.estado === 'activo').length,
          icon: 'check',
        },
        {
          label: 'Cuentas inactivas',
          value: rows.filter((p) => p.estado !== 'activo').length,
          icon: 'lock',
        },
      ]"
      :key="metric.label"
      class="flex items-center gap-4 rounded-xl border border-neutral-light bg-neutral-white p-5"
    >
      <span class="rounded-xl bg-subaction/50 p-3 text-action"
        ><Icon :name="metric.icon"
      /></span>
      <div>
        <p class="text-xs text-neutral-medium">{{ metric.label }}</p>
        <p class="mt-1 text-2xl font-bold text-corporate">
          {{ metric.value }}
        </p>
      </div>
    </div>
  </div>
  <section class="rounded-xl border border-neutral-light bg-neutral-white">
    <div
      class="flex flex-col items-stretch gap-4 border-b border-neutral-light p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-5"
    >
      <Input v-model="q" :label="`Buscar ${isEmployees ? 'empleado' : 'cliente'}`" icon="search"
        placeholder="Nombre o correo electrónico" class="min-w-0 flex-1 sm:min-w-48" /><Select label="Estado"
          v-model="status"
          class="sm:w-48"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="bloqueado">Bloqueado</option>
          <option value="pendiente">Pendiente</option>
        </Select><Select v-if="!isEmployees" label="Tipo"
          v-model="type"
          class="sm:w-48"
        >
          <option value="">Todos los tipos</option>
          <option value="normal">Persona natural</option>
          <option value="empresa">Empresa</option>
        </Select><Button variant="outline"
        icon="refresh"
        aria-label="Actualizar listado"
        :disabled="state.loading"
        @click="refresh"
      />
    </div>
    <Table mobile-cards :rows="visible" :columns="columns" row-key="id_usuario" :caption="isEmployees ? 'Empleados' : 'Clientes'" :loading="state.loading">
      <template #cell-nombre="{ row: p }">
              <RouterLink
                :to="`/admin/${kind}/${p.id_usuario}`"
                class="flex items-center gap-3 font-semibold text-corporate hover:text-action"
                ><span
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-subaction/65 font-medium text-action"
                  >{{
                    p.nombre
                      .split(" ")
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  }}</span
                ><span
                  >{{ p.nombre
                  }}<small class="mt-1 block font-normal text-neutral-medium">{{
                    isEmployees
                      ? "Empleado"
                      : p.tipo === "empresa"
                        ? "Empresa"
                        : "Persona natural"
                  }}</small></span
                ></RouterLink
              >
            </template>
      <template #cell-contacto="{ row: p }">
              <p>{{ p.correo }}</p>
              <p class="mt-1 text-xs text-neutral-medium">
                {{ p.telefono || "Sin teléfono registrado" }}
              </p>
            </template>
      <template #cell-estado="{ row: p }"><Badge :estado="p.estado" table /></template>
      <template #cell-acciones="{ row: p }">
              <div class="flex justify-end gap-2">
                <IconButton class="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
                  v-if="isEmployees"
                  :to="`/admin/${kind}/${p.id_usuario}${isEmployees ? '/editar' : ''}`"
                  icon="edit"
                  tone="neutral"
                  :label="`Editar a ${p.nombre}`"
                />
                <IconButton class="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
                  v-else
                  has-popup="dialog"
                  icon="eye"
                  tone="action"
                  :label="`Ver a ${p.nombre}`"
                  @click="viewingClient = p.id_usuario"
                />
                <IconButton class="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
                  v-if="isEmployees"
                  :to="{ path: '/admin/permisos', query: { empleado: p.id_usuario } }"
                  icon="shield"
                  tone="action"
                  :label="`Permisos de ${p.nombre}`"
                />
                <IconButton class="min-h-11 min-w-11 sm:min-h-9 sm:min-w-9"
                  v-if="isAdmin"
                  icon="power"
                  :label="`${p.estado === 'activo' ? 'Desactivar' : 'Activar'} a ${p.nombre}`"
                  :tone="p.estado === 'activo' ? 'danger' : 'success'"
                  @click="selected = p"
                />
              </div>
            </template>
      <template #empty>
        <SinResultados
          :bordered="false"
          compact
          :icon="rows.length ? 'search' : 'users'"
          :title="
            rows.length
              ? 'No hay resultados para estos filtros'
              : isEmployees
                ? 'Tu equipo empieza aquí'
                : 'No hay clientes registrados'
          "
          :description="
            rows.length
              ? 'Prueba con otro nombre o cambia los filtros.'
              : isEmployees
                ? 'Crea el primer empleado y asigna sus permisos.'
                : 'Los clientes aparecerán cuando se registren en Pintu Clic.'
          "
        />
      </template>
    </Table>
    <Paginacion v-model="page" :total="filtered.length" :page-size="8" />
  </section>
  <StatusModal
    v-if="selected"
    :person="selected"
    :kind="kind"
    @close="selected = null"
  />
  <EmployeeForm
    v-if="creatingEmployee && isEmployees"
    modal
    @close="creatingEmployee = false"
  />
  <Drawer :model-value="viewingClient !== null && !isEmployees" title="Ficha del cliente" @close="viewingClient = null">
    <PersonDetail v-if="viewingClient !== null" :key="viewingClient" kind="clientes" :person-id="viewingClient" compact />
  </Drawer>
</template>
