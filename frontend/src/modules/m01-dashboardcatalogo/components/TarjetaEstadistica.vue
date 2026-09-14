<template>
  <article class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm">
    <div class="flex items-center gap-2.5">
      <span
        v-if="icono"
        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-card bg-subaction text-corporate"
      >
        <component :is="icono" class="h-4 w-4" aria-hidden="true" />
      </span>
      <p class="text-xs font-medium text-neutral-medium">{{ etiqueta }}</p>
    </div>

    <p class="mt-2.5 text-2xl font-bold text-neutral-black tabular-nums">{{ valorFormateado }}</p>

    <p v-if="variacionPorcentaje !== undefined" class="mt-1 flex items-center gap-1 text-xs">
      <component :is="iconoTendencia" class="h-3.5 w-3.5" :class="colorTendencia" aria-hidden="true" />
      <span class="font-semibold" :class="colorTendencia">{{ variacionTexto }}</span>
      <span class="text-neutral-medium">vs. mes anterior</span>
    </p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TrendingUp, TrendingDown, Minus } from 'lucide-vue-next';
import type { Component } from 'vue';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';

const props = defineProps<{
  etiqueta: string;
  valor: number;
  /** Puntos porcentuales. Omitir para no mostrar la línea de variación. */
  variacionPorcentaje?: number;
  icono?: Component;
}>();

const { formatearNumero, formatearVariacion } = useFormatoCatalogo();

const valorFormateado = computed(() => formatearNumero(props.valor));
const variacionTexto = computed(() =>
  props.variacionPorcentaje === undefined ? '' : formatearVariacion(props.variacionPorcentaje)
);

const iconoTendencia = computed<Component>(() => {
  const v = props.variacionPorcentaje ?? 0;
  if (v > 0) return TrendingUp;
  if (v < 0) return TrendingDown;
  return Minus;
});

// La paleta no tiene rol "negativo": una bajada va en neutro.
const colorTendencia = computed(() =>
  (props.variacionPorcentaje ?? 0) > 0 ? 'text-conversion' : 'text-neutral-medium'
);
</script>
