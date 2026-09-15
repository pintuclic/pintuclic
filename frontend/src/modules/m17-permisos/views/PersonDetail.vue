<script setup lang="ts">
import { Button, Icon, PageHeader } from "@/core/components";
import { onMounted, ref, computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import { service } from "../services/m17.service";
import { message, useM17 } from "../store/useM17";
import type { Persona } from "../interfaces";
import Badge from "../components/EstadoBadge.vue";
import StatusModal from "../components/StatusModal.vue";
const props = defineProps<{ kind: "empleados" | "clientes"; personId?: number; compact?: boolean }>();
const route = useRoute();
const { isAdmin } = useM17();
const person = ref<Persona | null>(null);
const error = ref("");
const loading = ref(true);
const changing = ref(false);
const employee = computed(() => props.kind === "empleados");
async function load() {
  loading.value = true;
  error.value = "";
  try {
    person.value = await (employee.value
      ? service.employee(props.personId ?? Number(route.params.id))
      : service.client(props.personId ?? Number(route.params.id)));
  } catch (e) {
    person.value = null;
    error.value = message(e);
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
    class="mb-4 inline-flex items-center gap-2 text-sm text-action"
    ><Icon name="back" class="h-4 w-4" />Volver a {{ kind }}</RouterLink
  >
  <p v-if="loading" role="status" class="py-12">Cargando información…</p>
  <div
    v-else-if="error"
    role="alert"
    class="rounded-xl border border-highlight/20 bg-neutral-white p-4 sm:p-6"
  >
    <p>{{ error }}</p>
    <Button variant="outline" class="mt-4" @click="load">Volver a intentar</Button>
  </div>
  <template v-else-if="person"
    ><PageHeader
      :title="person.nombre"
      :description="
        employee
          ? 'Información y accesos del empleado.'
          : 'Ficha de consulta del cliente.'
      "
      ><RouterLink
        v-if="employee"
        :to="`/admin/empleados/${person.id_usuario}/editar`"
        class="flex items-center gap-2 rounded-lg bg-action px-5 py-3 text-sm font-semibold text-neutral-white"
        ><Icon name="edit" class="h-4 w-4" />Editar empleado</RouterLink
      ><Button
        v-if="isAdmin"
        :variant="person.estado === 'activo' ? 'outline' : 'green'"
        icon="power"
        @click="changing = true"
        >{{
          person.estado === "activo"
            ? employee
              ? "Desactivar"
              : "Bloquear"
            : employee
              ? "Reactivar"
              : "Desbloquear"
        }}</Button
      ></PageHeader
    >
    <div class="grid min-w-0 grid-cols-1 items-start gap-6" :class="compact ? '' : 'xl:grid-cols-[minmax(0,1fr)_310px]'">
      <section class="rounded-xl border border-neutral-light bg-neutral-white">
        <div class="flex items-center gap-4 border-b border-neutral-light p-4 sm:p-6">
          <span class="rounded-full bg-subaction p-4 text-action"
            ><Icon :name="employee ? 'user' : 'building'" class="h-7 w-7"
          /></span>
          <div>
            <h2 class="text-lg font-bold text-corporate">
              Datos de la cuenta
            </h2>
            <p class="mt-1 text-sm text-neutral-medium">
              {{
                employee
                  ? "Empleado"
                  : person.tipo === "empresa"
                    ? "Empresa"
                    : "Persona natural"
              }}
            </p>
          </div>
        </div>
        <dl class="grid min-w-0 grid-cols-1 gap-7 p-4 sm:p-6 sm:grid-cols-2">
          <div
            v-for="field in [
              { label: 'Nombre completo', value: person.nombre },
              { label: 'Correo electrónico', value: person.correo },
              { label: 'Teléfono', value: person.telefono || 'No registrado' },
              {
                label: 'Documento de identidad',
                value: person.doc_identidad || 'No disponible en esta consulta',
              },
            ]"
            :key="field.label"
          >
            <dt class="text-xs font-medium text-neutral-medium">
              {{ field.label }}
            </dt>
            <dd class="mt-2 [overflow-wrap:anywhere] text-sm font-semibold text-corporate">
              {{ field.value }}
            </dd>
          </div>
        </dl>
      </section>
      <aside
        class="rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-6"
      >
        <h2 class="mb-4 font-bold text-corporate">Estado de la cuenta</h2>
        <Badge :estado="person.estado" />
        <p class="mt-4 text-sm leading-6 text-neutral-medium">
          {{
            person.estado === "activo"
              ? "La cuenta se encuentra habilitada."
              : "La cuenta tiene el acceso restringido. Su historial se conserva."
          }}
        </p>
        <RouterLink
          v-if="employee"
          :to="{ path: '/admin/permisos', query: { empleado: person.id_usuario } }"
          class="mt-6 flex items-center gap-2 border-t border-neutral-light pt-5 text-sm font-semibold text-action"
          ><Icon name="shield" />Administrar permisos<Icon
            name="chevron"
            class="ml-auto h-4 w-4"
        /></RouterLink>
      </aside>
      <section
        v-if="!employee"
        class="rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-6"
        :class="compact ? '' : 'xl:col-span-2'"
      >
        <h2 class="text-lg font-bold text-corporate">
          Historial comercial
        </h2>
        <p class="mt-3 text-sm leading-6 text-neutral-medium">
          La consulta de pedidos y cotizaciones estará disponible cuando se
          conecten los módulos comerciales. Este panel no modifica los datos
          personales del cliente ni muestra información completa de pago.
        </p>
      </section>
    </div>
    <StatusModal
      v-if="changing"
      :kind="kind"
      :person="person"
      @close="changing = false"
      @saved="load"
  /></template>
</template>
