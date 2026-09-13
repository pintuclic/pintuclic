<template>
  <div class="flex flex-col items-center">
    <div class="relative h-[340px] w-full max-w-[390px] overflow-hidden sm:h-[390px]" aria-label="Abanico de colores disponibles">
      <component
        :is="lamina.color ? 'button' : 'span'"
        v-for="lamina in laminas"
        :key="lamina.indice"
        :type="lamina.color ? 'button' : undefined"
        :disabled="!lamina.color"
        class="absolute bottom-7 left-[22%] h-[285px] w-[78px] origin-[50%_88%] overflow-hidden rounded-[18px] border-2 border-neutral-white shadow-lg transition-transform duration-300 sm:h-[325px] sm:w-[88px]"
        :class="[
          lamina.clase,
          lamina.color?.id_color === colorSeleccionadoId
            ? 'ring-2 ring-action ring-offset-2'
            : lamina.color
              ? 'hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2'
              : '',
        ]"
        :style="{ transform: `rotate(${lamina.angulo}deg)`, zIndex: lamina.zIndex }"
        :aria-label="lamina.color ? `Seleccionar ${lamina.color.nombre}` : undefined"
        :aria-pressed="lamina.color ? lamina.color.id_color === colorSeleccionadoId : undefined"
        :aria-hidden="lamina.color ? undefined : 'true'"
        @click="lamina.color && emit('seleccionar', lamina.color.id_color)"
      >
        <span class="absolute inset-x-0 top-12 border-t border-neutral-white/60" />
        <span
          v-if="lamina.color"
          class="absolute left-1/2 top-20 max-w-36 -translate-x-1/2 -rotate-90 truncate text-[10px] font-semibold text-white drop-shadow-sm"
        >
          {{ lamina.color.nombre }}
        </span>
        <span class="absolute bottom-7 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-neutral-white bg-neutral-light" />
      </component>

      <div class="absolute bottom-7 left-[22%] z-30 h-[285px] w-[78px] overflow-hidden rounded-[18px] border-2 border-neutral-white bg-corporate shadow-xl sm:h-[325px] sm:w-[88px]" aria-hidden="true">
        <span class="absolute inset-x-0 top-12 border-t border-neutral-white/40" />
        <span class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 -rotate-90 items-center gap-2 whitespace-nowrap">
          <Palette :size="25" class="text-conversion" />
          <strong class="text-lg tracking-tight text-white">Pintu <span class="text-conversion">clic</span></strong>
        </span>
        <span class="absolute bottom-7 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-neutral-white bg-neutral-light" />
      </div>

      <span class="absolute bottom-[45px] left-[calc(22%+39px)] z-40 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-neutral-white bg-action shadow sm:left-[calc(22%+44px)]" aria-hidden="true" />
    </div>

    <p v-if="colores.length" class="mt-1 text-center text-xs text-neutral-medium">
      Selecciona una lámina para explorar sus productos.
    </p>
    <p v-else class="mt-1 text-center text-xs text-neutral-medium">
      Las láminas muestran la colección; los colores publicados aparecerán aquí.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Palette } from 'lucide-vue-next';
import type { ColorPaletaPublica } from '../../interfaces/catalogo-publico.interface';

const props = defineProps<{
  colores: readonly ColorPaletaPublica[];
  colorSeleccionadoId: number | null;
}>();

const emit = defineEmits<{ seleccionar: [idColor: number] }>();

const clases = [
  'bg-neutral-light',
  'bg-subaction',
  'bg-conversion',
  'bg-action',
  'bg-corporate',
  'bg-highlight',
  'bg-action-hover',
  'bg-neutral-medium',
] as const;
const angulos = [10, 19, 28, 37, 46, 55, 64, 73] as const;

const laminas = computed(() => angulos.map((angulo, indice) => ({
  angulo,
  clase: clases[indice] ?? 'bg-action',
  color: props.colores[indice] ?? null,
  indice,
  zIndex: 20 - indice,
})));
</script>
