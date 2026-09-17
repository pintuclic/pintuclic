<template>
  <component
    :is="tag"
    v-bind="routeProps"
    :class="[
      'inline-flex items-center justify-center font-title font-medium rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      variantClasses[variant],
      sizeClasses[size],
      { 'opacity-50 cursor-not-allowed pointer-events-none': disabled },
      customClass
    ]"
    :disabled="disabled && tag === 'button'"
    @click="$emit('click', $event)"
  >
    <component
      :is="icon"
      v-if="icon"
      :size="iconSize"
      class="mr-2 -ml-1"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

const props = defineProps<{
  variant?: 'corporate' | 'action' | 'subaction' | 'conversion' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'full';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  customClass?: string;
  icon?: Component;
  to?: string | object;
  href?: string;
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
  return { type: props.type || 'button' };
});

const variant = computed(() => props.variant || 'corporate');
const size = computed(() => props.size || 'md');

const variantClasses: Record<string, string> = {
  corporate: 'bg-corporate hover:bg-corporate/90 text-white focus-visible:ring-corporate',
  action: 'bg-action hover:bg-action/90 text-white focus-visible:ring-action',
  subaction: 'bg-subaction hover:bg-subaction/80 text-action focus-visible:ring-action',
  conversion: 'bg-conversion hover:bg-conversion-hover text-white focus-visible:ring-conversion',
  outline: 'border border-neutral-light bg-transparent hover:bg-neutral-lightest text-corporate focus-visible:ring-corporate',
  text: 'bg-transparent text-action hover:underline focus-visible:ring-action px-0 py-0',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm w-auto',
  md: 'px-4 py-2 text-base w-auto',
  lg: 'px-6 py-3 text-lg w-auto',
  full: 'w-full py-2.5 text-base'
};

const iconSize = computed(() => {
  if (size.value === 'sm') return 16;
  if (size.value === 'lg') return 24;
  return 20;
});
</script>
