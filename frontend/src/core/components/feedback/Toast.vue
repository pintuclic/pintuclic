<<<<<<< HEAD
<template>
  <div>
    <!-- Notificación flotante temporal. -->
  </div>
</template>

<script setup lang="ts">
// TODO: Implementar l�gica de UI y props usando Tailwind CSS
</script>
=======
<script setup lang="ts">
import Icon from '../data-display/Icon.vue';
defineProps<{ message: string }>();
const emit = defineEmits<{ close: [] }>();
</script>
<template>
  <div v-if="message" role="status" class="fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-conversion/30 bg-neutral-white p-5 text-sm shadow-lg">
    <Icon name="check" class="text-conversion shrink-0 mt-0.5" />
    <span class="flex-1 text-corporate">{{ message }}</span>
    <button
      type="button"
      aria-label="Cerrar mensaje"
      @click="emit('close')"
      class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-medium hover:bg-neutral-light hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action transition-all cursor-pointer -mr-1 -mt-1"
    >
      <Icon name="close" class="h-3.5 w-3.5" />
    </button>
  </div>
</template>
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55
