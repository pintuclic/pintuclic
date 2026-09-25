<template>
  <Teleport to="body">
    <Transition
<<<<<<< HEAD
      enter-active-class="transition-opacity ease-linear duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-300"
=======
      enter-active-class="transition-opacity ease-linear duration-300 motion-reduce:transition-none"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-300 motion-reduce:transition-none"
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="modelValue" class="fixed inset-0 z-40 bg-neutral-dark/50 backdrop-blur-sm" @click="close"></div>
    </Transition>

    <Transition
<<<<<<< HEAD
      enter-active-class="transform transition ease-in-out duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-300"
=======
      enter-active-class="transform transition ease-in-out duration-300 motion-reduce:transition-none"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-300 motion-reduce:transition-none"
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="modelValue"
<<<<<<< HEAD
=======
        ref="panel"
        tabindex="-1"
        :aria-labelledby="titleId"
        @keydown.esc.stop="close"
        @keydown.tab="trapFocus"
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-light bg-neutral-lightest/30">
<<<<<<< HEAD
          <h2 class="text-lg font-semibold font-title text-corporate">{{ title }}</h2>
          <IconButton 
            :icon="X" 
            label="Cerrar panel" 
            tone="neutral" 
            @click="close" 
          />
        </div>
        
=======
          <h2 :id="titleId" class="text-lg font-semibold font-title text-corporate">{{ title }}</h2>
          <button
            type="button"
            aria-label="Cerrar panel"
            @click="close"
            class="flex h-8 w-8 items-center justify-center rounded-full text-neutral-medium hover:bg-neutral-light hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action transition-all cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
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
<<<<<<< HEAD
import { watch } from 'vue';
import { X } from 'lucide-vue-next';
import IconButton from '../buttons/IconButton.vue';
=======
import { watch, ref, useId, nextTick, onBeforeUnmount } from 'vue';
import { X } from 'lucide-vue-next';
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55

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

<<<<<<< HEAD
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
=======
const panel = ref<HTMLElement>();
const titleId = useId();
let previousFocus: HTMLElement | null = null;
let previousOverflow = '';
let locked = false;
let disposed = false;

function restore() {
  if (!locked) return;
  document.body.style.overflow = previousOverflow;
  previousFocus?.focus();
  locked = false;
}

function trapFocus(event: KeyboardEvent) {
  const elements = Array.from(panel.value?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]') ?? [])
    .filter(element => element.getClientRects().length > 0);
  const first = elements[0];
  const last = elements.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
}

watch(() => props.modelValue, async (isOpen) => {
  await nextTick();
  if (disposed || props.modelValue !== isOpen) return;
  if (isOpen) {
    if (!locked) {
      previousFocus = document.activeElement as HTMLElement;
      previousOverflow = document.body.style.overflow;
      locked = true;
    }
    document.body.style.overflow = 'hidden';
    panel.value?.querySelector<HTMLElement>('button')?.focus();
  } else {
    restore();
  }
}, { immediate: true, flush: 'post' });

onBeforeUnmount(() => {
  disposed = true;
  restore();
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
});
</script>
