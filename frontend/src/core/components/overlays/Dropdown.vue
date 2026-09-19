<template>
  <div ref="dropdownRef" class="relative inline-block text-left" @keydown.esc="close">
    <!-- Trigger Slot -->
    <div @click="toggle">
      <slot name="trigger" :isOpen="isOpen" :toggle="toggle" :open="open" :close="close">
        <button
          type="button"
          :disabled="disabled"
          class="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-corporate bg-white border border-neutral-light rounded-button hover:bg-neutral-lightest focus:outline-none focus:ring-2 focus:ring-action/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          aria-haspopup="true"
          :aria-expanded="isOpen"
        >
          <span>Opciones</span>
          <ChevronDownIcon class="w-4 h-4 text-neutral-medium transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
        </button>
      </slot>
    </div>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        role="menu"
        :aria-orientation="'vertical'"
        tabindex="-1"
        :class="[
          'absolute mt-2 bg-white rounded-xl shadow-lg border border-neutral-light z-50 overflow-hidden py-1',
          align === 'left' ? 'left-0' : 'right-0',
          width,
          contentClass
        ]"
        @click="handleContentClick"
      >
        <slot :close="close" :isOpen="isOpen" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ChevronDown as ChevronDownIcon } from 'lucide-vue-next';

interface Props {
  align?: 'left' | 'right';
  width?: string;
  closeOnClick?: boolean;
  contentClass?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  align: 'right',
  width: 'w-56',
  closeOnClick: true,
  contentClass: '',
  disabled: false
});

const emit = defineEmits<{
  (e: 'open'): void;
  (e: 'close'): void;
}>();

const isOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

function open() {
  if (props.disabled) return;
  isOpen.value = true;
  emit('open');
}

function close() {
  if (!isOpen.value) return;
  isOpen.value = false;
  emit('close');
}

function toggle() {
  if (props.disabled) return;
  if (isOpen.value) {
    close();
  } else {
    open();
  }
}

function handleContentClick(event: Event) {
  if (!props.closeOnClick) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('[data-keep-open="true"]')) {
    return;
  }
  close();
}

function handleClickOutside(event: Event) {
  if (!isOpen.value || !dropdownRef.value) return;
  const target = event.target as HTMLElement | null;
  if (target && !dropdownRef.value.contains(target)) {
    close();
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});

defineExpose({
  isOpen,
  open,
  close,
  toggle
});
</script>
