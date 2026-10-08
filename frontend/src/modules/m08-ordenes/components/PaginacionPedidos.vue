<template>
  <nav
    v-if="totalPaginas > 1"
    class="flex items-center justify-center gap-1.5 pt-2"
    aria-label="Paginación de pedidos"
  >
    <button
      type="button"
      class="w-8 h-8 grid place-items-center rounded-button border border-neutral-light bg-white text-neutral-dark transition-colors enabled:hover:border-action enabled:hover:text-action disabled:opacity-40"
      :disabled="modelValue === 1"
      aria-label="Página anterior"
      @click="emit('update:modelValue', modelValue - 1)"
    >
      <ChevronLeftIcon class="w-4 h-4" />
    </button>

    <button
      v-for="p in totalPaginas"
      :key="p"
      type="button"
      class="w-8 h-8 grid place-items-center rounded-button text-sm font-medium transition-colors tabular-nums"
      :class="
        p === modelValue
          ? 'bg-action text-white'
          : 'bg-white text-neutral-dark border border-neutral-light hover:border-action hover:text-action'
      "
      :aria-current="p === modelValue ? 'page' : undefined"
      @click="emit('update:modelValue', p)"
    >
      {{ p }}
    </button>

    <button
      type="button"
      class="w-8 h-8 grid place-items-center rounded-button border border-neutral-light bg-white text-neutral-dark transition-colors enabled:hover:border-action enabled:hover:text-action disabled:opacity-40"
      :disabled="modelValue === totalPaginas"
      aria-label="Página siguiente"
      @click="emit('update:modelValue', modelValue + 1)"
    >
      <ChevronRightIcon class="w-4 h-4" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-vue-next';

defineProps<{ modelValue: number; totalPaginas: number }>();
const emit = defineEmits<{ 'update:modelValue': [number] }>();
</script>
