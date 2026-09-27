<template>
  <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-neutral-light bg-white px-4 py-3 sm:px-6">
    <div class="flex flex-1 justify-between sm:hidden">
      <button
        @click="prevPage"
        :disabled="modelValue === 1"
        class="relative inline-flex items-center rounded-md border border-neutral-light bg-white px-4 py-2 text-sm font-medium text-corporate hover:bg-neutral-lightest disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Anterior
      </button>
      <button
        @click="nextPage"
        :disabled="modelValue === totalPages"
        class="relative ml-3 inline-flex items-center rounded-md border border-neutral-light bg-white px-4 py-2 text-sm font-medium text-corporate hover:bg-neutral-lightest disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Siguiente
      </button>
    </div>
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-neutral-dark">
          Mostrando <span class="font-medium">{{ startIndex + 1 }}</span> a
          <span class="font-medium">{{ Math.min(endIndex, total) }}</span> de
          <span class="font-medium">{{ total }}</span> resultados
        </p>
      </div>
      <div>
        <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <button
            @click="prevPage"
            :disabled="modelValue === 1"
            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-neutral-medium ring-1 ring-inset ring-neutral-light hover:bg-neutral-lightest focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="sr-only">Anterior</span>
            <ChevronLeft class="h-5 w-5" aria-hidden="true" />
          </button>
          
          <button
            v-for="page in totalPages"
            :key="page"
            @click="$emit('update:modelValue', page)"
            :aria-current="page === modelValue ? 'page' : undefined"
            :class="[
              page === modelValue
                ? 'relative z-10 inline-flex items-center bg-action px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action'
                : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-corporate ring-1 ring-inset ring-neutral-light hover:bg-neutral-lightest focus:z-20 focus:outline-offset-0'
            ]"
          >
            {{ page }}
          </button>

          <button
            @click="nextPage"
            :disabled="modelValue === totalPages"
            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-neutral-medium ring-1 ring-inset ring-neutral-light hover:bg-neutral-lightest focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="sr-only">Siguiente</span>
            <ChevronRight class="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: number;
  total: number;
  pageSize?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

const size = computed(() => props.pageSize || 10);
const totalPages = computed(() => Math.max(1, Math.ceil(props.total / size.value)));

const startIndex = computed(() => (props.modelValue - 1) * size.value);
const endIndex = computed(() => props.modelValue * size.value);

const prevPage = () => {
  if (props.modelValue > 1) {
    emit('update:modelValue', props.modelValue - 1);
  }
};

const nextPage = () => {
  if (props.modelValue < totalPages.value) {
    emit('update:modelValue', props.modelValue + 1);
  }
};
</script>
