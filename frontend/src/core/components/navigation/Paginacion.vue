<script setup lang="ts">
import { computed } from 'vue';
import Button from '../buttons/Button.vue';
const props = withDefaults(defineProps<{ modelValue: number; total: number; pageSize?: number }>(), { pageSize: 8 });
const emit = defineEmits<{ 'update:modelValue': [page: number] }>();
const size = computed(() => Math.max(1, props.pageSize));
const pages = computed(() => Math.max(1, Math.ceil(props.total / size.value)));
const current = computed(() => Math.min(pages.value, Math.max(1, props.modelValue)));
</script>
<template>
  <nav aria-label="Paginación del listado" class="flex flex-col items-stretch justify-between gap-3 border-t border-neutral-light bg-neutral-white px-4 py-4 text-xs text-neutral-medium sm:flex-row sm:flex-wrap sm:items-center sm:px-6">
    <p aria-live="polite">{{ total ? `${(current - 1) * size + 1}–${Math.min(current * size, total)} de ${total}` : '0 resultados' }}</p>
    <div class="grid grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap">
      <Button class="min-h-11" variant="outline" size="sm" :disabled="current === 1" @click="emit('update:modelValue', current - 1)">Anterior</Button>
      <span class="col-span-2 row-start-1 text-center sm:order-none" aria-live="polite">Página {{ current }} de {{ pages }}</span>
      <Button class="min-h-11" variant="outline" size="sm" :disabled="current >= pages" @click="emit('update:modelValue', current + 1)">Siguiente</Button>
    </div>
  </nav>
</template>
