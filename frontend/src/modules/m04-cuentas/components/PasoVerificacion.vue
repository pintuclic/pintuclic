<template>
  <EncabezadoModal />
  <PasosProgreso :pasos="['Datos', 'Verificación', 'Listo']" :paso-actual="2" />

  <div class="text-center mb-8">
    <h2 class="text-2xl font-bold text-corporate mb-2">Verifica tu correo</h2>
    <p class="text-neutral-medium text-sm px-4">
      Escribe el código de 6 dígitos que enviamos a <strong>{{ correo }}</strong>.
    </p>
  </div>

  <form @submit.prevent="onVerificarSubmit" class="flex flex-col gap-6 items-center">
    <div class="flex gap-2 justify-center w-full">
      <input
        v-for="(_, index) in otp"
        :key="index"
        v-model="otp[index]"
        type="text"
        maxlength="1"
        class="w-12 h-14 text-center text-2xl font-heading font-medium rounded-input border border-neutral-light focus:border-corporate focus:ring-1 focus:ring-corporate outline-none bg-white transition-colors"
        @input="focusNext(index, $event)"
        @keydown.delete="focusPrev(index, $event)"
      />
    </div>

    <!-- Error con tokens oficiales de diseño -->
    <div v-if="errorMensaje" class="w-full text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
      {{ errorMensaje }}
    </div>

    <!-- Franja informativa oficial con tokens de conversión -->
    <div class="w-full rounded-input bg-conversion/10 border border-conversion/30 px-4 py-3 text-sm text-neutral-dark text-center">
      El código expira en 15 minutos. Tu cuenta se activa al confirmarlo.
    </div>

    <div class="w-full">
      <Button type="submit" variant="primary" size="full" :disabled="!otpCompleto || cargando">
        {{ cargando ? 'Verificando...' : 'Verificar y crear cuenta' }}
      </Button>
    </div>
  </form>

  <div class="mt-6 text-center text-sm">
    <p class="text-neutral-medium mb-1">¿No te llegó?</p>
    <button type="button" class="font-semibold text-action hover:underline cursor-pointer" :disabled="cargando || tiempoRestante > 0" @click="onReenviarSubmit">
      {{ tiempoRestante > 0 ? `Reenviar código en ${tiempoRestante}s` : 'Reenviar código' }}
    </button>
  </div>

  <div class="mt-4 text-center">
    <button type="button" class="text-sm text-neutral-medium hover:text-neutral-dark hover:underline cursor-pointer" @click="$emit('volver')">
      ← Volver
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import EncabezadoModal from './EncabezadoModal.vue';
import PasosProgreso from './PasosProgreso.vue';
import Button from '@/core/components/Button.vue';
import { useCuentas } from '../composables/useCuentas';

const props = defineProps<{
  correo: string;
}>();

const emit = defineEmits<{
  (e: 'verificado'): void;
  (e: 'volver'): void;
}>();

const {
  cargando,
  errorMensaje,
  verificarCodigoActivacion,
  reenviarCodigoActivacion,
  limpiarErrores,
} = useCuentas();

const otp = ref(['', '', '', '', '', '']);
const otpCompleto = computed(() => otp.value.every((valor) => valor !== ''));
const tiempoRestante = ref(0);
let timerId: ReturnType<typeof setInterval> | null = null;

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
});

function focusNext(index: number, event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (target?.value && index < 5) {
    (target.nextElementSibling as HTMLInputElement | null)?.focus();
  }
}

function focusPrev(index: number, event: Event) {
  const target = event.target as HTMLInputElement | null;
  if (!target?.value && index > 0) {
    (target?.previousElementSibling as HTMLInputElement | null)?.focus();
  }
}

async function onVerificarSubmit() {
  if (!otpCompleto.value) return;

  const codigoStr = otp.value.join('');
  limpiarErrores();

  const resultado = await verificarCodigoActivacion({
    correo: props.correo,
    codigo: codigoStr,
  });

  if (resultado) {
    emit('verificado');
  }
}

async function onReenviarSubmit() {
  if (tiempoRestante.value > 0) return;
  limpiarErrores();

  const resultado = await reenviarCodigoActivacion(props.correo);
  if (resultado) {
    tiempoRestante.value = resultado.tiempoEsperaSegundos ?? 60;

    if (timerId) clearInterval(timerId);
    timerId = setInterval(() => {
      if (tiempoRestante.value > 0) {
        tiempoRestante.value--;
      } else {
        if (timerId) clearInterval(timerId);
        timerId = null;
      }
    }, 1000);
  }
}
</script>
