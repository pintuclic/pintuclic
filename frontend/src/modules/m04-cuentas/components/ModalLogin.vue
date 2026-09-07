<template>
  <ModalBase :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" maxWidth="md" accent>
    <EncabezadoModal />
    
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold text-corporate mb-2">Iniciar sesión</h2>
      <p class="text-neutral-medium text-sm">Ingresa a tu cuenta para ver tus pedidos y ofertas</p>
    </div>

    <form @submit="onSubmit" class="flex flex-col gap-5">
      <Entrada
        name="correo"
        label="Correo electrónico"
        type="email"
        placeholder="ejemplo@correo.com"
        :icon="MailIcon"
      />
      
      <div class="flex flex-col gap-1.5">
        <Entrada
          name="contrasena"
          label="Contraseña"
          type="password"
          placeholder="Tu contraseña"
          :icon="LockIcon"
        />
        <div class="flex justify-end mt-1">
          <a href="#" class="text-sm font-semibold text-action hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>

      <div v-if="errorMessage" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
        {{ errorMessage }}
      </div>

      <Boton type="submit" variant="primary" size="full" class="mt-2" :disabled="isLoading">
        {{ isLoading ? 'Iniciando...' : 'Iniciar sesión' }}
      </Boton>
    </form>

    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-neutral-light"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-3 bg-white text-neutral-medium font-medium">O</span>
        </div>
      </div>

      <div class="mt-6">
        <Boton variant="google" size="full" @click="loginWithGoogle">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </Boton>
      </div>
    </div>

    <div class="mt-8 text-center text-sm">
      <span class="text-neutral-medium">¿No tienes una cuenta? </span>
      <button @click="$emit('goToRegister')" class="font-semibold text-action hover:underline cursor-pointer">
        Regístrate
      </button>
    </div>
  </ModalBase>
</template>

<script setup lang="ts">
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { ref } from 'vue';
import axios from 'axios';
import { useAuthStore } from '../store/auth.store';
import { Mail as MailIcon, Lock as LockIcon } from 'lucide-vue-next';
import ModalBase from '@/core/components/ModalBase.vue';
import EncabezadoModal from './EncabezadoModal.vue';
import Entrada from '@/core/components/Entrada.vue';
import Boton from '@/core/components/Boton.vue';

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'goToRegister'): void;
  (e: 'success'): void;
}>();

const authStore = useAuthStore();
const errorMessage = ref('');
const isLoading = ref(false);

const schema = toTypedSchema(
  z.object({
    correo: z.string().min(1, 'El correo es obligatorio').email('Correo electrónico inválido'),
    contrasena: z.string().min(1, 'La contraseña es obligatoria')
  })
);

const { handleSubmit } = useForm({
  validationSchema: schema,
});

const onSubmit = handleSubmit(async (values) => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    await authStore.login(values.correo, values.contrasena);
    emit('success');
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { mensaje?: string } | undefined;
      errorMessage.value = data?.mensaje || 'Error al iniciar sesión. Verifica tus credenciales.';
    } else {
      errorMessage.value = 'Error al iniciar sesión. Verifica tus credenciales.';
    }
  } finally {
    isLoading.value = false;
  }
});

const loginWithGoogle = () => {
  // Integración pendiente con Google Identity OAuth2 (HU-CUE-02)
};
</script>
