<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-6 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-6 opacity-0"
  >
    <div
      v-if="cantidad > 0"
      class="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center gap-3 rounded-card border border-neutral-light bg-neutral-white px-4 py-2.5 shadow-xl"
      role="toolbar"
      aria-label="Acciones masivas"
    >
      <span class="flex items-center gap-2 text-sm font-medium text-neutral-dark">
        <span class="grid h-6 min-w-6 place-items-center rounded-full bg-action px-1.5 text-xs font-bold text-white">
          {{ cantidad }}
        </span>
        {{ cantidad === 1 ? 'seleccionado' : 'seleccionados' }}
      </span>

      <div class="h-5 w-px bg-neutral-light" aria-hidden="true" />

      <div class="flex flex-wrap items-center gap-2">
        <Button variant="subaction" size="sm" :icon="Power" @click="$emit('activar-lote')">
          Activar
        </Button>
        <Button variant="danger" size="sm" :icon="PowerOff" @click="$emit('desactivar-lote')">
          Desactivar
        </Button>
        <Button variant="outline" size="sm" :icon="Download" @click="$emit('exportar-lote')">
          Exportar
        </Button>
        <Button variant="outline" size="sm" :icon="X" @click="$emit('limpiar')">
          Limpiar
        </Button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - BARRA DE ACCIONES MASIVAS
 * Ubicación: src/modules/m01-dashboardcatalogo/components/BarraAccionesMasivas.vue
 *
 * Barra flotante que aparece cuando hay filas seleccionadas en un listado
 * (la selección la aporta `selectable` + `v-model` del `Table` del Core).
 *
 * «Activar»/«Desactivar» en lote no tienen endpoint por lotes en la API real:
 * las vistas los tratan como no-ops honestos que solo limpian la selección,
 * sin simular un resultado que el backend no entrega. «Exportar» reutiliza la
 * misma ruta de exportación que el botón individual de cada listado.
 * ==============================================================================
 */
import { Power, PowerOff, Download, X } from 'lucide-vue-next';
import { Button } from '@/core/components';

defineProps<{
  /** Número de filas seleccionadas. Con 0 la barra no se renderiza. */
  cantidad: number;
}>();

defineEmits<{
  (e: 'activar-lote'): void;
  (e: 'desactivar-lote'): void;
  (e: 'exportar-lote'): void;
  (e: 'limpiar'): void;
}>();
</script>
