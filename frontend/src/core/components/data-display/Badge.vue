<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'success' | 'warning' | 'info' | 'neutral'; dot?: boolean }>(), { tone: 'neutral', dot: false });
const tones = {
  success: 'bg-conversion/12 text-conversion-hover',
  warning: 'bg-highlight/20 text-neutral-dark',
  info: 'bg-subaction text-action',
  neutral: 'bg-neutral-lightest text-neutral-dark',
};
</script>
<template>
  <span class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold" :class="tones[tone]">
    <span v-if="dot" class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span><slot />
  </span>
</template>
