<template>
  <!-- Solo navegación: el contador de resultados vive una única vez sobre las tarjetas. -->
  <nav v-if="totalPaginas > 1" class="flex items-center justify-center gap-1.5" aria-label="Paginación del catálogo">
    <button
      type="button"
      class="grid h-10 w-10 place-items-center rounded-button border border-neutral-light bg-neutral-white text-corporate transition-colors hover:border-action hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="pagina <= 1"
      aria-label="Página anterior"
      @click="emit('cambiar', pagina - 1)"
    >
      <ChevronLeft :size="18" aria-hidden="true" />
    </button>

    <template v-for="(item, indice) in elementos" :key="`${item}-${indice}`">
      <span v-if="item === 'hueco'" class="px-1 text-sm text-neutral-medium" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="h-10 min-w-10 rounded-button px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        :class="item === pagina ? 'bg-action text-white shadow-sm' : 'border border-neutral-light bg-neutral-white text-corporate hover:border-action hover:text-action'"
        :aria-current="item === pagina ? 'page' : undefined"
        :aria-label="`Página ${item}`"
        @click="item !== pagina && emit('cambiar', item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="grid h-10 w-10 place-items-center rounded-button border border-neutral-light bg-neutral-white text-corporate transition-colors hover:border-action hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="pagina >= totalPaginas"
      aria-label="Página siguiente"
      @click="emit('cambiar', pagina + 1)"
    >
      <ChevronRight :size="18" aria-hidden="true" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = defineProps<{ pagina: number; totalPaginas: number }>();
const emit = defineEmits<{ cambiar: [pagina: number] }>();

/** Primera, última y vecinas de la actual; el resto se resume con «…» para no desbordar en móvil. */
const elementos = computed<(number | 'hueco')[]>(() => {
  const total = props.totalPaginas;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const visibles = new Set([1, total, props.pagina - 1, props.pagina, props.pagina + 1]);
  const paginas = [...visibles].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const resultado: (number | 'hueco')[] = [];
  paginas.forEach((p, i) => {
    if (i > 0 && p - (paginas[i - 1] ?? p) > 1) resultado.push('hueco');
    resultado.push(p);
  });
  return resultado;
});
</script>
