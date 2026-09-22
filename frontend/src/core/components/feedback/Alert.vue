<template>
  <div
    v-if="visible"
    role="alert"
    :class="[
      'rounded-xl border p-4 text-sm flex items-start gap-3 transition-colors',
      variantClasses[variant] || variantClasses.info
    ]"
  >
    <!-- Icon -->
    <div class="shrink-0 mt-0.5">
      <slot name="icon">
        <component
          :is="resolvedIcon"
          class="w-5 h-5"
          aria-hidden="true"
        />
      </slot>
    </div>

    <!-- Content Area -->
    <div class="flex-1 min-w-0">
      <h4 v-if="title || $slots.title" class="font-bold mb-1 leading-snug">
        <slot name="title">{{ title }}</slot>
      </h4>
      <div v-if="message || $slots.default" class="leading-relaxed">
        <slot>{{ message }}</slot>
      </div>
    </div>

    <!-- Close Button (Dismissible) -->
    <button
      v-if="dismissible"
      type="button"
      aria-label="Cerrar aviso"
      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-70 hover:opacity-100 hover:bg-black/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action transition-all cursor-pointer -mr-1 -mt-1"
      @click="dismiss"
    >
      <XIcon class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Component } from 'vue';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info as InfoIcon,
  X as XIcon
} from 'lucide-vue-next';

interface Props {
  variant?: 'warning' | 'danger' | 'success' | 'info';
  title?: string;
  message?: string;
  dismissible?: boolean;
  icon?: Component;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  title: '',
  message: '',
  dismissible: false,
  icon: undefined,
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const visible = ref(true);

function dismiss() {
  visible.value = false;
  emit('close');
}

const variantClasses: Record<string, string> = {
  warning: 'bg-highlight/10 border-highlight/30 text-neutral-dark',
  danger: 'bg-danger-subtle border-danger/20 text-danger-hover',
  success: 'bg-conversion/10 border-conversion/30 text-conversion-hover',
  info: 'bg-subaction/60 border-action/20 text-corporate'
};

const defaultIcons: Record<string, Component> = {
  warning: AlertTriangle,
  danger: AlertCircle,
  success: CheckCircle2,
  info: InfoIcon
};

const resolvedIcon = computed(() => props.icon || defaultIcons[props.variant] || InfoIcon);
</script>
