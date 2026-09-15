<template>
  <div>
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-corporate mb-2">Restablecer contraseña</h2>
      <p class="text-neutral-medium text-sm">
        Ingresa el código de 6 dígitos enviado a <br/><span class="font-bold text-corporate">{{ correo }}</span>
      </p>
    </div>

    <div class="flex justify-center gap-2 mb-6">
      <input 
        v-for="(digit, index) in code" 
        :key="index"
        :ref="el => inputs[index] = el"
        v-model="code[index]"
        type="text"
        inputmode="numeric"
        maxlength="1"
        @input="onInput($event, index)"
        @keydown="onKeyDown($event, index)"
        @paste="onPaste"
        class="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-neutral-light focus:border-action focus:ring-2 focus:ring-action/20 outline-none transition-colors"
        :class="{ 'border-conversion focus:border-conversion focus:ring-conversion/20': errorMsg }"
      />
    </div>

    <!-- Error Global -->
    <div v-if="errorMsg" class="bg-red-50 text-conversion text-sm p-3 rounded-lg flex items-start gap-2 mb-4 text-left">
      <AlertCircleIcon class="w-5 h-5 shrink-0" />
      <p>{{ errorMsg }}</p>
    </div>

    <Button type="button" variant="primary" size="full" :disabled="!isComplete || isLoading" @click="verificarCodigo">
      {{ isLoading ? 'Verificando...' : 'Verificar código' }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { AlertCircle as AlertCircleIcon } from 'lucide-vue-next';
import Button from '@/core/components/buttons/Button.vue';

const props = defineProps<{
  correo: string;
}>();

const emit = defineEmits<{
  'verificado': [codigo: string];
}>();

const code = ref(Array(6).fill(''));
const inputs = ref<any[]>([]);
const errorMsg = ref('');
const isLoading = ref(false);

const isComplete = computed(() => code.value.every(d => d !== ''));

const focusInput = (index: number) => {
  if (inputs.value[index]) {
    inputs.value[index].focus();
  }
};

const onInput = (e: Event, index: number) => {
  const input = e.target as HTMLInputElement;
  const val = input.value;
  
  if (val && !/^\d+$/.test(val)) {
    code.value[index] = '';
    return;
  }
  
  if (val && index < 5) {
    focusInput(index + 1);
  }
};

const onKeyDown = (e: KeyboardEvent, index: number) => {
  if (e.key === 'Backspace' && !code.value[index] && index > 0) {
    focusInput(index - 1);
  }
};

const onPaste = (e: ClipboardEvent) => {
  e.preventDefault();
  const pasted = e.clipboardData?.getData('text');
  if (!pasted) return;
  const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
  digits.forEach((digit, i) => {
    code.value[i] = digit;
  });
  if (digits.length > 0) {
    focusInput(Math.min(digits.length, 5));
  }
};

const verificarCodigo = async () => {
  if (!isComplete.value) return;
  emit('verificado', code.value.join(''));
};
</script>
