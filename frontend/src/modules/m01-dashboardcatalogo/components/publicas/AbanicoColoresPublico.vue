<template>
  <div class="flex flex-col items-center md:items-start">
    <div class="relative h-[480px] w-full max-w-[480px] overflow-hidden sm:h-[520px]" aria-label="Abanico de colores disponibles">
      <div v-if="colorEnHover" class="absolute right-1 top-2 z-50 rounded-card border border-neutral-light bg-neutral-white px-3 py-2 text-right shadow-lg" role="tooltip">
        <strong class="block text-sm text-corporate">{{ colorEnHover.nombre }}</strong>
        <span class="text-xs text-neutral-medium">{{ colorEnHover.codigo ?? 'Sin código comercial' }}</span>
      </div>
      <div
        v-for="lamina in laminas"
        :key="lamina.indice"
        class="absolute bottom-10 left-[9%] grid h-[342px] w-[78px] origin-[50%_88%] cursor-grab select-none grid-rows-6 overflow-hidden rounded-[18px] border-2 border-neutral-white bg-neutral-white shadow-lg transition-transform duration-300 hover:-translate-y-1 active:cursor-grabbing sm:h-[390px] sm:w-[88px]"
        :style="{
          transform: `rotate(${lamina.angulo}deg)`,
          zIndex: lamina.zIndex,
        }"
        :title="`${lamina.familia} · Arrastra para abrir o cerrar el abanico`"
        @mousedown="iniciarMovimientoMouse($event, lamina.idOrden)"
      >
        <button
          v-for="(color, segmento) in lamina.colores"
          :key="`${lamina.indice}-${segmento}-${color.id_color}`"
          type="button"
          class="border-b border-neutral-white/60 transition-[filter] hover:brightness-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-inset"
          :class="color.id_color === colorSeleccionadoId && color.id_color === lamina.idColorDestacado ? 'ring-2 ring-action ring-inset' : ''"
          :style="{ backgroundColor: color.muestra_hex ?? undefined }"
          :aria-label="`Seleccionar ${color.nombre}, ${color.codigo ?? 'sin código comercial'}`"
          :aria-pressed="color.id_color === colorSeleccionadoId && color.id_color === lamina.idColorDestacado"
          @click="seleccionarDesdeLamina(color.id_color)"
          @mouseenter="colorEnHover = color"
          @mouseleave="colorEnHover = null"
          @focus="colorEnHover = color"
          @blur="colorEnHover = null"
        />
        <span class="absolute bottom-7 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-neutral-white bg-neutral-light" />
      </div>

      <div class="absolute bottom-10 left-[9%] z-30 h-[342px] w-[78px] overflow-hidden rounded-[18px] border-2 border-neutral-white bg-corporate shadow-xl sm:h-[390px] sm:w-[88px]" aria-hidden="true">
        <span class="absolute inset-x-0 top-12 border-t border-neutral-white/40" />
        <span class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 -rotate-90 items-center gap-2 whitespace-nowrap">
          <Palette :size="25" class="text-conversion" />
          <strong class="text-lg tracking-tight text-white">Pintu <span class="text-conversion">clic</span></strong>
        </span>
        <span class="absolute bottom-7 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-neutral-white bg-neutral-light" />
      </div>

      <span class="absolute bottom-[57px] left-[calc(9%+39px)] z-40 h-5 w-5 -translate-x-1/2 rounded-full border-4 border-neutral-white bg-action shadow sm:left-[calc(9%+44px)]" aria-hidden="true" />
    </div>

    <p v-if="colores.length" class="mt-1 text-center text-xs text-neutral-medium">
      Selecciona un color para explorar sus productos. Arrastra una lámina para abrir o cerrar el abanico.
    </p>
    <p v-else class="mt-1 text-center text-xs text-neutral-medium">
      Las láminas muestran la colección; los colores publicados aparecerán aquí.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { Palette } from 'lucide-vue-next';
import type { ColorPaletaPublica } from '../../interfaces/catalogo-publico.interface';

const props = defineProps<{
  colores: readonly ColorPaletaPublica[];
  colorSeleccionadoId: number | null;
}>();

const emit = defineEmits<{ seleccionar: [idColor: number] }>();
const colorEnHover = ref<ColorPaletaPublica | null>(null);
const idArrastreMouse = ref<number | null>(null);
const inicioMouseX = ref(0);
const aperturaInicial = ref(105);
const aperturaGrados = ref(105);
const movimientoFueArrastre = ref(false);

const laminas = computed(() => {
  const coloresPorFamilia = new Map<string, ColorPaletaPublica[]>();
  props.colores.forEach((color) => {
    const familia = color.familia ?? 'Colección';
    coloresPorFamilia.set(familia, [...(coloresPorFamilia.get(familia) ?? []), color]);
  });
  const familias = [...coloresPorFamilia.entries()];
  const grupos = familias.flatMap(([familia, colores]) =>
    colores.map((colorPrincipal, variante) => ({
      colores: Array.from({ length: 6 }, (_, segmento) =>
        colores[(variante + segmento) % colores.length]
      ).filter((color): color is ColorPaletaPublica => color !== undefined),
      colorPrincipal,
      familia,
    }))
  );

  return grupos.flatMap((grupo, indice) => {
    const principal = grupo.colores[0];
    if (!principal) return [];
    const anguloInicial = -10;
    const angulo = grupos.length > 1
      ? anguloInicial + (aperturaGrados.value * indice) / (grupos.length - 1)
      : anguloInicial + aperturaGrados.value;
    return [{
      angulo,
      colores: grupo.colores,
      familia: grupo.familia,
      idColorDestacado: grupo.colorPrincipal.id_color,
      idOrden: principal.id_color,
      indice,
      zIndex: 20 - indice,
    }];
  });
});

function iniciarMovimientoMouse(evento: globalThis.MouseEvent, idColor: number): void {
  if (evento.button !== 0) return;
  idArrastreMouse.value = idColor;
  inicioMouseX.value = evento.clientX;
  aperturaInicial.value = aperturaGrados.value;
  movimientoFueArrastre.value = false;
}

function moverConMouse(evento: globalThis.MouseEvent): void {
  if (idArrastreMouse.value === null) return;
  const desplazamiento = evento.clientX - inicioMouseX.value;
  if (Math.abs(desplazamiento) >= 5) movimientoFueArrastre.value = true;
  aperturaGrados.value = Math.min(110, Math.max(40, aperturaInicial.value + desplazamiento * 0.45));
}

function finalizarMovimientoMouse(): void {
  idArrastreMouse.value = null;
}

function seleccionarDesdeLamina(idColor: number): void {
  if (movimientoFueArrastre.value) {
    movimientoFueArrastre.value = false;
    return;
  }
  emit('seleccionar', idColor);
}

onMounted(() => {
  window.addEventListener('mousemove', moverConMouse);
  window.addEventListener('mouseup', finalizarMovimientoMouse);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', moverConMouse);
  window.removeEventListener('mouseup', finalizarMovimientoMouse);
});
</script>
