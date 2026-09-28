<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
    aria-label="Estado del catálogo"
  >
    <header>
      <h2 class="text-lg font-semibold text-neutral-black">Estado del catálogo</h2>
      <p class="mt-0.5 text-sm text-neutral-medium">Distribución de productos por estado.</p>
    </header>

    <template v-if="cargando">
      <div class="mx-auto mt-6 h-40 w-40 animate-pulse rounded-full bg-neutral-lightest" />
      <div class="mt-6 space-y-2">
        <div v-for="n in 4" :key="n" class="h-6 animate-pulse rounded-input bg-neutral-lightest" />
      </div>
    </template>

    <template v-else-if="estado">
      <!-- Rosco -->
      <div class="relative mx-auto mt-6 h-44 w-44">
        <svg viewBox="0 0 160 160" class="h-full w-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            :r="RADIO"
            fill="none"
            stroke="var(--color-neutral-light)"
            :stroke-width="GROSOR"
          />
          <circle
            v-for="segmento in segmentos"
            :key="segmento.clave"
            cx="80"
            cy="80"
            :r="RADIO"
            fill="none"
            :stroke="segmento.color"
            :stroke-width="GROSOR"
            stroke-linecap="round"
            :stroke-dasharray="`${segmento.dash} ${CIRCUNFERENCIA - segmento.dash}`"
            :stroke-dashoffset="segmento.offset"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-2xl font-bold text-neutral-black">
            {{ formatearNumero(estado.totalProductos) }}
          </span>
          <span class="text-xs text-neutral-medium">Productos</span>
        </div>
      </div>

      <!-- Leyenda -->
      <ul class="mt-6 space-y-2.5">
        <li
          v-for="segmento in segmentos"
          :key="segmento.clave"
          class="flex items-center gap-3 text-sm"
        >
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: segmento.color }"
            aria-hidden="true"
          />
          <span class="flex-1 text-neutral-dark">{{ segmento.etiqueta }}</span>
          <span class="font-medium text-neutral-black">{{ formatearNumero(segmento.cantidad) }}</span>
          <span class="w-10 text-right text-neutral-medium">
            {{ formatearPorcentaje(segmento.porcentaje) }}
          </span>
        </li>
      </ul>

      <!-- Nota de salud -->
      <div class="mt-5 flex gap-3 rounded-card bg-subaction p-4">
        <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-conversion" aria-hidden="true" />
        <p class="text-sm text-corporate">{{ estado.mensajeSalud }}</p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle2 } from 'lucide-vue-next';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type { ClaveEstadoCatalogo, EstadoCatalogo } from '../interfaces';

const props = defineProps<{
  estado: EstadoCatalogo | null;
  cargando?: boolean;
}>();

const { formatearNumero, formatearPorcentaje } = useFormatoCatalogo();

const RADIO = 60;
const GROSOR = 20;
const CIRCUNFERENCIA = 2 * Math.PI * RADIO;

/**
 * Color de cada segmento tomado de los tokens oficiales (variables CSS de
 * `@theme` en style.css). No se usan hex arbitrarios.
 */
const COLOR_SEGMENTO: Record<ClaveEstadoCatalogo, string> = {
  activos: 'var(--color-conversion)',
  inactivos: 'var(--color-neutral-medium)',
  borradores: 'var(--color-action)',
  sin_stock: 'var(--color-highlight)',
};

const segmentos = computed(() => {
  let acumulado = 0;
  return (props.estado?.segmentos ?? []).map((segmento) => {
    const dash = (segmento.porcentaje / 100) * CIRCUNFERENCIA;
    const offset = -(acumulado / 100) * CIRCUNFERENCIA;
    acumulado += segmento.porcentaje;
    return {
      ...segmento,
      color: COLOR_SEGMENTO[segmento.clave] ?? 'var(--color-neutral-medium)',
      dash,
      offset,
    };
  });
});
</script>
