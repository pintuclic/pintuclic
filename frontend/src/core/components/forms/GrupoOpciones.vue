<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <button
      v-for="option in options"
      :key="String(option.value)"
      type="button"
      :class="[
        'relative flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-200 text-center w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-action',
        modelValue === option.value
          ? 'border-action bg-subaction text-corporate'
          : 'border-transparent bg-neutral-lightest text-corporate hover:border-neutral-light'
      ]"
      @click="$emit('update:modelValue', option.value)"
    >
<<<<<<< HEAD
      <div 
=======
      <div
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
        v-if="modelValue === option.value"
        class="absolute top-3 right-3 bg-action text-white rounded-full p-1"
      >
        <Check :size="16" :stroke-width="3" />
      </div>

<<<<<<< HEAD
      <component 
        :is="option.icon" 
        v-if="option.icon" 
        :size="48" 
        class="mb-4 text-action" 
        :stroke-width="1.5"
      />
      
=======
      <component
        :is="option.icon"
        v-if="option.icon"
        :size="48"
        class="mb-4 text-action"
        :stroke-width="1.5"
      />

>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
      <span class="font-title font-semibold text-lg">{{ option.label }}</span>
      <span v-if="option.description" class="mt-2 text-sm text-neutral-medium font-sans">
        {{ option.description }}
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
import { Check } from 'lucide-vue-next';

defineProps<{
  modelValue: string | number | null;
  options: {
    value: string | number;
    label: string;
    description?: string;
    icon?: Component;
  }[];
}>();

defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();
</script>
