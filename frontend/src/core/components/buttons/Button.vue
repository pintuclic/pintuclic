<template>
  <component
    :is="tag"
    v-bind="routeProps"
    :class="[
      'inline-flex items-center justify-center font-sans font-medium rounded-lg cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      resolvedVariantClass,
      sizeClasses[size],
      { 'opacity-50 cursor-not-allowed pointer-events-none': disabled },
      customClass
    ]"
    :disabled="disabled && tag === 'button'"
    @click="$emit('click', $event)"
  >
    <!-- Si icon es un string (nombre del icono) -->
    <Icon
      v-if="typeof icon === 'string' && icon"
      :name="icon"
      class="mr-2 -ml-1 shrink-0"
    />
    <!-- Si icon es un componente Vue (Lucide component) -->
    <component
      :is="icon"
      v-else-if="icon"
      :size="iconSize"
      class="mr-2 -ml-1 shrink-0"
      aria-hidden="true"
    />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { Component } from 'vue';
import Icon from '../data-display/Icon.vue';

const props = defineProps<{
  variant?: 'corporate' | 'action' | 'subaction' | 'conversion' | 'outline' | 'text' | 'danger' | 'google' | 'primary' | 'secondary' | 'green' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'full';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  customClass?: string;
  icon?: Component | string;
  to?: string | object;
  href?: string;
}>();

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
  return { type: props.type || 'button' };
});

const variant = computed(() => {
  const v = props.variant || 'corporate';
  if (v === 'primary') return 'corporate';
  if (v === 'secondary') return 'subaction';
  if (v === 'green') return 'conversion';
  if (v === 'ghost') return 'text';
  return v;
});

const size = computed(() => props.size || 'md');

const variantClasses: Record<string, string> = {
  corporate: 'bg-corporate hover:bg-corporate/90 text-white focus-visible:ring-corporate',
  action: 'bg-action hover:bg-action/90 text-white focus-visible:ring-action',
  subaction: 'bg-subaction hover:bg-subaction/80 text-action focus-visible:ring-action',
  conversion: 'bg-conversion hover:bg-conversion-hover text-white focus-visible:ring-conversion',
  outline: 'border border-action bg-white hover:bg-action hover:text-white text-action focus-visible:ring-action',
  text: 'bg-transparent text-action hover:underline focus-visible:ring-action px-0 py-0',
  danger: 'bg-danger hover:bg-danger-hover text-white focus-visible:ring-danger shadow-sm',
  google: 'bg-white border border-neutral-light text-neutral-dark shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-neutral-lightest focus-visible:ring-neutral-light transition-all duration-200 flex items-center justify-center gap-2 font-medium',
};

const resolvedVariantClass = computed(() => variantClasses[variant.value] || variantClasses.corporate);

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
