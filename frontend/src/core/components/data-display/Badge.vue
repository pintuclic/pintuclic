<template>
  <span
    :class="[
      'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
      estadoClasses,
      table ? 'w-auto sm:w-min whitespace-nowrap' : ''
    ]"
  >
    <slot>{{ computedLabel }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  estado?: string | 'activo' | 'inactivo' | 'bloqueado' | 'pendiente' | 'success' | 'warning' | 'error' | 'info';
  label?: string;
  table?: boolean;
}>();

const computedLabel = computed(() => {
  if (props.label) return props.label;
  if (!props.estado) return '';
  return props.estado.charAt(0).toUpperCase() + props.estado.slice(1);
});

const estadoClasses = computed(() => {
  const est = props.estado?.toLowerCase();
  
  if (est === 'activo' || est === 'success') {
    return 'bg-green-50 text-green-700 ring-green-600/20';
  }
  if (est === 'inactivo') {
    return 'bg-neutral-lightest text-neutral-dark ring-neutral-light/50';
  }
  if (est === 'bloqueado' || est === 'error') {
    return 'bg-red-50 text-red-700 ring-red-600/10';
  }
  if (est === 'pendiente' || est === 'warning') {
    return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
  }
  
  // Default (Info / Corporate)
  return 'bg-subaction text-action ring-action/20';
});
</script>
