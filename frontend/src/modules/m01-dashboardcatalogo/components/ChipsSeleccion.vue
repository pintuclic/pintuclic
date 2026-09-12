<template>
  <div>
    <div v-if="seleccionadas.length" class="mb-2 flex flex-wrap gap-2">
      <span
        v-for="op in seleccionadas"
        :key="op.valor"
        class="inline-flex items-center gap-1 rounded-button bg-subaction px-2.5 py-1 text-xs font-medium text-corporate"
      >
        {{ op.etiqueta }}
        <button
          type="button"
          class="grid h-4 w-4 place-items-center rounded-full text-corporate hover:bg-action/20"
          :aria-label="`Quitar ${op.etiqueta}`"
          @click="$emit('alternar', op.valor)"
        >
          <X class="h-3 w-3" aria-hidden="true" />
        </button>
      </span>
    </div>

    <select
      v-if="disponibles.length"
      v-model="pendiente"
      class="w-full rounded-input border border-neutral-light bg-neutral-white px-3 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
      @change="onAgregar"
    >
      <option value="" disabled>{{ etiquetaAgregar }}…</option>
      <option v-for="op in disponibles" :key="op.valor" :value="op.valor">
        {{ op.etiqueta }}
      </option>
    </select>
    <p v-else class="text-xs text-neutral-medium">No quedan opciones por agregar.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { X } from 'lucide-vue-next';
import type { OpcionSelect } from '../interfaces';

/**
 * Selección múltiple como chips removibles + un `<select>` para añadir.
 * Usado por el formulario de categoría (filtros heredados, líneas relacionadas).
 */
const props = defineProps<{
  opciones: OpcionSelect[];
  seleccionados: string[];
  etiquetaAgregar: string;
}>();

const emit = defineEmits<{
  (e: 'alternar', valor: string): void;
}>();

const pendiente = ref('');

const seleccionadas = computed(() =>
  props.opciones.filter((op) => props.seleccionados.includes(op.valor))
);
const disponibles = computed(() =>
  props.opciones.filter((op) => !props.seleccionados.includes(op.valor))
);

function onAgregar(): void {
  const valor = pendiente.value;
  pendiente.value = '';
  if (valor) emit('alternar', valor);
}
</script>
