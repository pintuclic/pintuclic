<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, useId } from "vue";
import Icon from "../data-display/Icon.vue";
defineProps<{ title: string }>();
const emit = defineEmits<{ close: [] }>();
const titleId = useId();
const dialog = ref<HTMLDialogElement>();
const entered = ref(false);
const closing = ref(false);
let previous: HTMLElement | null = null;
let previousOverflow = "";
let enterFrame = 0;
let settleFrame = 0;
let closeTimer = 0;

function finishClose() {
  if (!closing.value) return;
  window.clearTimeout(closeTimer);
  emit("close");
}

function requestClose() {
  if (closing.value) return;
  closing.value = true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    finishClose();
    return;
  }
  entered.value = false;
  closeTimer = window.setTimeout(finishClose, 360);
}

onMounted(() => {
  previous = document.activeElement as HTMLElement;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  dialog.value?.showModal();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    entered.value = true;
    return;
  }
  enterFrame = window.requestAnimationFrame(() => {
    settleFrame = window.requestAnimationFrame(() => {
      if (!closing.value) entered.value = true;
    });
  });
});
onBeforeUnmount(() => {
  window.cancelAnimationFrame(enterFrame);
  window.cancelAnimationFrame(settleFrame);
  window.clearTimeout(closeTimer);
  dialog.value?.close();
  document.body.style.overflow = previousOverflow;
  previous?.focus();
});
</script>
<template>
  <dialog
    ref="dialog"
    :aria-labelledby="titleId"
    class="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-2xl overflow-y-auto border-0 border-l border-neutral-light bg-neutral-lightest p-0 text-neutral-dark shadow-xl transition-transform duration-300 ease-out motion-reduce:transition-none backdrop:bg-corporate/35 backdrop:transition-opacity backdrop:duration-300"
    :class="entered ? 'translate-x-0 backdrop:opacity-100' : 'translate-x-full backdrop:opacity-0'"
    @cancel.prevent="requestClose"
    @click="($event.target === $event.currentTarget) && requestClose()"
    @transitionend.self="finishClose"
  >
    <header class="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-light bg-neutral-white px-6 py-5">
      <h2 :id="titleId" class="text-xl font-bold text-corporate">{{ title }}</h2>
      <button type="button" aria-label="Cerrar panel" class="rounded-lg p-2 text-action hover:bg-subaction/50" @click="requestClose">
        <Icon name="close" />
      </button>
    </header>
    <div class="p-5 sm:p-6"><slot /></div>
  </dialog>
</template>
