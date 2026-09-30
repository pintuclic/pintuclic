<template>
  <Teleport to="body">
    <dialog
      ref="dialogo"
      class="fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[820px] overflow-hidden rounded-2xl border border-neutral-light bg-neutral-lightest p-0 shadow-2xl backdrop:bg-neutral-black/60 backdrop:backdrop-blur-sm"
      aria-label="Calculadora de pintura del producto"
      @cancel.prevent="emit('cerrar')"
      @click="cerrarAlPulsarFondo"
    >
      <div class="flex max-h-[calc(100dvh-1.5rem)] flex-col">
        <div class="flex h-2 w-full shrink-0" aria-hidden="true">
          <span class="w-1/2 bg-gradient-to-r from-conversion via-highlight to-offer" />
          <span class="w-1/2 bg-gradient-to-r from-offer to-action" />
        </div>
        <div class="flex shrink-0 justify-end border-b border-neutral-light bg-neutral-white px-4 py-2">
          <button
            type="button"
            class="grid h-10 w-10 place-items-center rounded-button text-neutral-dark hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            aria-label="Cerrar calculadora"
            @click="emit('cerrar')"
          >
            <X :size="20" aria-hidden="true" />
          </button>
        </div>
        <div class="min-h-0 overflow-y-auto p-4 sm:p-6">
          <CalculadoraPinturaContenido :producto="producto" mostrar-volver compacto @agregar="emit('agregar')" @ver-producto="emit('cerrar')" />
        </div>
      </div>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import type { FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';
import CalculadoraPinturaContenido from './CalculadoraPinturaContenido.vue';

const props = defineProps<{ abierta: boolean; producto?: FichaProductoPublico | null }>();
const emit = defineEmits<{ cerrar: []; agregar: [] }>();
const dialogo = ref<HTMLDialogElement | null>(null);
let desbordamientoAnterior = '';

watch(() => props.abierta, async (abierta) => {
  await nextTick();
  if (abierta) {
    desbordamientoAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogo.value?.showModal();
  } else {
    dialogo.value?.close();
    document.body.style.overflow = desbordamientoAnterior;
  }
}, { immediate: true });

onBeforeUnmount(() => {
  dialogo.value?.close();
  if (props.abierta) document.body.style.overflow = desbordamientoAnterior;
});

function cerrarAlPulsarFondo(evento: { target: unknown }): void {
  if (evento.target === dialogo.value) emit('cerrar');
}
</script>
