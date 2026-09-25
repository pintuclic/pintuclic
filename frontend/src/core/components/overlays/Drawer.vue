<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity ease-linear duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-40 bg-neutral-dark/50 backdrop-blur-sm" @click="close"></div>
    </Transition>

    <Transition
      enter-active-class="transform transition ease-in-out duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-300"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="modelValue"
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-light bg-neutral-lightest/30">
          <h2 class="text-lg font-semibold font-title text-corporate">{{ title }}</h2>
          <IconButton 
            :icon="X" 
            label="Cerrar panel" 
            tone="neutral" 
            @click="close" 
          />
        </div>
        
        <div class="relative flex-1 overflow-y-auto p-6">
          <slot />
        </div>

        <div v-if="$slots.footer" class="border-t border-neutral-light p-4 bg-neutral-lightest/50">
          <slot name="footer" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { X } from 'lucide-vue-next';
import IconButton from '../buttons/IconButton.vue';

const props = defineProps<{
  modelValue: boolean;
  title: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}>();

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>
