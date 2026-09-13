<template>
  <article class="rounded-card border border-neutral-light p-4">
    <h3 class="text-sm font-bold text-corporate">{{ esquema.nombre }}</h3>
    <p class="mt-1 min-h-10 text-xs text-neutral-medium">{{ esquema.descripcion }}</p>
    <div class="mt-3 flex h-9 overflow-hidden rounded-button">
      <button
        v-for="color in esquema.colores"
        :key="color.id_color"
        type="button"
        class="min-w-7 flex-1 border-y border-neutral-light transition-[flex-grow,filter] duration-200 hover:flex-[1.5] hover:brightness-105 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        :class="color.id_color === colorSeleccionadoId ? 'ring-2 ring-action ring-inset' : ''"
        :style="{ backgroundColor: color.muestra_hex ?? undefined }"
        :aria-label="`Seleccionar ${color.nombre}, ${color.codigo ?? 'sin código comercial'}`"
        @mouseenter="colorEnHover = color"
        @mouseleave="colorEnHover = null"
        @focus="colorEnHover = color"
        @blur="colorEnHover = null"
        @click="seleccionarColor(color.id_color)"
      />
    </div>
    <p class="mt-2 min-h-8 text-xs" :class="colorEnHover ? 'text-corporate' : 'text-neutral-medium'">
      <template v-if="colorEnHover">
        <strong>{{ colorEnHover.nombre }}</strong><br />{{ colorEnHover.codigo ?? 'Sin código comercial' }}
      </template>
      <template v-else>Pasa el cursor para ver nombre y código.</template>
    </p>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { ColorPaletaPublica } from '../../interfaces/catalogo-publico.interface';
import type { EsquemaColorPublico } from '../../composables/useCombinacionesPaleta';

defineProps<{ esquema: EsquemaColorPublico; colorSeleccionadoId: number | null }>();
const emit = defineEmits<{ seleccionar: [idColor: number] }>();
const colorEnHover = ref<ColorPaletaPublica | null>(null);

function seleccionarColor(idColor: number): void {
  colorEnHover.value = null;
  emit('seleccionar', idColor);
}
</script>
