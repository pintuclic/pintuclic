<script setup lang="ts">
import { computed, useAttrs, useId, nextTick } from 'vue';
defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{ modelValue?: boolean; label?: string; id?: string; disabled?: boolean }>(), { modelValue: false, label: '', disabled: false });
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();
const generatedId = useId();
const controlId = computed(() => props.id || generatedId);
const attrs = useAttrs();
const controlAttrs = computed(() => { const forwarded = { ...attrs }; delete forwarded.class; return forwarded; });
async function change(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  emit('update:modelValue', input.checked);
  await nextTick();
  // The parent can defer an update while requesting confirmation.
  input.checked = props.modelValue;
}
</script>
<template>
  <label :for="controlId" class="flex min-w-0 items-start gap-3 font-sans" :class="$attrs.class">
    <input v-bind="controlAttrs" :id="controlId" type="checkbox" :disabled="disabled" :checked="modelValue" @change="change"
      class="mt-1 h-4 w-4 shrink-0 accent-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed" />
    <span class="min-w-0 [overflow-wrap:anywhere]"><slot>{{ label }}</slot></span>
  </label>
</template>
