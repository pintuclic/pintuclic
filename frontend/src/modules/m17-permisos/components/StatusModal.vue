<script setup lang="ts">
import { Button, Modal, Textarea } from "@/core/components";
import { computed, ref } from "vue";
import type { Persona } from "../interfaces";
import { service } from "../services/m17.service";
import { message, notify, useM17 } from "../store/useM17";
import { cambioEstadoSchema } from "../dtos/estado.dto";
const props = defineProps<{
  person: Persona;
  kind: "empleados" | "clientes";
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const { refresh } = useM17();
const reason = ref("");
const busy = ref(false);
const error = ref("");
const active = computed(() => props.person.estado === "activo");
const action = computed(() =>
  props.kind === "empleados"
    ? active.value
      ? "Desactivar"
      : "Reactivar"
    : active.value
      ? "Bloquear"
      : "Desbloquear",
);
async function save() {
  busy.value = true;
  error.value = "";
  try {
    const result = cambioEstadoSchema.safeParse({ active: active.value, reason: reason.value });
    if (!result.success) throw new Error(result.error.issues[0]?.message);
    await service.status(props.kind, props.person, reason.value.trim());
    await refresh();
    notify("Estado actualizado correctamente.");
    emit("saved");
    emit("close");
  } catch (e) {
    error.value = message(e);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <Modal
    :title="`${action} ${kind === 'empleados' ? 'empleado' : 'cliente'}`"
    @close="!busy && emit('close')"
    ><form @submit.prevent="save">
      <p class="leading-7">
        Vas a {{ action.toLowerCase() }} a <strong>{{ person.nombre }}</strong
        >.
      </p>
      <p class="mt-3 text-sm leading-6 text-neutral-medium">
        {{
          active
            ? "Se impedirá el acceso a la cuenta. Su información e historial se conservan."
            : "La cuenta volverá a estar activa."
        }}
      </p>
      <Textarea v-if="active" label="Motivo *"
          v-model="reason"
          required
          minlength="10"
          maxlength="500"
          rows="4"
          class="mt-5"
          placeholder="Describe el motivo (mínimo 10 caracteres)"
        ></Textarea>
      <p v-if="error" role="alert" class="mt-4 text-sm text-danger font-medium">
        {{ error }}
      </p>
      <div class="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
        <Button variant="neutral" :disabled="busy" @click="emit('close')">Cancelar</Button><Button
          type="submit"
          :variant="active ? 'danger' : 'green'"
          :disabled="busy"
          >{{ busy ? "Guardando…" : action }}</Button
        >
      </div>
    </form></Modal
  >
</template>
