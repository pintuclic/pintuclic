<template>
  <section aria-label="Accesos rápidos">
    <header class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-semibold text-neutral-black">Accesos rápidos</h2>
      <button
        type="button"
        class="inline-flex items-center gap-1 text-sm font-medium text-action hover:underline"
        @click="$emit('verMas')"
      >
        Ver más acciones
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </button>
    </header>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="acceso in accesosVisibles"
        :key="acceso.clave"
        class="flex flex-col rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm"
      >
        <span
          class="flex h-10 w-10 items-center justify-center rounded-card"
          :class="CLASES_ICONO[acceso.rol]"
        >
          <component :is="ICONOS[acceso.clave] ?? Plus" class="h-5 w-5" aria-hidden="true" />
        </span>

        <h3 class="mt-4 text-base font-semibold text-neutral-black">{{ acceso.titulo }}</h3>
        <p class="mt-1 flex-1 text-sm text-neutral-medium">{{ acceso.descripcion }}</p>

        <button
          type="button"
          class="mt-4 inline-flex w-full items-center justify-center rounded-button px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
          :class="CLASES_BOTON[acceso.rol]"
          @click="$emit('navegar', acceso.destino)"
        >
          {{ acceso.textoBoton }}
        </button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ArrowRight, Plus, Layers, LayoutGrid, Droplet, Search, BarChart3 } from 'lucide-vue-next';
import type { Component } from 'vue';
import type { AccesoRapido, RolAccesoRapido } from '../interfaces';

const props = withDefaults(
  defineProps<{
    accesos: AccesoRapido[];
    /** Máximo de tarjetas a mostrar en la cuadrícula (el resto va en "Ver más"). */
    limite?: number;
  }>(),
  { limite: 4 }
);

defineEmits<{
  (e: 'navegar', destino: string): void;
  (e: 'verMas'): void;
}>();

const accesosVisibles = computed(() => props.accesos.slice(0, props.limite));

const ICONOS: Record<string, Component> = {
  crear_producto: Plus,
  gestionar_variantes: Layers,
  revisar_categorias: LayoutGrid,
  gestionar_colores: Droplet,
  ver_busquedas: Search,
  ver_reportes: BarChart3,
};

// Todos los colores salen de tokens del design system (action / conversion /
// subaction / highlight). Sin hex arbitrarios ni colores Tailwind por defecto.
const CLASES_ICONO: Record<RolAccesoRapido, string> = {
  accion: 'bg-action/10 text-action',
  conversion: 'bg-conversion/10 text-conversion',
  catalogo: 'bg-subaction text-corporate',
  reporte: 'bg-highlight/20 text-neutral-dark',
};

const CLASES_BOTON: Record<RolAccesoRapido, string> = {
  accion: 'bg-action hover:bg-action-hover text-neutral-white focus:ring-action',
  conversion: 'bg-conversion hover:bg-conversion-hover text-neutral-white focus:ring-conversion',
  catalogo: 'bg-subaction hover:bg-subaction/80 text-corporate focus:ring-corporate',
  reporte: 'bg-highlight hover:bg-highlight/90 text-neutral-black focus:ring-highlight',
};
</script>
