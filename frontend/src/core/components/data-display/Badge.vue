<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
      resolvedClasses,
      table ? 'w-auto sm:w-min whitespace-nowrap' : ''
    ]"
  >
    <span v-if="dot" class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    <slot>{{ computedLabel }}</slot>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    estado?: string;
    tone?: 'success' | 'warning' | 'info' | 'neutral';
    label?: string;
    table?: boolean;
    dot?: boolean;
  }>(),
  {
    estado: '',
    tone: undefined,
    label: '',
    table: false,
    dot: false
  }
);

const computedLabel = computed(() => {
  if (props.label) return props.label;
  if (!props.estado) return '';
  return props.estado.charAt(0).toUpperCase() + props.estado.slice(1);
});

const resolvedClasses = computed(() => {
  if (props.tone) {
    const toneMap = {
      success: 'bg-conversion/12 text-conversion ring-conversion/20',
      warning: 'bg-highlight/20 text-neutral-dark ring-highlight/40',
      info: 'bg-subaction text-action ring-action/20',
      neutral: 'bg-neutral-lightest text-neutral-dark ring-neutral-light/50',
    };
    return toneMap[props.tone] || toneMap.neutral;
  }

  const est = props.estado?.toLowerCase();
  if (est === 'activo' || est === 'success') {
    return 'bg-conversion/12 text-conversion ring-conversion/20';
  }
  if (est === 'inactivo') {
    return 'bg-neutral-lightest text-neutral-dark ring-neutral-light/50';
  }
  if (est === 'bloqueado' || est === 'error') {
    return 'bg-danger/10 text-danger ring-danger/20';
  }
  if (est === 'pendiente' || est === 'warning') {
    return 'bg-highlight/20 text-neutral-dark ring-highlight/40';
  }
  if (est === 'descuento') return 'bg-offer text-white font-bold ring-offer/30 shadow-sm';
  if (est === 'destacado') return 'bg-highlight text-corporate font-bold ring-highlight/30';
  return 'bg-subaction text-action ring-action/20';
});
</script>
