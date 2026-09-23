<template>
  <div class="flex flex-col items-start">
    <div
      class="relative flex min-h-[460px] w-full items-end justify-start overflow-hidden pb-6 pl-4 sm:pl-10"
      aria-label="Abanico de colores disponibles"
      @wheel.prevent="desplazarLaminas($event, laminas.length)"
    >
      <div v-if="colorEnHover" class="absolute right-1 top-2 z-50 rounded-card border border-neutral-light bg-neutral-white px-3 py-2 text-right shadow-lg" role="tooltip">
        <strong class="block text-sm text-corporate">{{ colorEnHover.nombre }}</strong>
        <span class="text-xs text-neutral-medium">{{ colorEnHover.codigo ?? 'Sin código comercial' }}</span>
      </div>
      <div class="relative h-[380px] w-20 shrink-0 origin-bottom-left scale-95 sm:scale-105">
        <div
          v-for="lamina in laminas"
          :key="lamina.indice"
          class="pointer-events-none absolute inset-0 origin-[50%_calc(100%-20px)] select-none transition-transform duration-500 ease-out"
          :style="{
            transform: `rotate(${lamina.angulo}deg)`,
            zIndex: laminaEnHoverIndice === lamina.indice ? 150 : lamina.zIndex,
          }"
          :title="`${lamina.familia} · Arrastra para abrir o cerrar el abanico`"
          @mousedown="iniciarMovimientoMouse($event, lamina.idOrden)"
          @mouseenter="laminaEnHoverIndice = lamina.indice"
          @mouseleave="laminaEnHoverIndice = null"
        >
          <div class="pointer-events-auto box-content flex h-full w-full cursor-grab flex-col overflow-hidden rounded-[24px] border-[3px] border-neutral-white bg-neutral-white shadow-lg transition-transform duration-300 ease-out hover:-translate-y-3 active:cursor-grabbing">
            <div class="flex min-h-0 flex-1 flex-col gap-px overflow-hidden bg-neutral-light">
              <button
                v-for="(color, segmento) in lamina.colores"
                :key="`${lamina.indice}-${segmento}-${color.id_color}`"
                type="button"
                class="group flex min-h-0 flex-1 cursor-pointer flex-col justify-end border-0 px-1.5 pb-1 pt-1 text-left shadow-inner transition-[flex,filter] duration-300 hover:flex-[1.2] hover:brightness-110 active:brightness-95 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-inset"
                :class="[
                  claseTextoMuestra(color.muestra_hex),
                  color.id_color === colorSeleccionadoId && color.id_color === lamina.idColorDestacado ? 'ring-2 ring-action ring-inset' : '',
                ]"
                :style="{ backgroundColor: color.muestra_hex ?? undefined }"
                :aria-label="`Seleccionar ${color.nombre}, ${color.codigo ?? 'sin código comercial'}`"
                :aria-pressed="color.id_color === colorSeleccionadoId && color.id_color === lamina.idColorDestacado"
                @click="seleccionarDesdeLamina(color.id_color)"
                @mouseenter="colorEnHover = color"
                @mouseleave="colorEnHover = null"
                @focus="colorEnHover = color"
                @blur="colorEnHover = null"
              >
                <span class="truncate font-mono text-[8px] font-bold leading-none tracking-wide opacity-90 transition-transform duration-300 group-hover:scale-110">
                  {{ color.nombre }}
                </span>
              </button>
            </div>
            <div class="h-[70px] shrink-0 bg-neutral-white" aria-hidden="true" />
          </div>
        </div>

        <div class="pointer-events-none absolute inset-0 z-[200] flex flex-col items-center overflow-hidden rounded-[24px] border border-neutral-dark/50 bg-corporate pt-8 shadow-xl" aria-hidden="true">
          <span class="h-3 w-3 rounded-full bg-neutral-black opacity-80 shadow-inner" />
          <span class="mt-28 flex rotate-90 items-center gap-2 whitespace-nowrap">
            <Palette :size="25" class="text-conversion" />
            <strong class="text-lg tracking-wider text-white">Pintu <span class="text-conversion">clic</span></strong>
          </span>
          <span class="absolute bottom-4 h-4 w-4 rounded-full border border-neutral-white/30 bg-neutral-light shadow" />
        </div>

        <span class="absolute bottom-3 left-1/2 z-[210] h-5 w-5 -translate-x-1/2 rounded-full border-4 border-neutral-white bg-action shadow" aria-hidden="true" />
      </div>
    </div>

    <p v-if="colores.length" class="mt-1 w-full text-center text-xs text-neutral-medium">
      Selecciona un color para explorar sus productos. Arrastra para abrir el abanico y usa la rueda para recorrer las láminas.
    </p>
    <p v-else class="mt-1 w-full text-center text-xs text-neutral-medium">
      Las láminas muestran la colección; los colores publicados aparecerán aquí.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Palette } from 'lucide-vue-next';
import type { ColorPaletaPublica } from '../../interfaces/publicas/catalogo-publico.interface';

const props = defineProps<{
  colores: readonly ColorPaletaPublica[];
  colorSeleccionadoId: number | null;
}>();

const emit = defineEmits<{ seleccionar: [idColor: number] }>();
const colorEnHover = ref<ColorPaletaPublica | null>(null);
const laminaEnHoverIndice = ref<number | null>(null);
const idArrastreMouse = ref<number | null>(null);
const inicioMouseX = ref(0);
const separacionInicial = ref(12);
const separacionGrados = ref(12);
const offset = ref(0);
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
    const angulo = Math.max(0, Math.min(95, 18 + (indice - offset.value) * separacionGrados.value));
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
  separacionInicial.value = separacionGrados.value;
  movimientoFueArrastre.value = false;
}

function moverConMouse(evento: globalThis.MouseEvent): void {
  if (idArrastreMouse.value === null) return;
  const desplazamiento = evento.clientX - inicioMouseX.value;
  if (Math.abs(desplazamiento) >= 5) movimientoFueArrastre.value = true;
  separacionGrados.value = Math.min(16, Math.max(5, separacionInicial.value + desplazamiento * 0.04));
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

function desplazarLaminas(evento: globalThis.WheelEvent, cantidad: number): void {
  const limite = Math.max(0, cantidad - 1);
  offset.value = Math.max(0, Math.min(limite, offset.value + (evento.deltaY > 0 ? 1 : -1)));
}

function claseTextoMuestra(hex: string | null): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 'text-neutral-black';
  const rojo = Number.parseInt(hex.slice(1, 3), 16);
  const verde = Number.parseInt(hex.slice(3, 5), 16);
  const azul = Number.parseInt(hex.slice(5, 7), 16);
  return (rojo * 299 + verde * 587 + azul * 114) / 1000 >= 150 ? 'text-neutral-black' : 'text-white';
}

watch(() => props.colores, () => {
  offset.value = 0;
});

onMounted(() => {
  window.addEventListener('mousemove', moverConMouse);
  window.addEventListener('mouseup', finalizarMovimientoMouse);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', moverConMouse);
  window.removeEventListener('mouseup', finalizarMovimientoMouse);
});
</script>
