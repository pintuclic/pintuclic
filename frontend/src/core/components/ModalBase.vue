<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-neutral-black/50 backdrop-blur-sm" @click="close"></div>
      
      <!-- Modal Content -->
      <div 
        class="relative bg-white rounded-modal shadow-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        :class="maxWidthClass"
      >
        <!--
          Franja decorativa de marca (Guía UI 4.2): degradado arcoíris tomado
          literal del logotipo. Es una excepción intencional a la regla de
          "solo tokens de la paleta" — el logo en sí usa estos mismos tonos
          fuera de la paleta funcional, así que esta franja los reproduce
          tal cual, no los reinterpreta con colores nuevos.
        -->
        <div
          v-if="accent"
          class="h-2 w-full shrink-0"
          style="background: linear-gradient(90deg, #2E7D32 0%, #8BC34A 20%, #FFC107 40%, #E63946 60%, #7B2FF7 80%, #0877E8 100%);"
        />

        <!-- Close Button -->
        <button 
          @click="close"
          class="absolute top-4 right-4 p-1 rounded-full text-neutral-medium hover:bg-neutral-lightest hover:text-neutral-dark transition-colors z-10 cursor-pointer"
        >
          <XIcon class="w-5 h-5" />
        </button>
        
        <div class="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
          <slot></slot>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue';
import { X as XIcon } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  maxWidth: {
    type: String,
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg', 'xl', '2xl'].includes(v)
  },
  accent: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const maxWidthClass = computed(() => {
  const map: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md', // ~448px, perfect for login
    lg: 'max-w-lg', // ~512px
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl' // good for register if needed
  };
  return map[props.maxWidth];
});

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    close();
  }
};

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => document.addEventListener('keydown', handleKeydown));
onUnmounted(() => document.removeEventListener('keydown', handleKeydown));
</script>

<style>
/* Custom Scrollbar para el modal */
.custom-scrollbar::-webkit-scrollbar {
  width: 12px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  margin-top: 10px;
  margin-bottom: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-subaction);
  border-radius: 10px;
  border: 4px solid transparent;
  background-clip: padding-box;
}
</style>
