<template>
  <div class="w-full flex flex-col gap-1.5">
    <label v-if="label" :for="id" class="text-sm font-medium text-neutral-dark">
      {{ label }}
    </label>
    <div class="relative">
      <input
        :id="id"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        v-model="value"
        @blur="handleBlur"
        class="w-full px-4 py-2.5 rounded-input border outline-none transition-colors duration-200 font-sans"
        :class="[
          errorMessage 
            ? 'border-red-500 focus:border-red-500 bg-red-50/30' 
            : 'border-neutral-light focus:border-action bg-white',
          disabled ? 'opacity-60 bg-neutral-lightest cursor-not-allowed' : '',
          icon ? 'pl-10' : ''
        ]"
      />
      <div v-if="icon" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium">
        <component :is="icon" class="w-5 h-5" />
      </div>
      <button 
        v-if="type === 'password'" 
        type="button" 
        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-medium hover:text-neutral-dark"
        @click="togglePassword"
      >
        <component :is="showPassword ? EyeOffIcon : EyeIcon" class="w-5 h-5" />
      </button>
    </div>
    <span v-if="errorMessage" class="text-sm text-red-500 font-medium">
      {{ errorMessage }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useField } from 'vee-validate';
import { Eye as EyeIcon, EyeOff as EyeOffIcon } from 'lucide-vue-next';

const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  id: { type: String, default: () => `input-${Math.random().toString(36).substring(2, 9)}` },
  disabled: { type: Boolean, default: false },
  icon: { type: Object, default: null }
});

const { value, errorMessage, handleBlur } = useField(props.name);

const showPassword = ref(false);

const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

const inputType = computed(() => {
  if (props.type === 'password') {
    return showPassword.value ? 'text' : 'password';
  }
  return props.type;
});
</script>
