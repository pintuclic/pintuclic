<script setup lang="ts">
import { Badge, Button, PageHeader } from "@/core/components";
import {
  Activity,
  Ban,
  Building2,
  Check,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute } from "vue-router";
import StatusModal from "../components/StatusModal.vue";
import type { Persona } from "../interfaces";
import { service } from "../services/m17.service";
import { areaNames } from "../services/permission-rules";
import { message, useM17 } from "../store/useM17";

const props = defineProps<{
  kind: "empleados" | "clientes";
  personId?: number;
  compact?: boolean;
}>();
const emit = defineEmits<{ close: [] }>();
const route = useRoute();
const { isAdmin, state, permissions } = useM17();
const person = ref<Persona | null>(null);
const error = ref("");
const loading = ref(true);
const changing = ref(false);
const employee = computed(() => props.kind === "empleados");
const assigned = ref<string[]>([]);
const permissionsLoading = ref(false);
const permissionsError = ref("");
// Permisos asignados agrupados por área, con la descripción del catálogo.
const assignedGroups = computed(() => {
  const byName = new Map(state.catalog.map((p) => [p.nombre, p]));
  const groups = new Map<string, { nombre: string; label: string }[]>();
  for (const nombre of assigned.value) {
    const p = byName.get(nombre);
    const area = p?.area ?? nombre.split(".")[0];
    if (!groups.has(area)) groups.set(area, []);
    groups.get(area)?.push({ nombre, label: p?.descripcion || nombre });
  }
  return [...groups].map(([area, items]) => ({
    area,
    title: areaNames[area] || area,
    items,
  }));
});
async function loadPermissions(id: number) {
  if (!employee.value || !isAdmin.value) return;
  permissionsLoading.value = true;
  permissionsError.value = "";
  try {
    assigned.value = await permissions(id, true);
  } catch (requestError) {
    assigned.value = [];
    permissionsError.value = message(requestError);
  } finally {
    permissionsLoading.value = false;
  }
}
const actionLabel = computed(() => {
  if (!person.value) return "";
  if (person.value.estado === "activo")
    return employee.value ? "Desactivar" : "Bloquear";
  return employee.value ? "Reactivar" : "Desbloquear";
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const id = props.personId ?? Number(route.params.id);
    person.value = await (employee.value
      ? service.employee(id)
      : service.client(id));
    void loadPermissions(id);
  } catch (requestError) {
    person.value = null;
    error.value = message(requestError);
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<template>
  <RouterLink
    v-if="!compact"
    :to="`/admin/${kind}`"
    class="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-action hover:underline"
  >
    ← Volver a {{ kind }}
  </RouterLink>

  <p v-if="loading" role="status" class="py-12 text-center text-neutral-medium">
    Cargando información…
  </p>
  <div
    v-else-if="error"
    role="alert"
    class="rounded-xl border border-highlight/20 bg-neutral-white p-4 sm:p-6"
  >
    <p>{{ error }}</p>
    <Button variant="outline" class="mt-4" @click="load">
      Volver a intentar
    </Button>
  </div>

  <template v-else-if="person">
    <PageHeader
      v-if="!compact"
      :title="person.nombre"
      :description="
        employee
          ? 'Información y accesos del empleado.'
          : 'Ficha de consulta del cliente.'
      "
    >
      <Button
        v-if="employee"
        :to="`/admin/empleados/${person.id_usuario}/editar`"
        variant="action"
        icon="edit"
      >
        Editar empleado
      </Button>
      <Button
        v-if="isAdmin"
        :variant="person.estado === 'activo' ? 'danger' : 'conversion'"
        :icon="person.estado === 'activo' ? Ban : Check"
        @click="changing = true"
      >
        {{ actionLabel }}
      </Button>
    </PageHeader>

    <div class="space-y-5">
      <header v-if="compact" class="flex items-center gap-4">
        <span
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-subaction/50 text-action"
        >
          <Building2 class="h-8 w-8" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <h1 class="font-title text-xl font-bold text-corporate">
            {{ person.nombre }}
          </h1>
          <p class="mt-1 text-sm text-neutral-medium">
            Ficha de consulta del cliente.
          </p>
        </div>
      </header>

      <div
        class="grid min-w-0 grid-cols-1 items-start gap-5"
        :class="compact ? '' : 'xl:grid-cols-[minmax(0,1fr)_310px]'"
      >
        <section class="rounded-xl border border-neutral-light bg-neutral-white">
          <div
            class="flex items-center gap-3 border-b border-neutral-light p-4 sm:p-5"
          >
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-subaction/60 text-action"
            >
              <Building2 class="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 class="font-title font-bold text-corporate">
              Datos de la cuenta
            </h2>
          </div>
          <dl class="grid min-w-0 grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:p-5">
            <div
              v-for="field in [
                { label: 'Nombre completo', value: person.nombre, icon: User },
                { label: 'Correo electrónico', value: person.correo, icon: Mail },
                {
                  label: 'Teléfono',
                  value: person.telefono || 'No registrado',
                  icon: Phone,
                },
                {
                  label: 'Documento de identidad',
                  value:
                    person.doc_identidad || 'No disponible en esta consulta',
                  icon: FileText,
                },
              ]"
              :key="field.label"
              class="flex min-w-0 items-start gap-3"
            >
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-subaction/50 text-action"
              >
                <component :is="field.icon" class="h-4 w-4" aria-hidden="true" />
              </span>
              <div class="min-w-0">
                <dt class="text-xs font-medium text-neutral-medium">
                  {{ field.label }}
                </dt>
                <dd
                  class="mt-1 [overflow-wrap:anywhere] text-sm font-semibold text-corporate"
                >
                  {{ field.value }}
                </dd>
              </div>
            </div>
          </dl>
        </section>

        <aside class="rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-5">
          <div class="mb-4 flex items-center gap-3">
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-subaction/60 text-action"
            >
              <Activity class="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 class="font-title font-bold text-corporate">
              Estado de la cuenta
            </h2>
          </div>
          <Badge :estado="person.estado" :dot="true" />
          <p class="mt-4 text-sm leading-6 text-neutral-medium">
            {{
              person.estado === "activo"
                ? "La cuenta se encuentra habilitada."
                : "La cuenta tiene el acceso restringido. Su historial se conserva."
            }}
          </p>
        </aside>

        <section
          v-if="employee && isAdmin"
          class="rounded-xl border border-neutral-light bg-neutral-white xl:col-span-2"
          aria-labelledby="permisos-asignados"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-light p-4 sm:p-5"
          >
            <div class="flex items-center gap-3">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-subaction/60 text-action"
              >
                <ShieldCheck class="h-4 w-4" aria-hidden="true" />
              </span>
              <h2 id="permisos-asignados" class="font-title font-bold text-corporate">
                Permisos asignados
              </h2>
              <span
                v-if="!permissionsLoading && !permissionsError"
                class="rounded-full bg-subaction px-2.5 py-0.5 text-xs font-semibold text-action"
              >
                {{ assigned.length }}
              </span>
            </div>
            <RouterLink
              :to="{ path: '/admin/permisos', query: { empleado: person.id_usuario } }"
              class="text-sm font-semibold text-action hover:underline"
            >
              {{ assigned.length ? "Modificar permisos" : "Asignar permisos" }}
            </RouterLink>
          </div>
          <p
            v-if="permissionsLoading"
            role="status"
            class="p-4 text-sm text-neutral-medium sm:p-5"
          >
            Cargando permisos…
          </p>
          <div v-else-if="permissionsError" role="alert" class="p-4 sm:p-5">
            <p class="text-sm">{{ permissionsError }}</p>
            <Button variant="outline" class="mt-3" @click="loadPermissions(person.id_usuario)">
              Volver a intentar
            </Button>
          </div>
          <p
            v-else-if="!assigned.length"
            class="p-4 text-sm leading-6 text-neutral-medium sm:p-5"
          >
            Este empleado aún no tiene permisos asignados, por lo que no puede
            realizar operaciones en el panel.
          </p>
          <div
            v-else
            class="grid min-w-0 grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:p-5"
          >
            <div v-for="group in assignedGroups" :key="group.area" class="min-w-0">
              <h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-medium">
                {{ group.title }}
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="item in group.items"
                  :key="item.nombre"
                  class="flex min-w-0 items-start gap-2 text-sm"
                >
                  <Check class="mt-0.5 h-4 w-4 shrink-0 text-conversion" aria-hidden="true" />
                  <span class="min-w-0 [overflow-wrap:anywhere]">
                    <span class="block font-medium text-corporate">{{ item.label }}</span>
                    <span class="block text-xs text-neutral-medium">{{ item.nombre }}</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section
          v-if="!employee"
          class="rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-5"
          :class="compact ? '' : 'xl:col-span-2'"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-subaction/60 text-action"
            >
              <Clock class="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 class="font-title font-bold text-corporate">
              Historial comercial
            </h2>
          </div>
          <p class="mt-4 text-sm leading-6 text-neutral-medium">
            La consulta de pedidos y cotizaciones estará disponible cuando se
            conecten los módulos comerciales. Este panel no modifica los datos
            personales del cliente ni muestra información completa de pago.
          </p>
          <RouterLink
            v-if="compact"
            :to="`/admin/clientes/${person.id_usuario}`"
            class="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-action hover:underline"
          >
            <ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
            Ver ficha completa y pedidos en página dedicada
          </RouterLink>
        </section>
      </div>

      <div
        v-if="compact"
        class="flex flex-col justify-end gap-3 border-t border-neutral-light pt-4 sm:flex-row"
      >
        <Button variant="neutral" @click="emit('close')">Cancelar</Button>
        <Button
          v-if="isAdmin"
          :variant="person.estado === 'activo' ? 'danger' : 'conversion'"
          :icon="person.estado === 'activo' ? Ban : Check"
          @click="changing = true"
        >
          {{ actionLabel }}
        </Button>
      </div>
    </div>

    <StatusModal
      v-if="changing"
      :kind="kind"
      :person="person"
      @close="changing = false"
      @saved="load"
    />
  </template>
</template>
