<template>
  <component
    :is="tag"
    v-bind="routeProps"
    :class="[
<<<<<<< HEAD
      'inline-flex items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2',
=======
      'inline-flex items-center justify-center rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2',
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
      {
        'bg-transparent hover:bg-neutral-light text-neutral-medium hover:text-corporate': tone === 'neutral',
        'bg-transparent hover:bg-subaction text-action': tone === 'action',
        'bg-transparent hover:bg-conversion/20 text-conversion': tone === 'success',
        'bg-transparent hover:bg-highlight/20 text-highlight': tone === 'warning',
<<<<<<< HEAD
=======
        'bg-transparent hover:bg-danger-subtle text-danger hover:text-danger-hover': tone === 'danger',
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
        'opacity-50 cursor-not-allowed pointer-events-none': disabled
      }
    ]"
    :aria-label="label"
<<<<<<< HEAD
    :disabled="disabled && tag === 'button'"
    @click="$emit('click', $event)"
  >
    <component
      :is="icon"
      v-if="icon"
=======
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
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
      :size="size"
      :stroke-width="strokeWidth"
      aria-hidden="true"
    />
    <slot v-else />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
<<<<<<< HEAD
import type { Component } from 'vue';

const props = defineProps<{
  icon?: Component;
  label: string;
  tone?: 'neutral' | 'action' | 'success' | 'warning';
=======
import { RouterLink } from 'vue-router';
import type { Component } from 'vue';
import Icon from '../data-display/Icon.vue';

const props = defineProps<{
  icon?: Component | string;
  label: string;
  tone?: 'neutral' | 'action' | 'success' | 'warning' | 'danger';
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  to?: string | object;
  href?: string;
  disabled?: boolean;
  size?: number | string;
  strokeWidth?: number | string;
<<<<<<< HEAD
=======
  hasPopup?: 'dialog';
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
}>();

defineEmits<{
  (e: 'click', event: Event): void;
}>();

const tag = computed(() => {
<<<<<<< HEAD
  if (props.to) return 'RouterLink';
=======
  if (props.to) return RouterLink;
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
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
