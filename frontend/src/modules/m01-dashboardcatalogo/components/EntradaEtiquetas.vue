<template>
  <div>
    <div
      class="flex flex-wrap items-center gap-2 rounded-input border border-neutral-light bg-neutral-white p-2 focus-within:border-action focus-within:ring-2 focus-within:ring-action/30"
    >
      <span
        v-for="etiqueta in etiquetas"
        :key="etiqueta"
        class="inline-flex items-center gap-1 rounded-button bg-subaction px-2 py-0.5 text-xs font-medium text-corporate"
      >
        {{ etiqueta }}
        <button
          type="button"
          class="grid h-4 w-4 place-items-center rounded-full text-corporate hover:bg-action/20"
          :aria-label="`Quitar etiqueta ${etiqueta}`"
          @click="$emit('quitar', etiqueta)"
        >
          <X class="h-3 w-3" aria-hidden="true" />
        </button>
      </span>

      <input
        v-model="borrador"
        type="text"
        :placeholder="etiquetas.length ? '' : placeholder"
        class="min-w-[8rem] flex-1 border-none bg-transparent text-sm text-neutral-dark outline-none"
        @keydown.enter.prevent="confirmar"
        @keydown="onRetroceso"
        @blur="confirmar"
      />
    </div>
    <p class="mt-1 text-xs text-neutral-medium">
      Presiona Enter para agregar cada etiqueta.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    etiquetas: string[];
    placeholder?: string;
  }>(),
  { placeholder: 'Ej. lavable, antibacterial, interior, premium…' }
);

const emit = defineEmits<{
  (e: 'agregar', valor: string): void;
  (e: 'quitar', valor: string): void;
}>();

const borrador = ref('');

function confirmar(): void {
  const valor = borrador.value.trim();
  if (valor) emit('agregar', valor);
  borrador.value = '';
}

function onRetroceso(evento: KeyboardEvent): void {
  const ultima = props.etiquetas.at(-1);
  if (evento.key === 'Backspace' && borrador.value === '' && ultima) {
    emit('quitar', ultima);
  }
}
</script>
