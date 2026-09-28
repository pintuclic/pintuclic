<template>
  <section aria-label="Métricas del catálogo">
    <div
      v-if="cargando"
      class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
    >
      <div
        v-for="n in 5"
        :key="n"
        class="h-[124px] animate-pulse rounded-card border border-neutral-light bg-neutral-white"
      />
    </div>

    <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <TarjetaEstadistica
        v-for="metrica in metricas"
        :key="metrica.clave"
        :etiqueta="metrica.etiqueta"
        :valor="metrica.valor"
        :variacion-porcentaje="metrica.variacionPorcentaje"
        :icono="ICONOS[metrica.clave] ?? Package"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { Package, Layers, LayoutGrid, Tag, Droplet, Search } from 'lucide-vue-next';
import type { Component } from 'vue';
import TarjetaEstadistica from './TarjetaEstadistica.vue';
import type { ClaveMetricaCatalogo, MetricaCatalogo } from '../interfaces';

defineProps<{
  metricas: MetricaCatalogo[];
  cargando?: boolean;
}>();

const ICONOS: Record<ClaveMetricaCatalogo, Component> = {
  productos_activos: Package,
  variantes_activas: Layers,
  categorias: LayoutGrid,
  marcas: Tag,
  colores: Droplet,
  busquedas_sin_resultado: Search,
};
</script>
