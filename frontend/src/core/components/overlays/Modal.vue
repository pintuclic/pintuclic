<template>
  <Teleport to="body">
<<<<<<< HEAD
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Overlay -->
      <div class="absolute inset-0 bg-neutral-black/50 backdrop-blur-sm" @click="close"></div>
      
      <div 
        class="relative bg-white rounded-xl shadow-xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        :class="maxWidthClass"
=======
    <dialog
      ref="dialog"
      :aria-labelledby="title ? titleId : undefined"
      class="fixed inset-0 m-auto max-h-none border-0 bg-transparent p-0 md:p-4 backdrop:bg-neutral-black/50 backdrop:backdrop-blur-sm max-md:top-auto max-md:bottom-0 max-md:inset-x-0"
      :class="[maxWidthClass, modelValue ? 'w-full' : 'hidden']"
      @cancel.prevent="close"
      @click="$event.target === $event.currentTarget && close()"
    >
      <!-- Modal Content / Mobile Bottom Sheet -->
      <div
        v-if="modelValue"
        class="relative bg-white shadow-xl w-full flex flex-col overflow-hidden max-md:rounded-t-[28px] max-md:rounded-b-none max-md:max-h-[92dvh] md:rounded-modal md:max-h-[calc(100dvh-2rem)] transition-transform duration-200"
        :style="sheetTransformStyle"
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
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
<<<<<<< HEAD
          style="background: linear-gradient(90deg, #FF4D4D 0%, #FFB703 20%, #4CAF50 40%, #00B4D8 65%, #0877E8 80%, #7B2FF7 100%);"
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
=======
          style="background: linear-gradient(90deg, #2E7D32 0%, #8BC34A 20%, #FFC107 40%, #E63946 60%, #7B2FF7 80%, #0877E8 100%);"
        />

        <!-- Mobile Drag Handle Bar (Arrastre hacia abajo para cerrar en celular) -->
        <div
          class="md:hidden flex justify-center items-center py-2.5 cursor-grab active:cursor-grabbing touch-none select-none"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        >
          <div class="w-12 h-1.5 bg-neutral-medium/30 rounded-full hover:bg-neutral-medium/50 transition-colors" />
        </div>

        <!-- Close Button -->
        <button
          type="button"
          aria-label="Cerrar ventana"
          @click="close"
          class="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-medium hover:bg-neutral-light hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action transition-all z-10 cursor-pointer"
          :class="accent ? 'top-5 md:top-5 max-md:top-7' : 'top-4 md:top-4 max-md:top-6'"
        >
          <XIcon class="w-4 h-4" />
        </button>

        <div
          class="p-4 sm:p-6 md:p-8 min-h-0 flex-1 overflow-y-auto custom-scrollbar"
        >
          <!-- Encabezado de marca institucional (opcional vía prop :brand-header="true") -->
          <div v-if="brandHeader" class="flex items-center gap-3 mb-6">
            <img :src="logoSrc" alt="PintuClic" class="w-9 h-9 rounded-lg object-contain" />
            <span class="text-lg font-heading font-bold text-corporate">PintuClic</span>
          </div>
          <h2 v-if="title" :id="titleId" class="mb-5 pr-8 font-title text-xl font-bold text-corporate">{{ title }}</h2>
          <slot></slot>
        </div>
      </div>
    </dialog>
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  </Teleport>
</template>

<script setup lang="ts">
<<<<<<< HEAD
import { computed, watch, onMounted, onUnmounted } from 'vue';
import { X as XIcon } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
=======
import { computed, watch, onBeforeUnmount, nextTick, ref, useId } from 'vue';
import { X as XIcon } from 'lucide-vue-next';
import logoSrc from '@/assets/logo.png';

const titleId = useId();
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: true
  },
  title: {
    type: String,
    default: ''
  },
  wide: {
    type: Boolean,
    default: false
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  },
  maxWidth: {
    type: String,
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg', 'xl', '2xl'].includes(v)
  },
  accent: {
    type: Boolean,
    default: false
<<<<<<< HEAD
=======
  },
  brandHeader: {
    type: Boolean,
    default: false
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const maxWidthClass = computed(() => {
<<<<<<< HEAD
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
=======
  if (props.wide) return 'max-w-3xl';
  const map: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  };
  return map[props.maxWidth] || 'max-w-md';
});

const close = () => {
  dragOffset.value = 0;
  isDragging.value = false;
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
  emit('update:modelValue', false);
  emit('close');
};

<<<<<<< HEAD
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
=======
// --- Manejo de Gesto Táctil (Mobile Bottom Sheet Drag to Dismiss) ---
const touchStartY = ref(0);
const isDragging = ref(false);
const dragOffset = ref(0);

const sheetTransformStyle = computed(() => {
  if (dragOffset.value > 0) {
    return {
      transform: `translateY(${dragOffset.value}px)`,
      transition: isDragging.value ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
    };
  }
  return {};
});

const handleTouchStart = (e: TouchEvent) => {
  touchStartY.value = e.touches[0]?.clientY ?? 0;
  isDragging.value = true;
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return;
  const currentY = e.touches[0]?.clientY ?? 0;
  const delta = currentY - touchStartY.value;
  if (delta > 0) {
    dragOffset.value = delta;
    if (e.cancelable) e.preventDefault();
  } else {
    dragOffset.value = 0;
  }
};

const handleTouchEnd = () => {
  if (!isDragging.value) return;
  isDragging.value = false;
  if (dragOffset.value > 80) {
    dragOffset.value = 500;
    setTimeout(() => {
      close();
      dragOffset.value = 0;
    }, 200);
  } else {
    dragOffset.value = 0;
  }
};

const dialog = ref<HTMLDialogElement>();
let previousOverflow = '';
let locked = false;
let disposed = false;

function unlock() {
  if (locked) document.body.style.overflow = previousOverflow;
  locked = false;
}

watch(() => props.modelValue, async (isOpen) => {
  await nextTick();
  if (disposed || props.modelValue !== isOpen) return;
  if (isOpen) {
    if (!locked) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      locked = true;
    }
    if (!dialog.value?.open) dialog.value?.showModal();
  } else {
    dragOffset.value = 0;
    isDragging.value = false;
    dialog.value?.close();
    unlock();
  }
}, { immediate: true, flush: 'post' });

onBeforeUnmount(() => {
  disposed = true;
  dialog.value?.close();
  unlock();
});
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
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
