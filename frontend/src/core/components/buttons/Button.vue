<template>
  <component
    :is="tag"
    v-bind="routeProps"
    :class="[
<<<<<<< HEAD
      'inline-flex items-center justify-center font-title font-medium rounded-lg transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      variantClasses[variant],
=======
      'inline-flex items-center justify-center font-title font-medium rounded-lg cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      resolvedVariantClass,
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
      sizeClasses[size],
      { 'opacity-50 cursor-not-allowed pointer-events-none': disabled },
      customClass
    ]"
    :disabled="disabled && tag === 'button'"
    @click="$emit('click', $event)"
  >
<<<<<<< HEAD
    <component
      :is="icon"
      v-if="icon"
      :size="iconSize"
      class="mr-2 -ml-1"
=======
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
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
      aria-hidden="true"
    />
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue';
<<<<<<< HEAD
import type { Component } from 'vue';

const props = defineProps<{
  variant?: 'corporate' | 'primary' | 'action' | 'subaction' | 'secondary' | 'conversion' | 'green' | 'danger' | 'google' | 'outline' | 'text' | 'ghost';
=======
import { RouterLink } from 'vue-router';
import type { Component } from 'vue';
import Icon from '../data-display/Icon.vue';

const props = defineProps<{
  variant?: 'corporate' | 'action' | 'subaction' | 'conversion' | 'outline' | 'text' | 'danger' | 'danger-outline' | 'neutral' | 'cancel' | 'google' | 'primary' | 'secondary' | 'green' | 'ghost';
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  size?: 'sm' | 'md' | 'lg' | 'full';
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  customClass?: string;
<<<<<<< HEAD
  icon?: Component;
=======
  icon?: Component | string;
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  to?: string | object;
  href?: string;
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
  return { type: props.type || 'button' };
});

<<<<<<< HEAD
const variant = computed(() => props.variant || 'corporate');
=======
const variant = computed(() => {
  const v = props.variant || 'corporate';
  if (v === 'primary') return 'corporate';
  if (v === 'secondary') return 'subaction';
  if (v === 'green') return 'conversion';
  if (v === 'ghost') return 'text';
  if (v === 'cancel') return 'neutral';
  return v;
});

>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
const size = computed(() => props.size || 'md');

const variantClasses: Record<string, string> = {
  corporate: 'bg-corporate hover:bg-corporate/90 text-white focus-visible:ring-corporate',
<<<<<<< HEAD
  primary: 'bg-corporate hover:bg-corporate/90 text-white focus-visible:ring-corporate',
  action: 'bg-action hover:bg-action/90 text-white focus-visible:ring-action',
  subaction: 'bg-subaction hover:bg-subaction/80 text-action focus-visible:ring-action',
  secondary: 'bg-subaction hover:bg-subaction/80 text-action focus-visible:ring-action',
  conversion: 'bg-conversion hover:bg-conversion-hover text-white focus-visible:ring-conversion',
  green: 'bg-conversion hover:bg-conversion-hover text-white focus-visible:ring-conversion',
  danger: 'bg-[#E63946] hover:bg-[#D62839] text-white focus-visible:ring-[#E63946]',
  google: 'bg-white border border-neutral-light text-neutral-dark hover:bg-neutral-lightest focus-visible:ring-neutral-light',
  outline: 'border border-neutral-light bg-transparent hover:bg-neutral-lightest text-corporate focus-visible:ring-corporate',
  text: 'bg-transparent text-action hover:underline focus-visible:ring-action px-0 py-0',
  ghost: 'bg-transparent text-action hover:underline focus-visible:ring-action px-0 py-0',
};

=======
  action: 'bg-action hover:bg-action/90 text-white focus-visible:ring-action',
  subaction: 'bg-subaction hover:bg-subaction/80 text-action focus-visible:ring-action',
  conversion: 'bg-conversion hover:bg-conversion-hover text-white focus-visible:ring-conversion',
  outline: 'border border-action bg-white hover:bg-action hover:text-white text-action focus-visible:ring-action',
  neutral: 'border border-neutral-light bg-white hover:bg-neutral-lightest text-neutral-dark hover:text-neutral-black focus-visible:ring-neutral-medium shadow-xs',
  text: 'bg-transparent text-action hover:underline focus-visible:ring-action px-0 py-0',
  danger: 'bg-danger hover:bg-danger-hover text-white focus-visible:ring-danger shadow-sm',
  'danger-outline': 'border border-danger/40 bg-danger-subtle/50 text-danger hover:bg-danger hover:text-white hover:border-danger focus-visible:ring-danger shadow-xs transition-colors',
  google: 'bg-white border border-neutral-light text-neutral-dark shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-neutral-lightest focus-visible:ring-neutral-light transition-all duration-200 flex items-center justify-center gap-2 font-medium',
};

const resolvedVariantClass = computed(() => variantClasses[variant.value] || variantClasses.corporate);

>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
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
