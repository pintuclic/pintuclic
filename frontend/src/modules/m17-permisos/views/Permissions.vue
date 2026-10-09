<script setup lang="ts">
import { Button, Icon, Modal, PageHeader, Input, Checkbox, SearchableSelect } from "@/core/components";
import { computed, ref, watch } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import type { Permiso } from "../interfaces";
import { service } from "../services/m17.service";
import { message, notify, useM17 } from "../store/useM17";
import {
  areaNames,
  reserved,
  dependentPermissions,
  togglePermission,
} from "../services/permission-rules";
const { state, permissions, permissionHolders, cachePermissions } = useM17();
const route = useRoute();
const employeeId = ref(Number(route.query.empleado) || 0);
const selected = ref<string[]>([]);
const initial = ref<string[]>([]);
const filter = ref("");
const error = ref("");
const busy = ref(false);
const loading = ref(false);
const loaded = ref(false);
const pending = ref("");
const inverse = ref("");
const holders = ref<string[]>([]);
const inverseBusy = ref(false);
let generation = 0;
let inverseGeneration = 0;
const employee = computed(() =>
  state.employees.find((x) => x.id_usuario === employeeId.value),
);
const dirty = computed(
  () =>
    JSON.stringify([...selected.value].sort()) !==
    JSON.stringify([...initial.value].sort()),
);
const groups = computed(() =>
  Object.entries(
    state.catalog
      .filter((p) =>
        `${p.nombre} ${p.descripcion}`
          .toLowerCase()
          .includes(filter.value.toLowerCase()),
      )
      .reduce<Record<string, Permiso[]>>((acc, p) => {
        (acc[p.area] ??= []).push(p);
        return acc;
      }, {}),
  ),
);
async function load() {
  const version = ++generation;
  error.value = "";
  selected.value = [];
  initial.value = [];
  loaded.value = false;
  loading.value = false;
  if (!employeeId.value) return;
  loading.value = true;
  try {
    const employeePermissions = await permissions(employeeId.value);
    if (version === generation) {
      selected.value = [...employeePermissions];
      initial.value = [...employeePermissions];
      loaded.value = true;
    }
  } catch (e) {
    if (version === generation) error.value = message(e);
  } finally {
    if (version === generation) loading.value = false;
  }
}
watch(employeeId, load, { immediate: true });
watch(
  () => route.query.empleado,
  (v) => {
    if (v) employeeId.value = Number(v);
  },
);
const employeeOptions = computed(() => [
  { value: 0, label: "Elige un empleado…" },
  ...state.employees.map((p) => ({
    value: p.id_usuario,
    label: `${p.nombre}`,
    description: `${p.correo}`,
  })),
]);

const permissionOptions = computed(() => [
  { value: "", label: "Seleccionar permiso…" },
  ...state.catalog.map((p) => ({
    value: p.nombre,
    label: p.descripcion || p.nombre,
    description: p.nombre,
  })),
]);

function chooseEmployee(next: string | number) {
  const nextId = Number(next);
  if (
    dirty.value &&
    !window.confirm("Hay cambios sin guardar. ¿Cambiar de empleado?")
  ) {
    return;
  }
  employeeId.value = nextId;
}
function toggle(name: string, enabled: boolean) {
  if (!enabled && dependentPermissions(name, selected.value).length) {
    pending.value = name;
    return;
  }
  selected.value = togglePermission(
    name,
    enabled,
    selected.value,
    state.catalog.map((p) => p.nombre),
  );
}
// Permisos asignables visibles (respeta el filtro y excluye los exclusivos del administrador).
const assignable = computed(() =>
  groups.value.flatMap(([, ps]) => ps.map((p) => p.nombre)).filter((n) => !reserved(n)),
);
const assignedCount = computed(
  () => assignable.value.filter((n) => selected.value.includes(n)).length,
);
const allSelected = computed(
  () => assignable.value.length > 0 && assignedCount.value === assignable.value.length,
);
function toggleAll(enabled: boolean) {
  const catalog = state.catalog.map((p) => p.nombre);
  selected.value = assignable.value.reduce(
    (next, name) => togglePermission(name, enabled, next, catalog),
    selected.value,
  );
}
function revoke() {
  selected.value = togglePermission(
    pending.value,
    false,
    selected.value,
    state.catalog.map((p) => p.nombre),
  );
  pending.value = "";
}
async function save() {
  if (!employee.value || !loaded.value) return;
  busy.value = true;
  error.value = "";
  try {
    await service.savePermissions(employeeId.value, selected.value);
    cachePermissions(employeeId.value, selected.value);
    initial.value = [...selected.value];
    inverse.value = "";
    notify(
      "Permisos guardados. Los cambios se aplican en las próximas solicitudes.",
    );
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
watch(inverse, async (name) => {
  const version = ++inverseGeneration;
  holders.value = [];
  inverseBusy.value = false;
  if (!name) return;
  inverseBusy.value = true;
  try {
    const names = await permissionHolders(name);
    if (version === inverseGeneration) holders.value = names;
  } catch (e) {
    if (version === inverseGeneration) error.value = message(e);
  } finally {
    if (version === inverseGeneration) inverseBusy.value = false;
  }
});
onBeforeRouteLeave(
  () =>
    !dirty.value || window.confirm("Hay permisos sin guardar. ¿Quieres salir?"),
);
</script>
<template>
  <PageHeader
    title="Permisos y accesos"
    description="Asigna a cada empleado únicamente los permisos que necesita."
  />
  <div
    class="mb-6 flex items-start gap-3 rounded-xl border border-action/15 bg-subaction/40 p-5"
  >
    <Icon name="shield" class="mt-0.5 shrink-0 text-action" />
    <p class="text-sm leading-6 text-corporate">
      Los accesos se asignan por persona. Habilitar una operación incluye su
      permiso de consulta. La cuenta del administrador conserva acceso completo.
    </p>
  </div>
  <div
    v-if="!state.employees.length"
    class="rounded-xl border border-neutral-light bg-neutral-white px-6 py-16 text-center"
  >
    <Icon name="users" class="mx-auto mb-4 h-12 w-12 text-action" />
    <h2 class="font-title text-xl font-bold text-corporate">
      Primero, agrega a tu equipo
    </h2>
    <p class="mt-3 text-sm text-neutral-medium">
      Necesitas un empleado registrado para asignarle permisos.
    </p>
    <Button to="/admin/empleados/nuevo" variant="action" icon="plus" class="mt-6">Crear empleado</Button>
  </div>
  <template v-else
    ><section
      class="mb-6 rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-6"
    >
      <SearchableSelect
        label="Seleccionar empleado"
        placeholder="Elige un empleado…"
        search-placeholder="Buscar por nombre o correo…"
        :model-value="employeeId"
        :options="employeeOptions"
        :disabled="busy"
        class="mt-3 max-w-xl"
        @change="chooseEmployee"
      />
    </section>
    <p
      v-if="error"
      role="alert"
      class="mb-5 rounded-lg border border-highlight/20 bg-neutral-white p-4 text-sm text-neutral-dark"
    >
      {{ error }}
    </p>
    <Button variant="outline"
      v-if="error && employee && !loaded && !loading"
      class="mb-5"
      icon="refresh"
      @click="load"
      >Volver a cargar permisos</Button
    >
    <p v-if="loading" role="status" class="py-10 text-center">
      Cargando permisos…
    </p>
    <div
      v-else-if="employee && loaded"
      class="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_290px]"
    >
      <section
        class="overflow-hidden rounded-xl border border-neutral-light bg-neutral-white"
      >
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-light p-4 sm:p-6"
        >
          <h2 class="font-title font-bold text-corporate">Permisos disponibles</h2>
          <Input v-model="filter" icon="search" aria-label="Filtrar permisos" placeholder="Buscar permiso…" class="sm:w-56" />
        </div>
        <div
          v-if="assignable.length"
          class="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-light bg-neutral-lightest px-4 py-2 sm:px-6"
        >
          <Checkbox
            class="flex items-center gap-3 rounded-lg px-2 py-2"
            :model-value="allSelected"
            :disabled="busy"
            @update:model-value="toggleAll($event)"
            ><span class="text-sm font-semibold text-corporate">{{
              filter ? "Seleccionar todos los resultados" : "Seleccionar todos"
            }}</span></Checkbox
          >
          <span class="text-xs text-neutral-medium"
            >{{ assignedCount }} de {{ assignable.length }} asignados</span
          >
        </div>
        <fieldset
          v-for="[area, permissions] in groups"
          :key="area"
          :disabled="busy"
          class="min-w-0 border-b border-neutral-light p-4 sm:p-6 last:border-0"
        >
          <legend
            class="float-left mb-4 w-full text-sm font-bold text-corporate"
          >
            {{ areaNames[area] || area }}
          </legend>
          <Checkbox v-for="p in permissions"
            :key="p.nombre"
            class="clear-both flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-neutral-lightest"
            :class="reserved(p.nombre) ? 'opacity-60' : ''"
            :model-value="selected.includes(p.nombre)" :disabled="reserved(p.nombre)" @update:model-value="toggle(p.nombre, $event)"><span class="min-w-0 [overflow-wrap:anywhere]"
              ><span class="block text-sm font-medium">{{
                p.descripcion || p.nombre
              }}</span
              ><span class="mt-1 block text-xs text-neutral-medium"
                >{{ p.nombre
                }}{{
                  reserved(p.nombre) ? " · Exclusivo del administrador" : ""
                }}</span
              ></span
            ></Checkbox>
        </fieldset>
        <p
          v-if="!groups.length"
          class="p-8 text-center text-sm text-neutral-medium"
        >
          No hay permisos que coincidan con la búsqueda.
        </p>
      </section>
      <aside class="space-y-5 xl:sticky xl:top-6">
        <div
          class="rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-6"
        >
          <Icon name="shield" class="mb-4 h-8 w-8 text-action" />
          <h2 class="font-title font-bold text-corporate">{{ employee.nombre }}</h2>
          <p class="mt-1 break-all text-xs text-neutral-medium">
            {{ employee.correo }}
          </p>
          <div class="my-5 border-y border-neutral-light py-5">
            <strong class="text-3xl text-corporate">{{
              selected.length
            }}</strong
            ><span class="ml-2 text-sm text-neutral-medium"
              >permisos seleccionados</span
            >
          </div>
          <p
            class="mb-4 text-xs"
            :class="dirty ? 'text-action' : 'text-neutral-medium'"
          >
            {{
              dirty
                ? "Tienes cambios pendientes de guardar."
                : "Los permisos están actualizados."
            }}
          </p>
          <Button
            variant="green"
            icon="check"
            class="w-full"
            :disabled="busy || !dirty"
            @click="save"
          >
            {{ busy ? "Guardando…" : "Guardar permisos" }}
          </Button>
          <Button
            variant="neutral"
            class="mt-3 w-full"
            :disabled="busy || !dirty"
            @click="selected = [...initial]"
          >
            Descartar cambios
          </Button>
        </div>
        <p class="px-2 text-xs leading-5 text-neutral-medium">
          Al quitar un permiso de consulta también se retirarán las operaciones
          que dependen de él.
        </p>
      </aside>
    </div>
    <section
      class="mt-8 rounded-xl border border-neutral-light bg-neutral-white p-5 sm:p-6 shadow-xs"
    >
      <div class="flex items-center gap-2.5 mb-1">
        <span class="inline-flex items-center rounded-md bg-subaction/60 px-2 py-0.5 text-xs font-semibold text-action">
          Auditoría de Accesos
        </span>
      </div>
      <h2 class="font-title font-bold text-corporate text-lg">Búsqueda inversa: ¿Quién tiene este permiso?</h2>
      <p class="mt-1 text-sm text-neutral-medium">
        Herramienta de control interno para verificar qué miembros del equipo cuentan actualmente con un acceso específico en el sistema.
      </p>
      <SearchableSelect
        v-model="inverse"
        label="Permiso para consultar empleados"
        placeholder="Seleccionar permiso…"
        search-placeholder="Buscar permiso…"
        :options="permissionOptions"
        class="mt-4 max-w-xl"
      />
      <p v-if="inverseBusy" class="mt-4 text-sm text-neutral-medium" role="status">
        Consultando accesos…
      </p>
      <div v-else-if="inverse" class="mt-4">
        <p class="text-xs font-semibold uppercase tracking-wider text-neutral-medium mb-2">
          Empleados con este acceso:
        </p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="name in holders"
            :key="name"
            class="rounded-lg bg-subaction/50 px-3 py-2 text-sm font-medium text-corporate border border-subaction"
            >{{ name }}</span
          >
          <p v-if="!holders.length" class="text-sm text-neutral-medium">
            Ningún empleado tiene este permiso asignado.
          </p>
        </div>
      </div>
    </section></template
  ><Modal
    v-if="pending"
    title="Retirar permiso de consulta"
    @close="pending = ''"
    ><p class="text-sm leading-6">
      También se retirarán estos permisos dependientes:
    </p>
    <ul class="my-4 list-inside list-disc space-y-2 text-sm text-corporate">
      <li v-for="p in dependentPermissions(pending, selected)" :key="p">
        {{ p }}
      </li>
    </ul>
    <div class="flex flex-col justify-end gap-3 sm:flex-row">
      <Button variant="neutral" @click="pending = ''">Cancelar</Button
      ><Button variant="danger" @click="revoke">Retirar permisos</Button>
    </div></Modal
  >
</template>
