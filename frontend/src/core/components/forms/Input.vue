<script setup lang="ts">
import { computed, ref, useAttrs, useId } from 'vue';
import type { Component } from 'vue';
import { useField } from 'vee-validate';
import { Eye, EyeOff } from 'lucide-vue-next';
import Icon from '../data-display/Icon.vue';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<{
  name?: string; label?: string; type?: string; placeholder?: string;
  id?: string; disabled?: boolean; icon?: Component | string;
  modelValue?: string | number | boolean | null; error?: string;
}>(), { label: '', type: 'text', placeholder: '', disabled: false, error: '', modelValue: undefined });
defineEmits<{ 'update:modelValue': [value: string | number | boolean | null] }>();
const generatedId = useId();
const inputId = computed(() => props.id || generatedId);
const attrs = useAttrs();
const inputAttrs = computed(() => {
  const forwarded = { ...attrs };
  delete forwarded.class;
  return forwarded;
});
const { value, errorMessage, handleBlur } = useField<string | number | boolean | null>(
  () => props.name || inputId.value, undefined,
  { standalone: !props.name, syncVModel: true, initialValue: props.name ? undefined : props.modelValue ?? '' },
);
const message = computed(() => props.error || errorMessage.value);
const showPassword = ref(false);
const inputType = computed(() => props.type === 'password' && showPassword.value ? 'text' : props.type);
</script>
<template>
  <div class="min-w-0 w-full flex flex-col gap-1.5 font-sans" :class="$attrs.class">
    <label v-if="label" :for="inputId" class="text-sm font-medium text-neutral-dark">{{ label }}</label>
    <div class="relative">
      <input v-bind="inputAttrs" :id="inputId" :name="name" :type="inputType" :placeholder="placeholder"
        :disabled="disabled" v-model="value" @blur="handleBlur"
        :aria-invalid="message ? true : undefined"
        :aria-describedby="message ? `${inputId}-error` : String(inputAttrs['aria-describedby'] || '') || undefined"
        class="w-full min-w-0 px-4 py-3 text-base sm:text-sm rounded-lg border outline-none transition-colors duration-200 font-sans disabled:opacity-60 disabled:bg-neutral-lightest disabled:cursor-not-allowed"
        :class="[message ? 'border-danger focus:border-danger bg-danger/5' : 'border-neutral-light focus:border-action bg-neutral-white', icon ? 'pl-10' : '', type === 'password' ? 'pr-12' : '']" />
      <div v-if="icon" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium pointer-events-none">
        <Icon v-if="typeof icon === 'string'" :name="icon" />
        <component :is="icon" v-else class="w-5 h-5" aria-hidden="true" />
      </div>
      <button v-if="type === 'password'" type="button" :disabled="disabled"
        :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" :aria-pressed="showPassword"
        class="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-lg text-neutral-medium hover:text-neutral-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        @click="showPassword = !showPassword">
        <component :is="showPassword ? EyeOff : Eye" class="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
    <span v-if="message" :id="`${inputId}-error`" role="alert" class="text-sm text-danger font-medium">{{ message }}</span>
  </div>
</template>
