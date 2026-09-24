<template>
  <div class="bg-white rounded-xl border border-neutral-light shadow-sm overflow-hidden flex flex-col">
    <div v-if="$slots.header || title" class="px-6 py-4 border-b border-neutral-light bg-neutral-lightest/30 flex items-center justify-between">
      <slot name="header">
        <h3 class="font-title font-semibold text-lg text-corporate">{{ title }}</h3>
        <p v-if="subtitle" class="text-sm text-neutral-medium mt-1 font-sans">{{ subtitle }}</p>
      </slot>
    </div>
    <div :class="['flex-1', noPadding ? '' : 'p-6']">
      <slot />
    </div>

    <div v-if="$slots.footer" class="px-6 py-4 border-t border-neutral-light bg-neutral-lightest/50">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  subtitle?: string;
  noPadding?: boolean;
}>();
</script>
