<template>
  <article class="flex h-full flex-col justify-between rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm transition-all hover:border-action/40 hover:shadow-md sm:p-5">
    <div>
      <div class="flex items-center gap-2">
        <component :is="iconoEsquema(esquema.nombre)" :size="16" class="shrink-0 text-neutral-dark" aria-hidden="true" />
        <h3 class="font-title text-sm font-bold text-corporate">{{ esquema.nombre }}</h3>
      </div>
      <p class="mt-1.5 text-xs leading-5 text-neutral-medium">{{ esquema.descripcion }}</p>
    </div>

    <div v-if="esquema.colores.length" class="mt-4 flex h-9 overflow-hidden rounded-button border border-neutral-light shadow-inner">
      <button
        v-for="color in esquema.colores"
        :key="color.id_color"
        type="button"
        class="group flex min-w-0 flex-1 cursor-pointer items-center justify-center overflow-hidden transition-[flex,filter] duration-300 hover:flex-[2.5] hover:brightness-105 active:brightness-95 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-inset"
        :class="color.id_color === colorSeleccionadoId ? 'ring-2 ring-action ring-inset' : ''"
        :style="{ backgroundColor: color.muestra_hex ?? undefined }"
        :aria-label="`Seleccionar ${color.nombre}, ${color.codigo ?? 'sin código comercial'}`"
        :aria-pressed="color.id_color === colorSeleccionadoId"
        :title="`${color.nombre} · ${color.codigo ?? color.muestra_hex ?? 'Sin código'}`"
        @click="seleccionarColor(color.id_color)"
      >
        <span class="max-w-0 whitespace-nowrap font-mono text-[9px] font-bold opacity-0 drop-shadow transition-[max-width,opacity] duration-150 group-hover:max-w-32 group-hover:opacity-100 group-focus-visible:max-w-32 group-focus-visible:opacity-100" :class="claseTextoMuestra(color.muestra_hex)">
          {{ color.codigo ?? color.muestra_hex ?? 'Sin código' }}
        </span>
      </button>
    </div>

    <div v-else class="mt-4 rounded-card border border-dashed border-neutral-light bg-neutral-lightest p-4 text-center text-xs text-neutral-medium">
      No hay colores reales disponibles para esta armonía.
    </div>
  </article>
</template>

<script setup lang="ts">
import { Circle, Flag, Layers3, Triangle } from 'lucide-vue-next';
import type { EsquemaColorPublico } from '../../interfaces/publicas/catalogo-publico.interface';

const props = defineProps<{ esquema: EsquemaColorPublico; colorSeleccionadoId: number | null }>();
const emit = defineEmits<{ seleccionar: [idColor: number] }>();

const iconosEsquema = {
  Complementario: Circle,
  Análogos: Flag,
  Triádico: Triangle,
  Monocromático: Layers3,
} as const;

function iconoEsquema(nombre: string): (typeof iconosEsquema)[keyof typeof iconosEsquema] {
  return iconosEsquema[nombre as keyof typeof iconosEsquema] ?? Circle;
}

function claseTextoMuestra(hex: string | null): string {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return 'text-neutral-black';
  const rojo = Number.parseInt(hex.slice(1, 3), 16);
  const verde = Number.parseInt(hex.slice(3, 5), 16);
  const azul = Number.parseInt(hex.slice(5, 7), 16);
  return (rojo * 299 + verde * 587 + azul * 114) / 1000 >= 150 ? 'text-neutral-black' : 'text-white';
}

function seleccionarColor(idColor: number): void {
  emit('seleccionar', idColor);
}
</script>
