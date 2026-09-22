<script setup lang="ts">
import { Button, Icon, Modal, PageHeader, Input, Select, Checkbox } from "@/core/components";
import { computed, ref, watch } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import type { Permiso } from "../interfaces";
import { service } from "../services/m17.service";
import { message, notify, useM17 } from "../store/useM17";
import {
  reserved,
  dependentPermissions,
  togglePermission,
} from "../services/permission-rules";
const { state } = useM17();
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
const areaNames: Record<string, string> = {
  catalogo: "Catálogo de productos",
  ventas: "Ventas y cotizaciones",
  personal: "Personas y clientes",
  seguridad: "Seguridad",
  configuracion: "Configuración del sistema",
};
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
    const permissions = await service.permissions(employeeId.value);
    if (version === generation) {
      selected.value = [...permissions];
      initial.value = [...permissions];
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
function choose(event: Event) {
  const input = event.target as HTMLSelectElement;
  const next = Number(input.value);
  if (
    dirty.value &&
    !window.confirm("Hay cambios sin guardar. ¿Cambiar de empleado?")
  ) {
    input.value = String(employeeId.value);
    return;
  }
  employeeId.value = next;
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
    initial.value = [...selected.value];
    inverse.value = "";
    await load();
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
  if (!name) return;
  inverseBusy.value = true;
  try {
    const results = await Promise.all(
      state.employees.map(async (p) => ({
        name: p.nombre,
        permissions: await service.permissions(p.id_usuario),
      })),
    );
    if (version === inverseGeneration)
      holders.value = results
        .filter((p) => p.permissions.includes(name))
        .map((p) => p.name);
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
      <Select label="Seleccionar empleado"
          :model-value="employeeId"
          :disabled="busy"
          class="mt-3 max-w-xl"
          @change="choose"
        >
          <option :value="0">Elige un empleado</option>
          <option
            v-for="p in state.employees"
            :key="p.id_usuario"
            :value="p.id_usuario"
          >
            {{ p.nombre }} · {{ p.correo }}
          </option>
        </Select>
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
            >{{ busy ? "Guardando…" : "Guardar permisos" }}</Button
          ><Button variant="outline"
            class="mt-3 w-full"
            :disabled="busy || !dirty"
            @click="selected = [...initial]"
            >Descartar cambios</Button
          >
        </div>
        <p class="px-2 text-xs leading-5 text-neutral-medium">
          Al quitar un permiso de consulta también se retirarán las operaciones
          que dependen de él.
        </p>
      </aside>
    </div>
    <section
      class="mt-6 rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-6"
    >
      <h2 class="font-title font-bold text-corporate">¿Quién tiene este permiso?</h2>
      <p class="mt-2 text-sm text-neutral-medium">
        Consulta los empleados con un acceso específico.
      </p>
      <Select
        v-model="inverse"
        aria-label="Permiso para consultar empleados"
        class="mt-4 max-w-xl"
      >
        <option value="">Seleccionar permiso</option>
        <option v-for="p in state.catalog" :key="p.nombre" :value="p.nombre">
          {{ p.descripcion || p.nombre }}
        </option>
      </Select>
      <p v-if="inverseBusy" class="mt-4 text-sm" role="status">
        Consultando accesos…
      </p>
      <div v-else-if="inverse" class="mt-4 flex flex-wrap gap-2">
        <span
          v-for="name in holders"
          :key="name"
          class="rounded-lg bg-subaction/50 px-3 py-2 text-sm text-corporate"
          >{{ name }}</span
        >
        <p v-if="!holders.length" class="text-sm text-neutral-medium">
          Ningún empleado tiene este permiso asignado.
        </p>
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
