<template>
  <div class="w-full">
    <div v-show="googleBotonMontado" ref="googleBtnRef" class="w-full flex justify-center"></div>
    <Button
      v-show="!googleBotonMontado"
      variant="google"
      size="full"
      :disabled="disabled"
      @click="loginWithGoogle"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {{ label }}
    </Button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { Button } from '@/core/components';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    label?: string;
    text?: 'signin_with' | 'signup_with' | 'continue_with';
  }>(),
  {
    disabled: false,
    label: 'Continuar con Google',
    text: 'signin_with',
  }
);

const emit = defineEmits<{
  (e: 'success', credential: string): void;
  (e: 'error', mensaje: string): void;
}>();

const googleBtnRef = ref<HTMLElement | null>(null);
const googleBotonMontado = ref(false);

function inicializarBotonGoogle(): void {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || clientId.trim() === '') return;

  const intentarMontar = (): boolean => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id && googleBtnRef.value) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            emit('success', response.credential);
          }
        },
      });

      googleBtnRef.value.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.value, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: props.text,
        size: 'large',
        logo_alignment: 'left',
        width: googleBtnRef.value.clientWidth > 200 ? googleBtnRef.value.clientWidth : 340,
      });

      googleBotonMontado.value = true;
      return true;
    }
    return false;
  };

  if (!intentarMontar()) {
    let reintentos = 0;
    const intervalo = setInterval(() => {
      reintentos++;
      if (intentarMontar() || reintentos > 15) {
        clearInterval(intervalo);
      }
    }, 200);
  }
}

onMounted(() => {
  void nextTick(() => {
    inicializarBotonGoogle();
  });
});

defineExpose({
  montar: inicializarBotonGoogle,
});

function loginWithGoogle(): void {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || clientId.trim() === '') {
    emit('error', 'El servicio de Google Sign-In no está configurado en este entorno.');
    return;
  }

  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          emit('success', response.credential);
        }
      },
    });
    window.google.accounts.id.prompt();
  } else {
    emit('error', 'Cargando servicios de Google... Por favor, reintenta en un momento.');
  }
}
</script>
