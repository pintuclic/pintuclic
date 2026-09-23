<template>
  <section aria-label="Simulador de color en ambientes" class="overflow-hidden rounded-xl border border-neutral-light bg-neutral-white shadow-sm">
    <header class="flex flex-col gap-2 border-b border-neutral-light bg-neutral-lightest p-3">
      <h3 class="flex items-center gap-2 font-title text-sm font-bold text-corporate">
        <Palette :size="18" class="shrink-0 text-action" aria-hidden="true" />
        Simulador de color en ambientes
      </h3>
      <div class="flex flex-wrap gap-1" role="group" aria-label="Seleccionar ambiente">
        <button
          v-for="espacio in espacios"
          :key="espacio.id"
          type="button"
          class="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
          :class="ambienteActivo === espacio.id ? 'bg-action text-neutral-white' : 'bg-neutral-white text-neutral-dark hover:bg-subaction'"
          :aria-pressed="ambienteActivo === espacio.id"
          @click="ambienteActivo = espacio.id"
        >
          <component :is="espacio.icono" :size="14" aria-hidden="true" />
          {{ espacio.nombre }}
        </button>
      </div>
    </header>

    <!-- Tamaño fijo del visor con proporción uniforme 1:1; todas las imágenes tienen idéntico ancho y alto -->
    <div class="relative aspect-square w-full max-h-[384px] overflow-hidden bg-neutral-lightest">
      <img
        :src="espacioActual.imagen"
        :alt="`${espacioActual.nombre}: vista previa con ${colorNombre || 'el color seleccionado'}`"
        class="block h-full w-full object-cover transition-colors duration-300 motion-reduce:transition-none"
        :style="{ backgroundColor: colorEfectivoHex }"
        decoding="async"
      />
      <!-- Indicador sutil del ambiente actual -->
      <div class="pointer-events-none absolute top-2.5 right-2.5 z-10 rounded-md bg-neutral-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
        {{ espacioActual.nombre }}
      </div>
    </div>
    <footer class="space-y-2 border-t border-neutral-light p-3">
      <div class="flex items-center gap-2" aria-live="polite" aria-atomic="true">
        <MuestraColor :hex="colorEfectivoHex" :nombre="colorNombre" :codigo="colorCodigo" tamano="sm" />
        <div class="min-w-0 text-xs">
          <p class="font-semibold text-corporate truncate">{{ colorNombre || 'Selecciona un color del producto' }}</p>
          <p class="text-neutral-medium">{{ colorCodigo ? `${colorCodigo} · ` : '' }}{{ colorEfectivoHex }}</p>
        </div>
      </div>
      <p class="text-xs text-neutral-medium">
        Vista orientativa: el tono puede variar según la luz y la pantalla.
      </p>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Bath, BedDouble, Home, Palette, Sofa, UtensilsCrossed } from 'lucide-vue-next';
import { MuestraColor } from '@/core/components';
import { PINTUCLIC_COLORS } from '@/core/theme/colors';
import imgSala from '../../assets/ambientes/sala.png';
import imgCocina from '../../assets/ambientes/cocina.png';
import imgHabitacion from '../../assets/ambientes/habitacion.png';
import imgBano from '../../assets/ambientes/bano.png';
import imgFachada from '../../assets/ambientes/fachada.png';

const props = withDefaults(defineProps<{
  colorHex?: string | null;
  colorNombre?: string | null;
  colorCodigo?: string | null;
}>(), {
  colorHex: null,
  colorNombre: null,
  colorCodigo: null,
});

// Recursos de presentación locales; los colores comerciales llegan desde la ficha.
const espacios = [
  { id: 'sala', nombre: 'Sala', icono: Sofa, imagen: imgSala },
  { id: 'cocina', nombre: 'Cocina', icono: UtensilsCrossed, imagen: imgCocina },
  { id: 'habitacion', nombre: 'Habitación', icono: BedDouble, imagen: imgHabitacion },
  { id: 'bano', nombre: 'Baño', icono: Bath, imagen: imgBano },
  { id: 'fachada', nombre: 'Fachada', icono: Home, imagen: imgFachada },
] as const;

const ambienteActivo = ref<(typeof espacios)[number]['id']>('sala');
const espacioActual = computed(() => espacios.find((espacio) => espacio.id === ambienteActivo.value) ?? espacios[0]);
const colorEfectivoHex = computed(() => {
  const color = props.colorHex?.trim();
  if (!color) return PINTUCLIC_COLORS.neutral.white;
  return color.startsWith('#') ? color : `#${color}`;
});
</script>
