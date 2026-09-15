<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-6 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-6 opacity-0"
  >
    <div
      v-if="cantidad > 0"
      class="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center gap-3 rounded-card border border-neutral-light bg-neutral-dark px-4 py-2.5 text-sm text-neutral-white shadow-xl"
      role="toolbar"
      aria-label="Acciones masivas"
    >
      <span class="flex items-center gap-2 font-medium">
        <span class="grid h-6 min-w-6 place-items-center rounded-full bg-action px-1.5 text-xs font-bold text-neutral-white">
          {{ cantidad }}
        </span>
        {{ cantidad === 1 ? 'elemento seleccionado' : 'elementos seleccionados' }}
      </span>

      <div class="h-4 w-px bg-neutral-medium/40" aria-hidden="true" />

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-button bg-action px-3 py-1 text-xs font-medium text-neutral-white hover:bg-action-hover"
          @click="$emit('activar-lote')"
        >
          <Power class="h-3.5 w-3.5" aria-hidden="true" />
          Activar
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-button border border-neutral-medium/50 px-3 py-1 text-xs font-medium text-neutral-white hover:bg-neutral-medium/20"
          @click="$emit('desactivar-lote')"
        >
          <PowerOff class="h-3.5 w-3.5" aria-hidden="true" />
          Desactivar
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-button border border-neutral-medium/50 px-3 py-1 text-xs font-medium text-neutral-white hover:bg-neutral-medium/20"
          @click="$emit('exportar-lote')"
        >
          <Download class="h-3.5 w-3.5" aria-hidden="true" />
          Exportar
        </button>
      </div>

      <button
        type="button"
        class="ml-1 grid h-7 w-7 place-items-center rounded-button text-neutral-light hover:bg-neutral-medium/30 hover:text-neutral-white"
        aria-label="Deseleccionar todo"
        @click="$emit('limpiar')"
      >
        <X class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { Power, PowerOff, Download, X } from 'lucide-vue-next';

defineProps<{
  cantidad: number;
}>();

defineEmits<{
  (e: 'activar-lote'): void;
  (e: 'desactivar-lote'): void;
  (e: 'exportar-lote'): void;
  (e: 'limpiar'): void;
}>();
</script>
