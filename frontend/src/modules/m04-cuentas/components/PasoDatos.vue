<template>
  <EncabezadoModal />
  <PasosProgreso :pasos="['Datos', 'Verificación', 'Listo']" :paso-actual="1" />

  <div class="text-center mb-6">
    <h2 class="text-2xl font-bold text-corporate mb-2">Crear cuenta</h2>
    <p class="text-neutral-medium text-sm">Únete a PintuClic para comprar más fácil</p>
  </div>

  <!-- Tabs -->
  <div class="flex p-1 bg-subaction rounded-lg mb-6">
    <button
      type="button"
      @click="activeTab = 'natural'"
      class="flex-1 py-2 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer"
      :class="activeTab === 'natural' ? 'bg-white text-corporate shadow-sm' : 'text-corporate/60 hover:text-corporate'"
    >
      Natural
    </button>
    <button
      type="button"
      @click="activeTab = 'empresa'"
      class="flex-1 py-2 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer"
      :class="activeTab === 'empresa' ? 'bg-white text-corporate shadow-sm' : 'text-corporate/60 hover:text-corporate'"
    >
      Empresa
    </button>
  </div>

  <!-- Formulario Natural -->
  <form v-if="activeTab === 'natural'" @submit="onSubmit" class="flex flex-col gap-4">
    <Entrada name="nombre" label="Nombre completo" placeholder="Ej. Juan Pérez" />
    <Entrada name="correo" label="Correo electrónico" type="email" placeholder="correo@ejemplo.com" :icon="MailIcon" />
    <Entrada name="telefono" label="Teléfono (WhatsApp)" placeholder="300 000 0000" :icon="PhoneIcon" />
    <Entrada name="contrasena" label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" :icon="LockIcon" />

    <div class="flex items-start gap-2 mt-1">
      <input type="checkbox" id="termsNatural" class="mt-1 rounded border-neutral-light text-corporate focus:ring-corporate" required />
      <label for="termsNatural" class="text-xs text-neutral-medium">
        Acepto los <a href="#" class="text-action hover:underline">Términos y Condiciones</a> y la
        <a href="#" class="text-action hover:underline">Política de Tratamiento de Datos</a>.
      </label>
    </div>

    <div v-if="errorMessage" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
      {{ errorMessage }}
    </div>

    <Boton type="submit" variant="primary" size="full" class="mt-2" :disabled="isLoading">
      {{ isLoading ? 'Cargando...' : 'Continuar' }}
    </Boton>
  </form>

  <!-- Formulario Empresa -->
  <form v-else @submit="onSubmit" class="flex flex-col gap-4">
    <Entrada name="nombre_empresa" label="Nombre Empresa" placeholder="Ej. Pinturas S.A.S" />
    <Entrada name="nombre_representante" label="Nombre del representante legal" placeholder="Ej. María Gómez" />
    <Entrada name="correo_empresarial" label="Correo corporativo" type="email" placeholder="contacto@empresa.com" :icon="MailIcon" />
    <Entrada name="telefono" label="Teléfono (WhatsApp)" placeholder="300 000 0000" :icon="PhoneIcon" />
    <Entrada name="nit" label="NIT" placeholder="900.000.000-1" />
    <Entrada name="contrasena" label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" :icon="LockIcon" />

    <div class="flex items-start gap-2 mt-1">
      <input type="checkbox" id="termsEmpresa" class="mt-1 rounded border-neutral-light text-corporate focus:ring-corporate" required />
      <label for="termsEmpresa" class="text-xs text-neutral-medium">
        Acepto los <a href="#" class="text-action hover:underline">Términos y Condiciones</a> y la
        <a href="#" class="text-action hover:underline">Política de Tratamiento de Datos</a>.
      </label>
    </div>

    <div v-if="errorMessage" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
      {{ errorMessage }}
    </div>

    <Boton type="submit" variant="primary" size="full" class="mt-2" :disabled="isLoading">
      {{ isLoading ? 'Cargando...' : 'Continuar' }}
    </Boton>
  </form>

  <div class="mt-6 text-center text-sm">
    <span class="text-neutral-medium">¿Ya tienes una cuenta? </span>
    <button type="button" @click="$emit('irALogin')" class="font-semibold text-action hover:underline cursor-pointer">
      Inicia sesión
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import axios from 'axios';
import { Mail as MailIcon, Lock as LockIcon, Phone as PhoneIcon } from 'lucide-vue-next';
import EncabezadoModal from './EncabezadoModal.vue';
import PasosProgreso from './PasosProgreso.vue';
import Entrada from '@/core/components/Entrada.vue';
import Boton from '@/core/components/Boton.vue';
import type {
  TipoCuentaRegistro,
  RegistroNaturalPayload,
  RegistroEmpresaPayload,
} from '../interfaces/registro.interface';
import { CuentasService } from '../services/cuentas.service';

const emit = defineEmits<{
  irALogin: [];
  datosListos: [tipo: TipoCuentaRegistro, correo: string];
}>();

const activeTab = ref<TipoCuentaRegistro>('natural');

// Regla de contraseña real
const passwordRule = z
  .string({ required_error: 'La contraseña es obligatoria' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(128, 'La contraseña no puede superar los 128 caracteres')
  .regex(/[a-z]/, 'Debe incluir al menos una minúscula')
  .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
  .regex(/[0-9]/, 'Debe incluir al menos un número');

const telefonoRule = z
  .string({ required_error: 'El teléfono es obligatorio' })
  .trim()
  .min(7, 'El teléfono debe tener al menos 7 dígitos')
  .max(20, 'El teléfono no puede exceder 20 caracteres')
  .regex(/^[0-9+\s\-()]+$/, 'El formato de teléfono es inválido');

// Validaciones alineadas 1:1 con backend
const naturalZod = z.object({
  nombre: z.string({ required_error: 'El nombre es obligatorio' }).trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(150, 'Máximo 150 caracteres'),
  correo: z.string({ required_error: 'El correo es obligatorio' }).trim().email('Correo electrónico inválido').max(150, 'Máximo 150 caracteres'),
  telefono: telefonoRule,
  contrasena: passwordRule,
});

const empresaZod = z.object({
  nombre_empresa: z.string({ required_error: 'El nombre de empresa es obligatorio' }).trim().min(2, 'Debe tener al menos 2 caracteres').max(150, 'Máximo 150 caracteres'),
  nombre_representante: z.string({ required_error: 'El representante es obligatorio' }).trim().min(2, 'Debe tener al menos 2 caracteres').max(150, 'Máximo 150 caracteres'),
  correo_empresarial: z.string({ required_error: 'El correo es obligatorio' }).trim().email('Correo electrónico inválido').max(150, 'Máximo 150 caracteres'),
  telefono: telefonoRule,
  nit: z.string({ required_error: 'El NIT es obligatorio' }).trim().min(5, 'El NIT o RUT debe tener al menos 5 caracteres').max(30, 'Máximo 30 caracteres')
    .regex(/^[0-9\-kK]+$/, 'El NIT debe contener dígitos y guion de verificación'),
  contrasena: passwordRule,
});

const currentSchema = computed(() => {
  return toTypedSchema(activeTab.value === 'natural' ? naturalZod : empresaZod);
});

// useForm unificado
const { handleSubmit } = useForm({ validationSchema: currentSchema });

const errorMessage = ref('');
const isLoading = ref(false);

const onSubmit = handleSubmit(async (values) => {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    if (activeTab.value === 'natural' && 'correo' in values) {
      const payload: RegistroNaturalPayload = {
        nombre: values.nombre,
        correo: values.correo,
        telefono: values.telefono,
        contrasena: values.contrasena,
      };
      await CuentasService.registrarParticular(payload);
      emit('datosListos', 'natural', payload.correo);
    } else if ('correo_empresarial' in values) {
      const payload: RegistroEmpresaPayload = {
        nombre_empresa: values.nombre_empresa,
        nombre_representante: values.nombre_representante,
        correo_empresarial: values.correo_empresarial,
        telefono: values.telefono,
        nit: values.nit,
        contrasena: values.contrasena,
      };
      await CuentasService.registrarEmpresa(payload);
      emit('datosListos', 'empresa', payload.correo_empresarial);
    }
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as { mensaje?: string } | undefined;
      errorMessage.value = data?.mensaje || 'Error en el registro. Verifica los datos.';
    } else {
      errorMessage.value = 'Ocurrió un error inesperado al procesar el registro.';
    }
  } finally {
    isLoading.value = false;
  }
});
</script>
