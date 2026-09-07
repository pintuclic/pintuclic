<template>
  <ModalBase :modelValue="modelValue" @update:modelValue="cerrarModal" maxWidth="md" accent>
    <EncabezadoModal />
    
    <!-- 1. VISTA ESTÁNDAR: INICIO DE SESIÓN -->
    <div v-if="vistaActual === 'login'">
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

        <div v-if="errorMensaje" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
          {{ errorMensaje }}
        </div>

        <Boton type="submit" variant="primary" size="full" class="mt-2" :disabled="cargando">
          {{ cargando ? 'Iniciando...' : 'Iniciar sesión' }}
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
          <div ref="googleBtnRef" class="w-full flex justify-center min-h-[44px]"></div>
          <Boton v-show="!googleBotonMontado" variant="google" size="full" :disabled="cargando" @click="loginWithGoogle">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
    </div>

    <!-- 2. VISTA HU-CUE-02: SUGERENCIA DE VINCULACIÓN CON CUENTA EXISTENTE -->
    <div v-else-if="vistaActual === 'vincular_google'" class="flex flex-col gap-5">
      <div class="text-center">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-subaction flex items-center justify-center text-corporate">
          <ShieldCheck class="w-6 h-6" />
        </div>
        <h2 class="text-xl font-bold text-corporate mb-2">Vincular cuenta con Google</h2>
        <p class="text-neutral-medium text-sm">
          Ya existe una cuenta en Pintuclic registrada con el correo:
        </p>
        <p class="font-semibold text-corporate mt-1 text-base">
          {{ datosVinculacion.correo }}
        </p>
      </div>

      <div class="p-3.5 bg-neutral-lightest border border-neutral-light rounded-lg text-sm text-neutral-dark">
        ¿Deseas vincular tu acceso de Google a tu cuenta actual? Podrás iniciar sesión indistintamente con tu contraseña o con Google.
      </div>

      <div v-if="errorMensaje" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
        {{ errorMensaje }}
      </div>

      <div class="flex flex-col gap-3 mt-2">
        <Boton variant="primary" size="full" :disabled="cargando" @click="confirmarVinculacion">
          {{ cargando ? 'Vinculando...' : 'Sí, vincular cuenta' }}
        </Boton>
        <Boton variant="outline" size="full" :disabled="cargando" @click="cancelarVinculacion">
          Cancelar
        </Boton>
      </div>
    </div>

    <!-- 3. VISTA HU-CUE-02: CREAR CONTRASEÑA PROPIA TRAS REGISTRO CON GOOGLE -->
    <div v-else-if="vistaActual === 'completar_password'" class="flex flex-col gap-5">
      <div class="text-center">
        <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-subaction flex items-center justify-center text-corporate">
          <LockIcon class="w-6 h-6" />
        </div>
        <h2 class="text-xl font-bold text-corporate mb-2">Crea tu contraseña</h2>
        <p class="text-neutral-medium text-sm">
          Tu cuenta ha sido creada mediante Google. Por favor, digita una contraseña propia para contar con ambas vías de acceso.
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

        <Boton type="submit" variant="primary" size="full" class="mt-2" :disabled="cargando">
          {{ cargando ? 'Guardando...' : 'Completar y acceder' }}
        </Boton>
      </form>
    </div>
  </ModalBase>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import * as z from 'zod';
import { useCuentas } from '../composables/useCuentas';
import { Mail as MailIcon, Lock as LockIcon, ShieldCheck } from 'lucide-vue-next';
import ModalBase from '@/core/components/ModalBase.vue';
import EncabezadoModal from './EncabezadoModal.vue';
import Entrada from '@/core/components/Entrada.vue';
import Boton from '@/core/components/Boton.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'goToRegister'): void;
  (e: 'success'): void;
}>();

type VistaModal = 'login' | 'vincular_google' | 'completar_password';
const vistaActual = ref<VistaModal>('login');

const googleBtnRef = ref<HTMLElement | null>(null);
const googleBotonMontado = ref(false);

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
  iniciarSesion,
  loginConGoogle,
  confirmarVinculacionGoogle,
  completarPasswordGoogle,
  limpiarErrores,
} = useCuentas();

function cerrarModal(valor: boolean): void {
  emit('update:modelValue', valor);
  if (!valor) {
    vistaActual.value = 'login';
    limpiarErrores();
    errorPasswordLocal.value = null;
    nuevaPassword.value = '';
    confirmarPassword.value = '';
  }
}

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
  limpiarErrores();
  const resultado = await iniciarSesion({ correo: values.correo, contrasena: values.contrasena });
  if (resultado) {
    emit('success');
    cerrarModal(false);
  }
});

async function procesarRespuestaGoogle(idToken: string) {
  const respuesta = await loginConGoogle(idToken);
  if (!respuesta) return;

  if (respuesta.tipo === 'login_exitoso') {
    emit('success');
    cerrarModal(false);
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
        text: 'signin_with',
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

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      void nextTick(() => {
        inicializarBotonGoogle();
      });
    }
  },
  { immediate: true }
);

/**
 * HU-CUE-02: Inicio y registro mediante Google Identity Services (Click directo o fallback)
 */
const loginWithGoogle = () => {
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

/**
 * Confirmación explícita de vinculación de cuenta existente (HU-CUE-02 / CA-CUE-02-02)
 */
const confirmarVinculacion = async () => {
  const resultado = await confirmarVinculacionGoogle(
    datosVinculacion.value.correo,
    datosVinculacion.value.googleId,
    true
  );

  if (resultado) {
    emit('success');
    cerrarModal(false);
  }
};

const cancelarVinculacion = () => {
  vistaActual.value = 'login';
  limpiarErrores();
};

/**
 * Registro de contraseña inicial tras alta con Google (HU-CUE-02 / RF-CUE-02-04)
 */
const guardarPasswordInicial = async () => {
  errorPasswordLocal.value = null;

  if (!nuevaPassword.value || nuevaPassword.value.length < 8) {
    errorPasswordLocal.value = 'La contraseña debe tener al menos 8 caracteres.';
    return;
  }

  if (!/[a-z]/.test(nuevaPassword.value)) {
    errorPasswordLocal.value = 'La contraseña debe incluir al menos una letra minúscula.';
    return;
  }

  if (!/[A-Z]/.test(nuevaPassword.value)) {
    errorPasswordLocal.value = 'La contraseña debe incluir al menos una letra mayúscula.';
    return;
  }

  if (!/[0-9]/.test(nuevaPassword.value)) {
    errorPasswordLocal.value = 'La contraseña debe incluir al menos un número.';
    return;
  }

  if (nuevaPassword.value !== confirmarPassword.value) {
    errorPasswordLocal.value = 'Las contraseñas no coinciden.';
    return;
  }

  const resultado = await completarPasswordGoogle(
    datosPassword.value.correo,
    nuevaPassword.value
  );

  if (resultado) {
    emit('success');
    cerrarModal(false);
  }
};
</script>
