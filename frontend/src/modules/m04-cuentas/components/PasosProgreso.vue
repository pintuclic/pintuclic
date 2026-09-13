<template>
  <div class="flex items-center justify-center mb-8">
    <template v-for="(paso, index) in pasos" :key="paso">
      <div class="flex items-center gap-1.5 text-xs font-semibold" :class="textClass(index + 1)">
        <span
          class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          :class="circleClass(index + 1)"
        >
          <CheckIcon v-if="index + 1 < pasoActual" class="w-3 h-3" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span>{{ paso }}</span>
      </div>
      <div v-if="index < pasos.length - 1" class="w-8 border-t-[3px] border-subaction mx-2"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Check as CheckIcon } from 'lucide-vue-next';

/**
 * Indicador de progreso genérico para flujos multi-paso (Guía UI 4.2).
 *
 * Responsabilidad única: pintar el estado de cada paso según `pasoActual`.
 * No conoce el contenido de ningún paso ni cuántos hay de antemano — recibe
 * la lista de etiquetas por props.
 *
 * Vive en core/components (no dentro de m04-cuentas) a propósito: el registro
 * es el primer flujo multi-paso del sitio, pero no el único que va a existir
 * (p. ej. la aprobación de cuenta empresa, o procesos multi-paso del panel
 * admin). Antes vivía hardcodeado dentro de ModalVerificacion.vue — moverlo
 * aquí es lo que evita que el día de mañana haya que tocar 3 archivos para
 * cambiar el diseño del stepper.
 */
const props = defineProps<{
  /** Etiquetas de cada paso, en orden. Ej: ['Datos', 'Verificación', 'Listo']. */
  pasos: string[];
  /** Paso activo, 1-indexado. */
  pasoActual: number;
}>();

function textClass(numero: number): string {
  if (numero <= props.pasoActual) return 'text-corporate';
  return 'text-neutral-medium';
}

function circleClass(numero: number): string {
  if (numero <= props.pasoActual) return 'bg-corporate text-white font-bold';
  return 'bg-subaction text-corporate font-bold';
}
</script>
