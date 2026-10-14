<script setup lang="ts">
import { Button, Icon, PageHeader, Input, Alert } from "@/core/components";
import axios from "axios";
import { computed, nextTick, onMounted, reactive, ref, watch } from "vue";
import {
  RouterLink,
  useRoute,
  useRouter,
  onBeforeRouteLeave,
} from "vue-router";
import { service } from "../services/m17.service";
import { message, notify, useM17 } from "../store/useM17";
import {
  crearEmpleadoSchema,
  actualizarEmpleadoSchema,
  TELEFONO_DIGITOS,
  DOCUMENTO_MAX,
} from "../dtos/empleado.dto";
const route = useRoute();
const router = useRouter();
const { refreshPeople } = useM17();
const props = withDefaults(
  defineProps<{ drawer?: boolean; employeeId?: number }>(),
  { drawer: false, employeeId: undefined },
);
const emit = defineEmits<{ close: []; saved: [id: number] }>();
const resolvedEmployeeId = computed(
  () => (props.employeeId ?? Number(route.params.id)) || 0,
);
const editing = computed(() => resolvedEmployeeId.value > 0);
const form = reactive({
  nombre: "",
  doc_identidad: "",
  correo: "",
  telefono: "",
});
type Campo = keyof typeof form;
const initial = ref(JSON.stringify(form));
const loading = ref(editing.value);
const busy = ref(false);
const error = ref("");
const fieldErrors = reactive<Partial<Record<Campo, string>>>({});
const saved = ref(false);
const dirty = computed(() => JSON.stringify(form) !== initial.value);
// Teléfono y documento solo aceptan dígitos: cualquier otro carácter se descarta al escribir o pegar.
const soloDigitos = (valor: string, max: number) => valor.replace(/\D/g, "").slice(0, max);
watch(() => form.telefono, (v) => { const d = soloDigitos(v, TELEFONO_DIGITOS); if (d !== v) form.telefono = d; });
watch(() => form.doc_identidad, (v) => {
  if (editing.value) return;
  const d = soloDigitos(v, DOCUMENTO_MAX);
  if (d !== v) form.doc_identidad = d;
});
// Al corregir un campo se retira su mensaje de error.
(Object.keys(form) as Campo[]).forEach((campo) =>
  watch(() => form[campo], () => { delete fieldErrors[campo]; }),
);
function setFieldErrors(issues: { field: string; message: string }[]) {
  (Object.keys(fieldErrors) as Campo[]).forEach((campo) => delete fieldErrors[campo]);
  for (const { field, message: text } of issues)
    if (field in form && !fieldErrors[field as Campo]) fieldErrors[field as Campo] = text;
  return Object.keys(fieldErrors).length > 0;
}
// Traduce la respuesta del backend a errores por campo cuando es posible.
function backendFieldErrors(e: unknown) {
  if (!axios.isAxiosError(e)) return false;
  const body = e.response?.data as
    | { error?: { message?: string; details?: { field?: string; message?: string }[] } }
    | undefined;
  const details = body?.error?.details;
  if (e.response?.status === 400 && Array.isArray(details))
    return setFieldErrors(details.map((d) => ({ field: d.field ?? "", message: d.message ?? "" })));
  const text = body?.error?.message ?? "";
  if (e.response?.status === 409 && /correo/i.test(text))
    return setFieldErrors([{ field: "correo", message: "Ya existe una cuenta con este correo. Usa otro correo." }]);
  return false;
}
async function load() {
  error.value = "";
  loading.value = editing.value;
  if (editing.value)
    try {
      const p = await service.employee(resolvedEmployeeId.value);
      Object.assign(form, {
        nombre: p.nombre,
        doc_identidad: p.doc_identidad || "",
        correo: p.correo,
        telefono: p.telefono || "",
      });
      await nextTick(); // deja que el filtro de dígitos normalice el teléfono antes de fijar el estado inicial
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
  if (!props.drawer) { void router.push('/admin/empleados'); return; }
  if (dirty.value && !saved.value && !window.confirm('Tienes cambios sin guardar. ¿Quieres cerrar el formulario?')) return;
  emit('close');
}
async function submit() {
  if (busy.value || saved.value) return;
  error.value = "";
  const result = editing.value
    ? actualizarEmpleadoSchema.safeParse(form)
    : crearEmpleadoSchema.safeParse(form);
  if (!result.success) {
    setFieldErrors(result.error.issues.map((i) => ({ field: String(i.path[0] ?? ""), message: i.message })));
    return;
  }
  setFieldErrors([]);
  busy.value = true;
  try {
    let id: number;
    if (editing.value) {
      id = resolvedEmployeeId.value;
      await service.update(id, actualizarEmpleadoSchema.parse(form));
    } else {
      id = await service.create(crearEmpleadoSchema.parse(form));
    }
    saved.value = true;
    await refreshPeople("empleados");
    notify(
      editing.value
        ? "Empleado actualizado."
        : "Empleado creado sin permisos. Ya puedes asignar sus accesos.",
    );
    emit("saved", id);
    if (props.drawer) { emit('close'); return; }
    busy.value = false;
    await router.push(
      editing.value
        ? `/admin/empleados/${id}`
        : { path: "/admin/permisos", query: { empleado: id } },
    );
  } catch (e) {
    if (!backendFieldErrors(e)) error.value = message(e);
  } finally {
    busy.value = false;
  }
}
defineExpose({ cancel });
</script>
<template>
  <RouterLink
    v-if="!drawer"
    to="/admin/empleados"
    class="mb-4 inline-flex items-center gap-2 text-sm text-action"
    ><Icon name="back" class="h-4 w-4" />Volver a empleados</RouterLink
  ><PageHeader
    v-if="!drawer"
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
    :class="drawer ? '' : 'xl:grid-cols-[minmax(0,1fr)_310px]'"
    novalidate
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
            :error="fieldErrors.nombre"
            :autofocus="drawer"
            required
            maxlength="150"
            autocomplete="name"
            placeholder="Ej. Ana María Pérez"
             /></div><div class="text-sm font-semibold"
          ><Input :label="editing ? 'Documento de identidad' : 'Documento de identidad *'" v-model="form.doc_identidad"
            :error="fieldErrors.doc_identidad"
            :required="!editing"
            :disabled="editing"
            :maxlength="DOCUMENTO_MAX"
            inputmode="numeric"
            placeholder="Solo números, ej. 1023456789"
             /></div><div class="text-sm font-semibold"
          ><Input label="Teléfono *" v-model="form.telefono"
            :error="fieldErrors.telefono"
            required
            :maxlength="TELEFONO_DIGITOS"
            type="tel"
            inputmode="numeric"
            autocomplete="tel-national"
            placeholder="10 dígitos, ej. 3001234567"
             /></div><div class="text-sm font-semibold sm:col-span-2"
          ><Input label="Correo electrónico *" v-model="form.correo"
            :error="fieldErrors.correo"
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
        <Alert
          v-if="error"
          variant="danger"
          :message="error"
          class="sm:col-span-2"
        />
      </div>
      <footer
        class="flex flex-col justify-end gap-3 sm:flex-row sm:flex-wrap border-t border-neutral-light p-4 sm:p-6"
      >
        <Button variant="neutral" :disabled="busy" @click="cancel"
          >Cancelar</Button
        ><Button type="submit" variant="action" icon="check" :disabled="busy">{{
          busy ? "Guardando…" : editing ? "Guardar cambios" : "Crear empleado"
        }}</Button>
      </footer>
    </section>
    <aside v-if="!drawer" class="space-y-5">
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
</template>
