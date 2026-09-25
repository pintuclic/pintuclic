<template>
<<<<<<< HEAD
  <div>
    <!-- Indicador visual de pasos de un proceso (registro, checkout). -->
=======
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
        <span v-if="paso">{{ paso }}</span>
      </div>
      <div v-if="index < pasos.length - 1" class="w-8 border-t-[3px] border-subaction mx-2"></div>
    </template>
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  </div>
</template>

<script setup lang="ts">
<<<<<<< HEAD
// TODO: Implementar l�gica de UI y props usando Tailwind CSS
=======
import { Check as CheckIcon } from 'lucide-vue-next';

/**
 * Indicador de progreso genérico para flujos multi-paso (Design System Pintu Clic).
 *
 * Responsabilidad única: pintar el estado de cada paso según `pasoActual`.
 * Reutilizable en cualquier flujo (registro M04, checkout M05, asistentes admin, etc.).
 */
const props = defineProps<{
  /** Etiquetas de cada paso, en orden. Ej: ['Datos', 'Verificación', 'Listo']. */
  pasos: string[];
  /** Paso activo, 1-indexado. */
  pasoActual: number;
  /** Total opcional de pasos si difiere de pasos.length */
  totalPasos?: number;
}>();

function textClass(numero: number): string {
  if (numero <= props.pasoActual) return 'text-corporate';
  return 'text-neutral-medium';
}

function circleClass(numero: number): string {
  if (numero <= props.pasoActual) return 'bg-corporate text-white font-bold';
  return 'bg-subaction text-corporate font-bold';
}
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
</script>
