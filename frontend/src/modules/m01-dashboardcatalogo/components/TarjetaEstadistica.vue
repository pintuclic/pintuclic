<template>
  <Card no-padding class="p-4">
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

    <div v-if="variacionPorcentaje !== undefined" class="mt-1.5">
      <Badge :estado="tonoTendencia" :label="variacionTexto" />
      <span class="ml-1.5 text-xs text-neutral-medium">vs. mes anterior</span>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { Card, Badge } from '@/core/components';
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

// La paleta no tiene rol "negativo": una bajada usa el mismo tono neutro que "sin cambio".
const tonoTendencia = computed(() => ((props.variacionPorcentaje ?? 0) > 0 ? 'success' : 'inactivo'));
</script>
