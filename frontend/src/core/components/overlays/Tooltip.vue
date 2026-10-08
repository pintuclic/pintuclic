<template>
  <div class="relative inline-flex items-center group">
    <slot />
    <span
      v-if="content || $slots.content"
      role="tooltip"
      :class="[
        'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-corporate px-2.5 py-1 text-xs font-medium text-neutral-white shadow-md transition-all duration-150',
        'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 group-focus-within:opacity-100 group-focus-within:scale-100',
        positionClasses[position] || positionClasses.top
      ]"
    >
      {{ content }}
      <slot name="content" />
    </span>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    content?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }>(),
  {
    content: '',
    position: 'top',
  }
);

const positionClasses: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};
</script>
