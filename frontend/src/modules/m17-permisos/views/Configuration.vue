<script setup lang="ts">
import { Button, Icon, Modal, PageHeader } from "@/core/components";
import { computed, onMounted, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { service } from "../services/m17.service";
import { message, notify } from "../store/useM17";
import type { Parametro } from "../interfaces";
const rows = ref<Parametro[]>([]);
const initial = ref<Parametro[]>([]);
const error = ref("");
const loading = ref(true);
const busy = ref(false);
const confirm = ref(false);
import { parameterMeta as meta, parametroSchema } from "../dtos/parametro.dto";
const changed = computed(() =>
  rows.value.filter(
    (p) =>
      String(p.valor) !==
      String(initial.value.find((x) => x.clave === p.clave)?.valor),
  ),
);
async function load() {
  loading.value = true;
  error.value = "";
  try {
    rows.value = await service.parameters();
    initial.value = structuredClone(rows.value.map((p) => ({ ...p })));
  } catch (e) {
    error.value = message(e);
  } finally {
    loading.value = false;
  }
}
onMounted(load);
function validate() {
  error.value = "";
  for (const p of changed.value) {
    if (!parametroSchema.safeParse(p).success) {
      error.value = "Revisa los valores y sus rangos permitidos.";
      return;
    }
  }
  confirm.value = true;
}
async function save() {
  busy.value = true;
  error.value = "";
  try {
    for (const p of [...changed.value]) {
      const old = initial.value.find((x) => x.clave === p.clave);
      await service.parameter({ clave: p.clave, valor: Number(p.valor) });
      if (old) old.valor = p.valor;
    }
    confirm.value = false;
    notify("Parámetros actualizados.");
    await load();
  } catch (e) {
    error.value = message(e);
    confirm.value = false;
  } finally {
    busy.value = false;
  }
}
onBeforeRouteLeave(
  () =>
    !changed.value.length ||
    window.confirm("Hay parámetros sin guardar. ¿Quieres salir?"),
);
</script>
<template>
  <PageHeader
    title="Configuración del sistema"
    description="Administra los parámetros operativos de Pintu Clic."
  />
  <div class="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
    <form
      class="rounded-xl border border-neutral-light bg-neutral-white"
      @submit.prevent="validate"
    >
      <header class="flex items-center gap-3 border-b border-neutral-light p-4 sm:p-6">
        <Icon name="lock" class="text-action" />
        <div>
          <h2 class="font-bold text-corporate">Acceso y seguridad</h2>
          <p class="mt-1 text-xs text-neutral-medium">
            Parámetros disponibles en el servicio M17
          </p>
        </div>
      </header>
      <div class="p-6">
        <p v-if="loading" role="status">Cargando configuración…</p>
        <p v-else-if="!rows.length" class="text-sm text-neutral-medium">
          El servidor no devolvió parámetros disponibles.
        </p>
        <div
          v-for="p in rows"
          :key="p.clave"
          class="border-b border-neutral-light py-6 first:pt-0 last:border-0 last:pb-0"
        >
          <label :for="p.clave" class="text-sm font-semibold text-corporate">{{
            meta[p.clave]?.label || p.clave
          }}</label>
          <p class="mt-2 text-sm leading-6 text-neutral-medium">
            {{ p.descripcion }}
          </p>
          <div class="mt-4 flex flex-wrap items-center gap-3">
            <input
              :id="p.clave"
              v-model="p.valor"
              type="number"
              step="1"
              required
              :min="meta[p.clave]?.min"
              :max="meta[p.clave]?.max"
              :disabled="busy || !meta[p.clave]"
              class="w-40 rounded-lg border border-neutral-light px-4 py-3 text-sm"
            /><span class="text-sm text-neutral-medium">{{
              meta[p.clave]?.unit
            }}</span
            ><Button
              v-if="meta[p.clave]"
              variant="ghost"
              :disabled="busy"
              @click="p.valor = meta[p.clave]!.default"
              >Restablecer</Button
            >
          </div>
          <p v-if="meta[p.clave]" class="mt-2 text-xs text-neutral-medium">
            Rango: {{ meta[p.clave]!.min.toLocaleString("es-CO") }}–{{
              meta[p.clave]!.max.toLocaleString("es-CO")
            }}. Valor por defecto:
            {{ meta[p.clave]!.default.toLocaleString("es-CO") }}.
          </p>
        </div>
        <p
          v-if="error"
          role="alert"
          class="mt-5 rounded-lg bg-highlight/5 p-4 text-sm text-neutral-dark"
        >
          {{ error }}
        </p>
      </div>
      <footer
        class="flex flex-col justify-end gap-3 sm:flex-row sm:flex-wrap border-t border-neutral-light p-4 sm:p-6"
      >
        <Button variant="outline"
          :disabled="busy || !changed.length"
          @click="rows = initial.map((p) => ({ ...p }))"
          >Descartar cambios</Button
        ><Button
          type="submit"
          variant="green"
          icon="check"
          :disabled="busy || !changed.length"
          >Guardar cambios</Button
        >
      </footer>
    </form>
    <aside class="space-y-5">
      <div class="rounded-xl border border-neutral-light bg-neutral-white p-4 sm:p-6">
        <Icon name="shield" class="mb-4 h-8 w-8 text-action" />
        <h2 class="font-bold text-corporate">Administración exclusiva</h2>
        <p class="mt-3 text-sm leading-6 text-neutral-medium">
          Solo el administrador puede cambiar estos valores. Revisa el alcance
          antes de confirmar.
        </p>
      </div>
      <div class="rounded-xl border border-highlight/40 bg-highlight/10 p-5">
        <h3 class="text-sm font-bold text-corporate">
          Integración pendiente
        </h3>
        <p class="mt-2 text-sm leading-6 text-neutral-medium">
          El backend actual guarda estos ajustes en memoria. La persistencia y
          su aplicación a las políticas de sesión necesitan completarse antes de
          producción.
        </p>
      </div>
      <p class="px-2 text-xs leading-5 text-neutral-medium">
        Los demás parámetros de autenticación, reintentos de comunicación y
        reglas comerciales se incorporarán cuando estén disponibles en el
        servicio.
      </p>
    </aside>
  </div>
  <Modal
    v-if="confirm"
    title="Confirmar configuración"
    @close="!busy && (confirm = false)"
    ><p class="text-sm leading-6">
      Se enviarán estos cambios al sistema. Revisa los valores antes de
      continuar.
    </p>
    <dl class="my-5 space-y-3 text-sm">
      <div
        v-for="p in changed"
        :key="p.clave"
        class="rounded-lg bg-neutral-lightest p-3"
      >
        <dt class="font-semibold">{{ meta[p.clave]?.label || p.clave }}</dt>
        <dd class="mt-1">
          {{ initial.find((x) => x.clave === p.clave)?.valor }} → {{ p.valor }}
        </dd>
      </div>
    </dl>
    <div class="flex flex-col justify-end gap-3 sm:flex-row">
      <Button variant="outline" :disabled="busy" @click="confirm = false">Cancelar</Button
      ><Button variant="green" :disabled="busy" @click="save">{{
        busy ? "Guardando…" : "Confirmar cambios"
      }}</Button>
    </div></Modal
  >
</template>
