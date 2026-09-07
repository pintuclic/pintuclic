<template>
  <button
    :class="[
      'inline-flex items-center justify-center font-heading font-medium rounded-button transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer',
      variantClasses[variant],
      sizeClasses[size],
      { '!bg-neutral-light !text-neutral-medium !border-neutral-light cursor-not-allowed shadow-none': disabled },
      customClass
    ]"
    :disabled="disabled"
    :type="type"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value: string) => ['primary', 'secondary', 'outline', 'text', 'google'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg', 'full'].includes(value),
  },
  type: {
    type: String as () => 'button' | 'submit' | 'reset',
    default: 'button'
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: '',
  }
});

defineEmits(['click']);

const variantClasses: Record<string, string> = {
  primary: 'bg-corporate hover:bg-corporate/90 text-white focus:ring-corporate',
  secondary: 'bg-subaction hover:bg-subaction/80 text-corporate focus:ring-corporate',
  outline: 'border border-neutral-light bg-transparent hover:bg-neutral-lightest text-corporate focus:ring-corporate',
  text: 'bg-transparent text-action hover:underline focus:ring-action',
  google: 'bg-white border border-neutral-light text-neutral-dark hover:bg-neutral-lightest focus:ring-neutral-light font-medium flex items-center justify-center gap-2 shadow-sm'
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm w-auto',
  md: 'px-4 py-2 text-base w-auto',
  lg: 'px-6 py-3 text-lg w-auto',
  full: 'w-full py-2.5 text-base'
};
</script>
