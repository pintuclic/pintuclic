<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      :aria-labelledby="title ? titleId : undefined"
      class="fixed inset-0 m-auto max-h-none border-0 bg-transparent p-4 backdrop:bg-neutral-black/50 backdrop:backdrop-blur-sm"
      :class="[maxWidthClass, modelValue ? 'w-full' : 'hidden']"
      @cancel.prevent="close"
      @click="$event.target === $event.currentTarget && close()"
    >
      <!-- Modal Content -->
      <div
        v-if="modelValue"
        class="relative bg-white rounded-modal shadow-xl w-full max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden"
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
          style="background: linear-gradient(90deg, #FF4D4D 0%, #FFB703 20%, #4CAF50 40%, #00B4D8 65%, #0877E8 80%, #7B2FF7 100%);"
        />

        <!-- Close Button -->
        <button
          type="button"
          aria-label="Cerrar ventana"
          @click="close"
          class="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-medium hover:bg-neutral-light hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action transition-all z-10 cursor-pointer"
          :class="accent ? 'top-5' : 'top-4'"
        >
          <XIcon class="w-4 h-4" />
        </button>

        <div class="p-4 sm:p-6 md:p-8 min-h-0 flex-1 overflow-y-auto custom-scrollbar">
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
  </Teleport>
</template>

<script setup lang="ts">
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
  },
  maxWidth: {
    type: String,
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg', 'xl', '2xl'].includes(v)
  },
  accent: {
    type: Boolean,
    default: false
  },
  brandHeader: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const maxWidthClass = computed(() => {
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
  emit('update:modelValue', false);
  emit('close');
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
    dialog.value?.close();
    unlock();
  }
}, { immediate: true, flush: 'post' });

onBeforeUnmount(() => {
  disposed = true;
  dialog.value?.close();
  unlock();
});
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
