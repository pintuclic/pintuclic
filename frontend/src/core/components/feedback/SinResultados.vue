<template>
  <div
    :class="[
      'text-center flex flex-col items-center justify-center',
      bordered ? 'rounded-xl border border-neutral-light bg-neutral-white shadow-xs' : '',
      compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12'
    ]"
    role="status"
  >
    <!-- Icon Slot / Component -->
    <div
      :class="[
        'mb-4 flex items-center justify-center',
        compact ? 'h-10 w-10 text-neutral-medium' : 'h-14 w-14 text-action'
      ]"
    >
      <slot name="icon">
        <component
          :is="resolvedIcon"
          v-if="isComponentIcon"
          :class="compact ? 'w-10 h-10' : 'w-12 h-12'"
          aria-hidden="true"
        />
        <Icon
          v-else-if="typeof icon === 'string'"
          :name="icon"
          :class="compact ? 'h-10 w-10' : 'h-12 w-12'"
        />
      </slot>
    </div>

    <!-- Title -->
    <h3
      v-if="title || $slots.title"
      :class="[
        'font-title font-bold text-corporate',
        compact ? 'text-base sm:text-lg' : 'text-xl sm:text-2xl'
      ]"
    >
      <slot name="title">{{ title }}</slot>
    </h3>

    <!-- Description -->
    <p
      v-if="description || $slots.description"
      :class="[
        'text-neutral-medium max-w-md mx-auto leading-relaxed',
        compact ? 'mt-1.5 text-xs sm:text-sm' : 'mt-3 text-sm sm:text-base'
      ]"
    >
      <slot name="description">{{ description }}</slot>
    </p>

    <!-- Default Slot for extra content -->
    <slot />

    <!-- Action Button / Slot -->
    <div v-if="actionText || $slots.actions" class="mt-6">
      <slot name="actions">
        <Button
          v-if="actionText"
          :to="actionTo"
          :variant="actionVariant"
          :icon="actionIcon"
          @click="emit('action')"
        >
          {{ actionText }}
        </Button>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';
import { Search as SearchIcon } from 'lucide-vue-next';
import Button from '../buttons/Button.vue';
import Icon from '../data-display/Icon.vue';

interface Props {
  icon?: Component | string;
  title?: string;
  description?: string;
  actionText?: string;
  actionTo?: string | object;
  actionIcon?: Component | string;
  actionVariant?: 'corporate' | 'action' | 'subaction' | 'conversion' | 'outline' | 'text' | 'danger' | 'danger-outline' | 'neutral';
  compact?: boolean;
  bordered?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  icon: 'search',
  title: '',
  description: '',
  actionText: '',
  actionTo: undefined,
  actionIcon: undefined,
  actionVariant: 'action',
  compact: false,
  bordered: true,
});

const emit = defineEmits<{
  (e: 'action'): void;
}>();

const isComponentIcon = computed(() => typeof props.icon === 'object' || typeof props.icon === 'function');
const resolvedIcon = computed(() => (isComponentIcon.value ? (props.icon as Component) : SearchIcon));
</script>
