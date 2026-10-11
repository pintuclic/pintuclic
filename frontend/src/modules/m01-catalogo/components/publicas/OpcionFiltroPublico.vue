<template>
  <!-- Una opción de filtro: control + nombre (hasta 2 líneas) + conteo alineado a la derecha. -->
  <label
    class="flex min-h-10 cursor-pointer items-start gap-2.5 rounded-button px-2 py-2 text-sm leading-snug transition-colors hover:bg-neutral-lightest focus-within:ring-2 focus-within:ring-action"
    :class="seleccionado ? 'bg-subaction/50 font-medium text-action' : 'text-neutral-dark'"
    :title="nombre"
  >
    <input
      :type="tipo"
      :name="name"
      :checked="seleccionado"
      class="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-action"
      :class="tipo === 'checkbox' ? 'rounded' : ''"
      @change="cambiar"
    />
    <span class="line-clamp-2 min-w-0 flex-1 break-words">{{ nombre }}</span>
    <span v-if="cantidad !== null && cantidad !== undefined" class="ml-2 shrink-0 pt-px text-xs tabular-nums text-neutral-medium">{{ cantidad }}</span>
  </label>
</template>

<script setup lang="ts">
const props = defineProps<{
  tipo: 'radio' | 'checkbox';
  nombre: string;
  seleccionado: boolean;
  cantidad?: number | null;
  /** Grupo de los radios (los checkbox no lo usan). */
  name?: string;
}>();

const emit = defineEmits<{ cambiar: [] }>();

/**
 * Control gobernado por `seleccionado`: se devuelve el DOM al estado de la prop y es el
 * padre quien decide; así una opción que no cambia el filtro (p. ej. «Todos los
 * productos» ya marcada) no queda desmarcada visualmente.
 */
function cambiar(evento: Event): void {
  emit('cambiar');
  (evento.target as HTMLInputElement).checked = props.seleccionado;
}
</script>
