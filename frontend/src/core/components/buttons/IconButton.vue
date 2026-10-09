<template>
  <component
    :is="tag"
    v-bind="routeProps"
    :class="[
      'inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2 select-none',
      variant === 'boxed'
        ? [
            'h-9 w-9 rounded-lg border shadow-xs',
            tone === 'action' ? 'border-neutral-light bg-neutral-white text-action hover:border-action/50 hover:bg-subaction/30' : '',
            tone === 'neutral' ? 'border-neutral-light bg-neutral-white text-corporate hover:border-corporate/40 hover:bg-neutral-lightest' : '',
            tone === 'danger' ? 'border-danger/30 bg-neutral-white text-danger hover:border-danger hover:bg-danger/10' : '',
            tone === 'success' ? 'border-conversion/30 bg-neutral-white text-conversion hover:border-conversion hover:bg-conversion/10' : '',
            tone === 'warning' ? 'border-highlight/30 bg-neutral-white text-highlight hover:border-highlight hover:bg-highlight/10' : ''
          ]
        : [
            'rounded-lg',
            tone === 'neutral' ? 'bg-transparent hover:bg-neutral-light text-neutral-medium hover:text-corporate' : '',
            tone === 'action' ? 'bg-transparent hover:bg-subaction text-action' : '',
            tone === 'success' ? 'bg-transparent hover:bg-conversion/20 text-conversion' : '',
            tone === 'warning' ? 'bg-transparent hover:bg-highlight/20 text-highlight' : '',
            tone === 'danger' ? 'bg-transparent hover:bg-danger-subtle text-danger hover:text-danger-hover' : ''
          ],
      disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'
    ]"
    :aria-label="label"
    :title="title || label"
    :aria-haspopup="hasPopup"
    :disabled="disabled && tag === 'button'"
    @click="$emit('click', $event)"
  >
    <Icon
      v-if="typeof icon === 'string' && icon"
      :name="icon"
      class="shrink-0"
    />
    <component
      :is="icon"
      v-else-if="icon"
      :size="size"
      :stroke-width="strokeWidth"
      aria-hidden="true"
    />
    <slot v-else />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { Component } from 'vue';
import Icon from '../data-display/Icon.vue';

const props = withDefaults(
  defineProps<{
    icon?: Component | string;
    label: string;
    tone?: 'neutral' | 'action' | 'success' | 'warning' | 'danger';
    variant?: 'boxed' | 'ghost';
    to?: string | object;
    href?: string;
    disabled?: boolean;
    size?: number | string;
    strokeWidth?: number | string;
    hasPopup?: 'dialog';
    title?: string;
  }>(),
  {
    tone: 'neutral',
    variant: 'boxed',
    size: 18,
    strokeWidth: 2,
  }
);

defineEmits<{
  (e: 'click', event: Event): void;
}>();

const tag = computed(() => {
  if (props.to) return RouterLink;
  if (props.href) return 'a';
  return 'button';
});

const routeProps = computed(() => {
  if (props.to) return { to: props.to };
  if (props.href) return { href: props.href, target: '_blank', rel: 'noopener noreferrer' };
  return { type: 'button' };
});

const tone = computed(() => props.tone || 'neutral');
const size = computed(() => props.size || 18);
const strokeWidth = computed(() => props.strokeWidth || 2);
</script>
