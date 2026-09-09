<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-2">
      <label :for="idControl" class="text-sm font-medium text-neutral-dark">
        {{ etiqueta }}
        <span v-if="requerido" class="text-action" aria-hidden="true">*</span>
      </label>
      <span v-if="contador" class="text-xs text-neutral-medium tabular-nums">
        {{ contador.actual }}/{{ contador.max }}
      </span>
    </div>

    <slot :id="idControl" :describedby="error ? `${idControl}-error` : undefined" />

    <p v-if="ayuda && !error" class="text-xs text-neutral-medium">{{ ayuda }}</p>
    <p
      v-if="error"
      :id="`${idControl}-error`"
      class="flex items-center gap-1 text-xs font-medium text-neutral-black"
      role="alert"
    >
      <AlertCircle class="h-3.5 w-3.5 shrink-0 text-highlight" aria-hidden="true" />
      {{ error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue';
import { AlertCircle } from 'lucide-vue-next';

/**
 * Envoltorio de campo de formulario: etiqueta + marca de obligatorio + contador
 * opcional + texto de ayuda / error. El control se pasa por el slot por defecto,
 * que recibe `id` y `describedby` para enlazarlo con `<label>` y el error.
 */
defineProps<{
  etiqueta: string;
  requerido?: boolean;
  error?: string;
  ayuda?: string;
  contador?: { actual: number; max: number };
}>();

const idControl = useId();
</script>
