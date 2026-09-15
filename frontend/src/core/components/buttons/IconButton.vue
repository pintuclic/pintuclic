<template>
  <component
    :is="tag"
    v-bind="routeProps"
    :class="[
      'inline-flex items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2',
      {
        'bg-transparent hover:bg-neutral-light text-neutral-medium hover:text-corporate': tone === 'neutral',
        'bg-transparent hover:bg-subaction text-action': tone === 'action',
        'bg-transparent hover:bg-conversion/20 text-conversion': tone === 'success',
        'bg-transparent hover:bg-highlight/20 text-highlight': tone === 'warning',
        'opacity-50 cursor-not-allowed pointer-events-none': disabled
      }
    ]"
    :aria-label="label"
    :disabled="disabled && tag === 'button'"
    @click="$emit('click', $event)"
  >
    <component
      :is="icon"
      v-if="icon"
      :size="size"
      :stroke-width="strokeWidth"
      aria-hidden="true"
    />
    <slot v-else />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

const props = defineProps<{
  icon?: Component;
  label: string;
  tone?: 'neutral' | 'action' | 'success' | 'warning';
  to?: string | object;
  href?: string;
  disabled?: boolean;
  size?: number | string;
  strokeWidth?: number | string;
}>();

defineEmits<{
  (e: 'click', event: Event): void;
}>();

const tag = computed(() => {
  if (props.to) return 'RouterLink';
  if (props.href) return 'a';
  return 'button';
});

const routeProps = computed(() => {
  if (props.to) return { to: props.to };
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener noreferrer' };
  return { type: 'button' };
});

const tone = computed(() => props.tone || 'neutral');
const size = computed(() => props.size || 20);
const strokeWidth = computed(() => props.strokeWidth || 2);
</script>
