<template>
  <!-- Modo Vertical (Menú lateral de perfil / panel / navegación) -->
  <nav
    v-if="orientation === 'vertical'"
    class="flex flex-col gap-1 w-full"
    :aria-label="ariaLabel || 'Pestañas de navegación'"
  >
    <component
      :is="item.to ? 'router-link' : 'button'"
      v-for="item in items"
      :key="item.id"
      :to="item.to"
      :type="item.to ? undefined : 'button'"
      @click="!item.to && selectTab(item.id)"
      :class="[
        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 text-left w-full cursor-pointer',
        modelValue === item.id || (item.to && isRouteActive(item.to))
          ? 'bg-subaction text-action font-semibold'
          : 'text-neutral-medium hover:bg-neutral-lightest hover:text-corporate font-medium'
      ]"
    >
      <Icon v-if="item.icon" :name="item.icon" class="w-5 h-5 shrink-0" />
      <span class="flex-1">{{ item.label }}</span>
      <Badge v-if="item.badge" tone="info">{{ item.badge }}</Badge>
    </component>
  </nav>

  <!-- Modo Horizontal (Pestañas clásicas de contenido superior) -->
  <div
    v-else
    class="border-b border-neutral-light flex gap-2 sm:gap-6 overflow-x-auto"
    :aria-label="ariaLabel || 'Pestañas de navegación'"
  >
    <component
      :is="item.to ? 'router-link' : 'button'"
      v-for="item in items"
      :key="item.id"
      :to="item.to"
      :type="item.to ? undefined : 'button'"
      @click="!item.to && selectTab(item.id)"
      :class="[
        'flex items-center gap-2 py-3 px-2 border-b-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer',
        modelValue === item.id || (item.to && isRouteActive(item.to))
          ? 'border-action text-action font-semibold'
          : 'border-transparent text-neutral-medium hover:text-corporate hover:border-neutral-light'
      ]"
    >
      <Icon v-if="item.icon" :name="item.icon" class="w-4 h-4 shrink-0" />
      <span>{{ item.label }}</span>
      <Badge v-if="item.badge" tone="info">{{ item.badge }}</Badge>
    </component>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import Icon from '../data-display/Icon.vue';
import Badge from '../data-display/Badge.vue';

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  to?: string;
  badge?: string | number;
}

withDefaults(
  defineProps<{
    items: TabItem[];
    modelValue?: string;
    orientation?: 'horizontal' | 'vertical';
    ariaLabel?: string;
  }>(),
  {
    modelValue: '',
    orientation: 'horizontal',
    ariaLabel: ''
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void;
  (e: 'change', id: string): void;
}>();

const route = useRoute();

function isRouteActive(to: string): boolean {
  if (!route) return false;
  return route.path === to || route.path.startsWith(to + '/');
}

function selectTab(id: string) {
  emit('update:modelValue', id);
  emit('change', id);
}
</script>
