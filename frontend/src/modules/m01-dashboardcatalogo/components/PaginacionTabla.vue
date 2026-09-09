<template>
  <nav
    class="flex flex-col items-center justify-between gap-3 px-5 py-4 text-sm sm:flex-row"
    aria-label="Paginación"
  >
    <p class="text-neutral-medium">
      Mostrando <span class="font-medium text-neutral-dark">{{ desde }}</span> a
      <span class="font-medium text-neutral-dark">{{ hasta }}</span> de
      <span class="font-medium text-neutral-dark">{{ total }}</span> {{ etiqueta }}
    </p>

    <div class="flex items-center gap-1">
      <button
        type="button"
        class="grid h-8 w-8 place-items-center rounded-button border border-neutral-light text-neutral-dark hover:bg-neutral-lightest disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="pagina <= 1"
        aria-label="Página anterior"
        @click="$emit('ir-pagina', pagina - 1)"
      >
        <ChevronLeft class="h-4 w-4" aria-hidden="true" />
      </button>

      <template v-for="(item, i) in paginas" :key="i">
        <span v-if="item === '…'" class="px-1.5 text-neutral-medium">…</span>
        <button
          v-else
          type="button"
          class="h-8 min-w-8 rounded-button border px-2 text-sm font-medium"
          :class="
            item === pagina
              ? 'border-action bg-action text-neutral-white'
              : 'border-neutral-light text-neutral-dark hover:bg-neutral-lightest'
          "
          :aria-current="item === pagina ? 'page' : undefined"
          @click="$emit('ir-pagina', item as number)"
        >
          {{ item }}
        </button>
      </template>

      <button
        type="button"
        class="grid h-8 w-8 place-items-center rounded-button border border-neutral-light text-neutral-dark hover:bg-neutral-lightest disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="pagina >= totalPaginas"
        aria-label="Página siguiente"
        @click="$emit('ir-pagina', pagina + 1)"
      >
        <ChevronRight class="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
    etiqueta?: string;
  }>(),
  { etiqueta: 'resultados' }
);

defineEmits<{ (e: 'ir-pagina', numero: number): void }>();

const desde = computed(() => (props.total === 0 ? 0 : (props.pagina - 1) * props.porPagina + 1));
const hasta = computed(() => Math.min(props.pagina * props.porPagina, props.total));

/** Secuencia de páginas con elipsis: 1 … 4 [5] 6 … 31 */
const paginas = computed<(number | '…')[]>(() => {
  const ultima = props.totalPaginas;
  const actual = props.pagina;
  if (ultima <= 7) return Array.from({ length: ultima }, (_, i) => i + 1);

  const rango = new Set<number>([1, ultima, actual, actual - 1, actual + 1]);
  const ordenadas = [...rango].filter((n) => n >= 1 && n <= ultima).sort((a, b) => a - b);

  const salida: (number | '…')[] = [];
  ordenadas.forEach((n, i) => {
    if (i > 0 && n - ordenadas[i - 1] > 1) salida.push('…');
    salida.push(n);
  });
  return salida;
});
</script>
