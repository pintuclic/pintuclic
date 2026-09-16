<script setup lang="ts">
import { Button, Icon, Modal, PageHeader, Input } from "@/core/components";
import { computed, onMounted, reactive, ref } from "vue";
import {
  RouterLink,
  useRoute,
  useRouter,
  onBeforeRouteLeave,
} from "vue-router";
import { service } from "../services/m17.service";
import { message, notify, useM17 } from "../store/useM17";
import { crearEmpleadoSchema, actualizarEmpleadoSchema } from "../dtos/empleado.dto";
const route = useRoute();
const router = useRouter();
const { refresh } = useM17();
const props = withDefaults(defineProps<{ modal?: boolean }>(), { modal: false });
const emit = defineEmits<{ close: [] }>();
const editing = computed(() => !props.modal && !!route.params.id);
const form = reactive({
  nombre: "",
  doc_identidad: "",
  correo: "",
  telefono: "",
});
const initial = ref(JSON.stringify(form));
const loading = ref(editing.value);
const busy = ref(false);
const error = ref("");
const saved = ref(false);
const dirty = computed(() => JSON.stringify(form) !== initial.value);
async function load() {
  error.value = "";
  loading.value = editing.value;
  if (editing.value)
    try {
      const p = await service.employee(Number(route.params.id));
      Object.assign(form, {
        nombre: p.nombre,
        doc_identidad: p.doc_identidad || "",
        correo: p.correo,
        telefono: p.telefono || "",
      });
      initial.value = JSON.stringify(form);
    } catch (e) {
      error.value = message(e);
    } finally {
      loading.value = false;
    }
}
onMounted(load);
onBeforeRouteLeave(
  () =>
    !busy.value && (!dirty.value ||
    saved.value ||
    window.confirm("Tienes cambios sin guardar. ¿Quieres salir?")),
);
function cancel() {
  if (busy.value) return;
  if (!props.modal) { void router.push('/admin/empleados'); return; }
  if (dirty.value && !saved.value && !window.confirm('Tienes cambios sin guardar. ¿Quieres cerrar el formulario?')) return;
  emit('close');
}
async function submit() {
  busy.value = true;
  error.value = "";
  try {
    let id: number;
    if (editing.value) {
      const result = actualizarEmpleadoSchema.safeParse(form);
      if (!result.success) throw new Error(result.error.issues[0]?.message);
      id = Number(route.params.id);
      await service.update(id, result.data);
    } else {
      const result = crearEmpleadoSchema.safeParse(form);
      if (!result.success) throw new Error(result.error.issues[0]?.message);
      id = await service.create(result.data);
    }
    saved.value = true;
    await refresh();
    notify(
      editing.value
        ? "Empleado actualizado."
        : "Empleado creado sin permisos. Ya puedes asignar sus accesos.",
    );
    if (props.modal) { emit('close'); return; }
    await router.push(
      editing.value
        ? `/admin/empleados/${id}`
        : { path: "/admin/permisos", query: { empleado: id } },
    );
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <component :is="modal ? Modal : 'div'" v-bind="modal ? {title: 'Crear empleado', wide: true} : {}" @close="cancel">
  <RouterLink
    v-if="!modal"
    to="/admin/empleados"
    class="mb-4 inline-flex items-center gap-2 text-sm text-action"
    ><Icon name="back" class="h-4 w-4" />Volver a empleados</RouterLink
  ><PageHeader
    v-if="!modal"
    :title="editing ? 'Editar empleado' : 'Nuevo empleado'"
    :description="
      editing
        ? 'Actualiza los datos de contacto del empleado.'
        : 'Agrega una persona a tu equipo de Pintu Clic.'
    "
  />
  <div v-if="loading" role="status" class="py-12">Cargando empleado…</div>
  <div
    v-else-if="editing && !form.correo"
    role="alert"
    class="rounded-xl border border-highlight/20 bg-neutral-white p-4 sm:p-6"
  >
    <p>{{ error }}</p>
    <Button variant="outline" class="mt-4" @click="load">Volver a intentar</Button>
  </div>
  <form
    v-else
    class="grid min-w-0 grid-cols-1 items-start gap-6"
    :class="modal ? '' : 'xl:grid-cols-[minmax(0,1fr)_310px]'"
    @submit.prevent="submit"
  >
    <section class="rounded-xl border border-neutral-light bg-neutral-white">
      <div class="border-b border-neutral-light p-4 sm:p-6">
        <h2
          class="font-title flex items-center gap-3 text-lg font-bold text-corporate"
        >
          <Icon name="user" class="text-action" />Información del empleado
        </h2>
        <p class="mt-2 text-sm text-neutral-medium">
          Los campos marcados con * son obligatorios.
        </p>
      </div>
      <div class="grid min-w-0 grid-cols-1 gap-6 p-4 sm:p-6 sm:grid-cols-2">
        <div class="text-sm font-semibold sm:col-span-2"
          ><Input label="Nombre completo *" v-model="form.nombre"
            :autofocus="modal"
            required
            minlength="2"
            maxlength="150"
            autocomplete="name"
            placeholder="Ej. Ana María Pérez"
             /></div><div class="text-sm font-semibold"
          ><Input :label="editing ? 'Documento de identidad' : 'Documento de identidad *'" v-model="form.doc_identidad"
            :required="!editing"
            :disabled="editing"
            minlength="5"
            maxlength="20"
            inputmode="numeric"
            placeholder="Número de documento"
             /></div><div class="text-sm font-semibold"
          ><Input label="Teléfono *" v-model="form.telefono"
            required
            maxlength="20"
            type="tel"
            autocomplete="tel"
            placeholder="Ej. 300 123 4567"
             /></div><div class="text-sm font-semibold sm:col-span-2"
          ><Input label="Correo electrónico *" v-model="form.correo"
            required
            :disabled="editing"
            type="email"
            maxlength="150"
            autocomplete="email"
            placeholder="nombre@correo.com"

          /><span class="mt-2 block text-xs font-normal text-neutral-medium">{{
            editing
              ? "El correo y el documento no se pueden modificar desde este formulario."
              : "El correo debe ser único en Pintu Clic."
          }}</span></div>
        <p
          v-if="error"
          role="alert"
          class="rounded-lg bg-highlight/5 p-4 text-sm text-neutral-dark sm:col-span-2"
        >
          {{ error }}
        </p>
      </div>
      <footer
        class="flex flex-col justify-end gap-3 sm:flex-row sm:flex-wrap border-t border-neutral-light p-4 sm:p-6"
      >
        <Button variant="outline" :disabled="busy" @click="cancel"
          >Cancelar</Button
        ><Button type="submit" variant="action" icon="check" :disabled="busy">{{
          busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear empleado"
        }}</Button>
      </footer>
    </section>
    <aside v-if="!modal" class="space-y-5">
      <section
        class="rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-6"
      >
        <h2 class="font-title font-bold text-corporate">Resumen de la cuenta</h2>
        <div
          class="my-5 flex h-14 w-14 items-center justify-center rounded-full bg-subaction text-action"
        >
          <Icon name="user" class="h-7 w-7" />
        </div>
        <p class="break-words font-semibold text-corporate">
          {{ form.nombre || "Nuevo empleado" }}
        </p>
        <p class="mt-1 break-all text-sm text-neutral-medium">
          {{ form.correo || "Correo pendiente" }}
        </p>
        <dl class="mt-5 space-y-3 border-t border-neutral-light pt-5 text-sm">
          <div class="flex justify-between">
            <dt class="text-neutral-medium">Tipo de cuenta</dt>
            <dd>Empleado</dd>
          </div>
          <div v-if="!editing" class="flex justify-between">
            <dt class="text-neutral-medium">Permisos iniciales</dt>
            <dd>Ninguno</dd>
          </div>
        </dl>
      </section>
      <section class="rounded-xl border border-action/10 bg-subaction/40 p-5">
        <Icon name="shield" class="mb-3 text-action" />
        <h3 class="font-title text-sm font-bold text-corporate">Accesos a su medida</h3>
        <p class="mt-2 text-sm leading-6 text-neutral-medium">
          Después de crear la cuenta, selecciona los permisos que necesita.
          Puedes cambiarlos cuando quieras.
        </p>
      </section>
    </aside>
  </form>
  </component>
</template>
