<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ modelValue?: string | number; label?: string; name?: string; id?: string; disabled?: boolean; error?: string }>(), { modelValue: '', label: '', disabled: false, error: '' });
const emit = defineEmits<{ 'update:modelValue': [value: string | number]; change: [event: Event] }>();
const generatedId = useId();
const controlId = computed(() => props.id || generatedId);
const attrs = useAttrs();
const controlAttrs = computed(() => { const forwarded = { ...attrs }; delete forwarded.class; return forwarded; });
const value = computed({ get: () => props.modelValue, set: (next: string | number) => emit('update:modelValue', next) });
</script>
<template>
  <div class="min-w-0 w-full flex flex-col gap-1.5 font-sans" :class="$attrs.class">
    <label v-if="label" :for="controlId" class="text-sm font-medium text-neutral-dark">{{ label }}</label>
    <select v-bind="controlAttrs" :id="controlId" :name="name" :disabled="disabled" v-model="value" @change="emit('change', $event)"
      :aria-invalid="error ? true : undefined" :aria-describedby="error ? `${controlId}-error` : String(controlAttrs['aria-describedby'] || '') || undefined"
      class="w-full min-w-0 rounded-lg border bg-neutral-white px-4 py-3 text-base sm:text-sm text-neutral-dark outline-none transition-colors focus:border-action focus-visible:ring-2 focus-visible:ring-action/20 disabled:bg-neutral-lightest disabled:opacity-60 disabled:cursor-not-allowed"
      :class="error ? 'border-danger' : 'border-neutral-light'"><slot /></select>
    <span v-if="error" :id="`${controlId}-error`" role="alert" class="text-sm text-danger">{{ error }}</span>
  </div>
</template>
