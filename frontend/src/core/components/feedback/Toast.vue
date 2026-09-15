<script setup lang="ts">
import Icon from '../data-display/Icon.vue';
defineProps<{ message: string }>();
const emit = defineEmits<{ close: [] }>();
</script>
<template>
  <div v-if="message" role="status" class="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-conversion/30 bg-neutral-white p-5 text-sm shadow-lg">
    <Icon name="check" class="text-conversion" />{{ message }}
    <button type="button" aria-label="Cerrar mensaje" @click="emit('close')"><Icon name="close" class="h-4 w-4" /></button>
  </div>
</template>
