<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
    <header class="flex items-center gap-3">
      <div class="relative h-12 w-12 shrink-0">
        <svg viewBox="0 0 44 44" class="h-full w-full -rotate-90">
          <circle cx="22" cy="22" r="19" fill="none" stroke="var(--color-neutral-light)" stroke-width="5" />
          <circle
            cx="22"
            cy="22"
            r="19"
            fill="none"
            stroke="var(--color-conversion)"
            stroke-width="5"
            stroke-linecap="round"
            :stroke-dasharray="`${arco} ${circunferencia}`"
          />
        </svg>
        <span
          class="absolute inset-0 grid place-items-center text-xs font-semibold text-neutral-black tabular-nums"
        >
          {{ progreso.completas }}/{{ progreso.total }}
        </span>
      </div>
      <div>
        <h2 class="text-base font-semibold text-neutral-black">Checklist de publicación</h2>
        <p class="mt-0.5 text-sm text-neutral-medium">
          Completa todos los campos obligatorios para publicar el producto.
        </p>
      </div>
    </header>

    <ul class="mt-4 space-y-2">
      <li
        v-for="seccion in checklist"
        :key="seccion.clave"
        class="flex items-center gap-2.5 text-sm"
      >
        <CheckCircle2
          v-if="seccion.completa"
          class="h-4 w-4 shrink-0 text-conversion"
          aria-hidden="true"
        />
        <Circle v-else class="h-4 w-4 shrink-0 text-neutral-light" aria-hidden="true" />
        <span :class="seccion.completa ? 'text-neutral-dark' : 'text-neutral-medium'">
          {{ seccion.etiqueta }}
        </span>
        <span v-if="seccion.opcional" class="text-xs text-neutral-medium">(opcional)</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle2, Circle } from 'lucide-vue-next';
import type { ProgresoChecklist } from '../interfaces';

/** Ítem del checklist. `SeccionChecklist` (producto) y `SeccionChecklistVariante` lo satisfacen. */
interface ItemChecklist {
  clave: string;
  etiqueta: string;
  completa: boolean;
  opcional: boolean;
}

const props = defineProps<{
  checklist: ItemChecklist[];
  progreso: ProgresoChecklist;
}>();

const circunferencia = 2 * Math.PI * 19;
const arco = computed(() => {
  const ratio = props.progreso.total === 0 ? 0 : props.progreso.completas / props.progreso.total;
  return circunferencia * ratio;
});
</script>
