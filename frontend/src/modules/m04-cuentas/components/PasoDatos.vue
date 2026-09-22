<template>
  <EncabezadoModal />
  <PasosProgreso :pasos="['Datos', 'Verificación', 'Listo']" :paso-actual="1" />

  <!-- 1. VISTA ESTÁNDAR: FORMULARIO DE REGISTRO -->
  <div v-if="vistaActual === 'formulario'">
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
    <div v-if="activeTab === 'natural'">
      <!-- Botón de Registro con Google (HU-CUE-02) -->
      <div class="mb-5">
        <div ref="googleBtnRef" class="w-full flex justify-center min-h-[44px]"></div>
        <Button v-show="!googleBotonMontado" variant="google" size="full" :disabled="cargando" @click="registrarConGoogle">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Registrarse con Google
        </Button>
      </div>

      <div class="relative my-5">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-neutral-light"></div>
        </div>
        <div class="relative flex justify-center text-xs">
          <span class="px-3 bg-white text-neutral-medium font-medium">O con tu correo</span>
        </div>
      </div>

      <form @submit="onSubmit" class="flex flex-col gap-4">
        <Input name="nombre" label="Nombre completo" placeholder="Ej. Juan Pérez" />
        <Input name="correo" label="Correo electrónico" type="email" placeholder="correo@ejemplo.com" :icon="MailIcon" />
        <Input name="telefono" label="Teléfono (WhatsApp)" placeholder="300 000 0000" :icon="PhoneIcon" />
        <div class="flex flex-col gap-1">
          <Input name="contrasena" label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" :icon="LockIcon" />
          <span class="text-xs text-neutral-medium">Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.</span>
        </div>

        <div class="flex items-start gap-2 mt-1">
          <input type="checkbox" id="termsNatural" class="mt-1 rounded border-neutral-light text-corporate focus:ring-corporate" required />
          <label for="termsNatural" class="text-xs text-neutral-medium">
            Acepto los <a href="#" class="text-action hover:underline">Términos y Condiciones</a> y la
            <a href="#" class="text-action hover:underline">Política de Tratamiento de Datos</a>.
          </label>
        </div>

        <div v-if="errorMensaje" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
          {{ errorMensaje }}
        </div>

        <Button type="submit" variant="primary" size="full" class="mt-2" :disabled="cargando">
          {{ cargando ? 'Cargando...' : 'Continuar' }}
        </Button>
      </form>
    </div>

    <!-- Formulario Empresa -->
    <form v-else @submit="onSubmit" class="flex flex-col gap-4">
      <Input name="nombre_empresa" label="Nombre Empresa" placeholder="Ej. Pinturas S.A.S" />
      <Input name="nombre_representante" label="Nombre del representante legal" placeholder="Ej. María Gómez" />
      <Input name="correo_empresarial" label="Correo corporativo" type="email" placeholder="contacto@empresa.com" :icon="MailIcon" />
      <Input name="telefono" label="Teléfono (WhatsApp)" placeholder="300 000 0000" :icon="PhoneIcon" />
      <Input name="nit" label="NIT" placeholder="900.000.000-1" />
      <div class="flex flex-col gap-1">
        <Input name="contrasena" label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" :icon="LockIcon" />
        <span class="text-xs text-neutral-medium">Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.</span>
      </div>

      <div class="flex items-start gap-2 mt-1">
        <input type="checkbox" id="termsEmpresa" class="mt-1 rounded border-neutral-light text-corporate focus:ring-corporate" required />
        <label for="termsEmpresa" class="text-xs text-neutral-medium">
          Acepto los <a href="#" class="text-action hover:underline">Términos y Condiciones</a> y la
          <a href="#" class="text-action hover:underline">Política de Tratamiento de Datos</a>.
        </label>
      </div>

      <div v-if="errorMensaje" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
        {{ errorMensaje }}
      </div>

      <Button type="submit" variant="primary" size="full" class="mt-2" :disabled="cargando">
        {{ cargando ? 'Cargando...' : 'Continuar' }}
      </Button>
    </form>

    <div class="mt-6 text-center text-sm">
      <span class="text-neutral-medium">¿Ya tienes una cuenta? </span>
      <button type="button" @click="$emit('irALogin')" class="font-semibold text-action hover:underline cursor-pointer">
        Inicia sesión
      </button>
    </div>
  </div>

  <!-- 2. VISTA HU-CUE-02: SUGERENCIA DE VINCULACIÓN CON CUENTA EXISTENTE -->
  <div v-else-if="vistaActual === 'vincular_google'" class="flex flex-col gap-5">
    <div class="text-center">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-subaction flex items-center justify-center text-corporate">
        <ShieldCheck class="w-6 h-6" />
      </div>
      <h2 class="text-xl font-bold text-corporate mb-2">Cuenta ya existente</h2>
      <p class="text-neutral-medium text-sm">
        Ya existe una cuenta en Pintuclic registrada con el correo:
      </p>
      <p class="font-semibold text-corporate mt-1 text-base">
        {{ datosVinculacion.correo }}
      </p>
    </div>

    <div class="p-3.5 bg-neutral-lightest border border-neutral-light rounded-lg text-sm text-neutral-dark">
      ¿Deseas vincular el acceso de Google a tu cuenta existente? Podrás iniciar sesión indistintamente con tu contraseña o con Google.
    </div>

    <div v-if="errorMensaje" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
      {{ errorMensaje }}
    </div>

    <div class="flex flex-col gap-3 mt-2">
      <Button variant="primary" size="full" :disabled="cargando" @click="confirmarVinculacion">
        {{ cargando ? 'Vinculando...' : 'Sí, vincular y continuar' }}
      </Button>
      <Button variant="outline" size="full" :disabled="cargando" @click="cancelarVinculacion">
        Cancelar
      </Button>
    </div>
  </div>

  <!-- 3. VISTA HU-CUE-02: CREAR CONTRASEÑA PROPIA TRAS REGISTRO CON GOOGLE -->
  <div v-else-if="vistaActual === 'completar_password'" class="flex flex-col gap-5">
    <div class="text-center">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-subaction flex items-center justify-center text-corporate">
        <LockIcon class="w-6 h-6" />
      </div>
      <h2 class="text-xl font-bold text-corporate mb-2">Define tu contraseña propia</h2>
      <p class="text-neutral-medium text-sm">
        Tu cuenta se ha creado con éxito mediante Google. Por seguridad, define una contraseña propia para contar con doble vía de acceso.
      </p>
    </div>

    <form @submit.prevent="guardarPasswordInicial" class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-neutral-dark">Contraseña propia</label>
        <input
          v-model="nuevaPassword"
          type="password"
          placeholder="Mín. 8 caracteres, 1 mayúscula, 1 minúscula y 1 número"
          class="w-full px-3.5 py-2.5 rounded-lg border border-neutral-light focus:outline-none focus:ring-2 focus:ring-action text-sm"
        />
        <span class="text-xs text-neutral-medium">Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.</span>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-neutral-dark">Confirmar contraseña</label>
        <input
          v-model="confirmarPassword"
          type="password"
          placeholder="Repite la contraseña"
          class="w-full px-3.5 py-2.5 rounded-lg border border-neutral-light focus:outline-none focus:ring-2 focus:ring-action text-sm"
        />
      </div>

      <div v-if="errorPasswordLocal || errorMensaje" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
        {{ errorPasswordLocal || errorMensaje }}
      </div>

      <Button type="submit" variant="primary" size="full" class="mt-2" :disabled="cargando">
        {{ cargando ? 'Guardando...' : 'Completar registro' }}
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { Mail as MailIcon, Lock as LockIcon, Phone as PhoneIcon, ShieldCheck } from 'lucide-vue-next';
import EncabezadoModal from './EncabezadoModal.vue';
import PasosProgreso from './PasosProgreso.vue';
import Input from '@/core/components/Input.vue';
import Button from '@/core/components/Button.vue';
import type {
  TipoCuentaRegistro,
  RegistroNaturalPayload,
  RegistroEmpresaPayload,
} from '../interfaces/registro.interface';
import { useCuentas } from '../composables/useCuentas';
import {
  registroNaturalSchema,
  registroEmpresaSchema,
  validarContrasenaConConfirmacion,
} from '../dtos';

const emit = defineEmits<{
  irALogin: [];
  datosListos: [tipo: TipoCuentaRegistro, correo: string];
  registroGoogleExitoso: [correo: string];
}>();

type VistaSubmodulo = 'formulario' | 'vincular_google' | 'completar_password';
const vistaActual = ref<VistaSubmodulo>('formulario');

const googleBtnRef = ref<HTMLElement | null>(null);
const googleBotonMontado = ref(false);

const activeTab = ref<TipoCuentaRegistro>('natural');

const datosVinculacion = ref<{
  correo: string;
  googleId: string;
  nombre?: string;
}>({
  correo: '',
  googleId: '',
});

const datosPassword = ref<{
  correo: string;
}>({
  correo: '',
});

const nuevaPassword = ref('');
const confirmarPassword = ref('');
const errorPasswordLocal = ref<string | null>(null);

const {
  cargando,
  errorMensaje,
  registrarParticular,
  registrarEmpresa,
  loginConGoogle,
  confirmarVinculacionGoogle,
  completarPasswordGoogle,
  limpiarErrores,
} = useCuentas();

const currentSchema = computed(() => {
  return toTypedSchema(activeTab.value === 'natural' ? registroNaturalSchema : registroEmpresaSchema);
});

// useForm unificado
const { handleSubmit } = useForm({ validationSchema: currentSchema });

const onSubmit = handleSubmit(async (values) => {
  limpiarErrores();

  if (activeTab.value === 'natural' && 'correo' in values) {
    const payload: RegistroNaturalPayload = {
      nombre: values.nombre,
      correo: values.correo,
      telefono: values.telefono,
      contrasena: values.contrasena,
    };
    const res = await registrarParticular(payload);
    if (res) {
      emit('datosListos', 'natural', payload.correo);
    }
  } else if ('correo_empresarial' in values) {
    const payload: RegistroEmpresaPayload = {
      nombre_empresa: values.nombre_empresa,
      nombre_representante: values.nombre_representante,
      correo_empresarial: values.correo_empresarial,
      telefono: values.telefono,
      nit: values.nit,
      contrasena: values.contrasena,
    };
    const res = await registrarEmpresa(payload);
    if (res) {
      emit('datosListos', 'empresa', payload.correo_empresarial);
    }
  }
});

/**
 * HU-CUE-02: Procesamiento de credencial de Google para registro
 */
async function procesarRespuestaGoogle(idToken: string) {
  const respuesta = await loginConGoogle(idToken);
  if (!respuesta) return;

  if (respuesta.tipo === 'login_exitoso') {
    emit('registroGoogleExitoso', respuesta.correo);
  } else if (respuesta.tipo === 'sugerencia_vinculacion') {
    datosVinculacion.value = {
      correo: respuesta.correo,
      googleId: respuesta.datos_google?.googleId ?? '',
      nombre: respuesta.datos_google?.nombre,
    };
    vistaActual.value = 'vincular_google';
  } else if (respuesta.tipo === 'requiere_password_inicial') {
    datosPassword.value = {
      correo: respuesta.correo,
    };
    vistaActual.value = 'completar_password';
  }
}

function inicializarBotonGoogle() {
  if (activeTab.value !== 'natural') return;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || clientId.trim() === '') return;

  const intentarMontar = () => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id && googleBtnRef.value) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            void procesarRespuestaGoogle(response.credential);
          }
        },
      });

      googleBtnRef.value.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.value, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signup_with',
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

watch(activeTab, (nuevoTab) => {
  if (nuevoTab === 'natural') {
    void nextTick(() => {
      inicializarBotonGoogle();
    });
  }
}, { immediate: true });

const registrarConGoogle = () => {
  limpiarErrores();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId || clientId.trim() === '') {
    errorMensaje.value = 'El servicio de Google Sign-In no está configurado en este entorno.';
    return;
  }

  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response.credential) {
          void procesarRespuestaGoogle(response.credential);
        }
      },
    });

    window.google.accounts.id.prompt();
  } else {
    errorMensaje.value = 'Cargando servicios de Google... Por favor, reintenta en un momento.';
  }
};

const confirmarVinculacion = async () => {
  const resultado = await confirmarVinculacionGoogle(
    datosVinculacion.value.correo,
    datosVinculacion.value.googleId,
    true
  );

  if (resultado) {
    emit('registroGoogleExitoso', datosVinculacion.value.correo);
  }
};

const cancelarVinculacion = () => {
  vistaActual.value = 'formulario';
  limpiarErrores();
};

const guardarPasswordInicial = async () => {
  errorPasswordLocal.value = validarContrasenaConConfirmacion(
    nuevaPassword.value,
    confirmarPassword.value
  );

  if (errorPasswordLocal.value) {
    return;
  }

  const resultado = await completarPasswordGoogle(
    datosPassword.value.correo,
    nuevaPassword.value
  );

  if (resultado) {
    emit('registroGoogleExitoso', datosPassword.value.correo);
  }
};
</script>
