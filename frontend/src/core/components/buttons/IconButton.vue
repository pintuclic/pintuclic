<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import Icon from '../data-display/Icon.vue';

withDefaults(defineProps<{
  icon: string;
  label: string;
  to?: RouteLocationRaw;
  tone?: 'action' | 'neutral' | 'success';
  hasPopup?: 'dialog';
}>(), { tone: 'action' });

defineEmits<{ click: [] }>();

const baseClass = 'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action';
const toneClasses = {
  action: 'text-action hover:bg-subaction/40',
  neutral: 'text-neutral-dark hover:bg-neutral-lightest',
  success: 'text-conversion-hover hover:bg-conversion/10',
};
</script>

<template>
  <RouterLink v-if="to" :to="to" :aria-label="label" :class="[baseClass, toneClasses[tone]]">
    <Icon :name="icon" />
  </RouterLink>
  <button v-else type="button" :aria-label="label" :aria-haspopup="hasPopup" :class="[baseClass, toneClasses[tone]]" @click="$emit('click')">
    <Icon :name="icon" />
  </button>
</template>
