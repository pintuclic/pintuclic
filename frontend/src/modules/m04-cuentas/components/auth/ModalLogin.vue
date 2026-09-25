<template>
  <Modal :modelValue="modelValue" @update:modelValue="cerrarModal" maxWidth="md" accent>
    <EncabezadoModal />

    <!-- 1. VISTA ESTÁNDAR: INICIO DE SESIÓN -->
    <div v-if="vistaActual === 'login'">
      <div class="text-center mb-8">
        <h2 class="text-2xl font-title font-semibold text-corporate mb-2">Iniciar sesión</h2>
        <p class="text-neutral-medium text-sm">Ingresa a tu cuenta para ver tus pedidos y ofertas</p>
      </div>

      <form @submit="onSubmit" class="flex flex-col gap-5">
        <Input
          name="correo"
          label="Correo electrónico"
          type="email"
          placeholder="ejemplo@correo.com"
          :icon="MailIcon"
        />

        <div class="flex flex-col gap-1.5">
          <Input
            name="contrasena"
            label="Contraseña"
            type="password"
            placeholder="Tu contraseña"
            :icon="LockIcon"
          />
          <div class="flex justify-end mt-1">
            <button
              type="button"
              class="text-sm font-semibold text-action hover:underline cursor-pointer"
              @click="$emit('goToRecover')"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        <div
          v-if="errorMensaje"
          class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md"
        >
          {{ errorMensaje }}
        </div>

        <Button type="submit" variant="corporate" size="full" class="mt-2" :disabled="cargando">
          {{ cargando ? 'Iniciando...' : 'Iniciar sesión' }}
        </Button>
      </form>

      <div class="mt-5">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-neutral-light"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-3 bg-white text-neutral-medium font-medium">O</span>
          </div>
        </div>

        <div class="mt-5">
          <BotonGoogleAuth
            ref="botonGoogleRef"
            text="signin_with"
            label="Iniciar sesión con Google"
            :disabled="cargando"
            @success="procesarRespuestaGoogle"
            @error="(msg) => (errorMensaje = msg)"
          />
        </div>
      </div>

      <div class="mt-8 text-center text-sm">
        <span class="text-neutral-medium">¿No tienes una cuenta? </span>
        <button @click="$emit('goToRegister')" class="font-semibold text-action hover:underline cursor-pointer">
          Regístrate
        </button>
      </div>
    </div>

    <!-- 2. VISTA HU-CUE-02: VINCULACIÓN CON CUENTA EXISTENTE -->
    <PantallaVincularGoogle
      v-else-if="vistaActual === 'vincular_google'"
      :correo="datosVinculacion.correo"
      :cargando="cargando"
      :error-mensaje="errorMensaje"
      @confirmar="confirmarVinculacion"
      @cancelar="cancelarVinculacion"
    />

    <!-- 3. VISTA HU-CUE-02: CREAR CONTRASEÑA PROPIA TRAS REGISTRO CON GOOGLE -->
    <PantallaCompletarPasswordGoogle
      v-else-if="vistaActual === 'completar_password'"
      :correo="datosPassword.correo"
      :cargando="cargando"
      :error-mensaje="errorMensaje"
      @guardar="guardarPasswordInicial"
    />
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { useCuentas } from '@/modules/m04-cuentas/composables/useCuentas';
import { loginSchema } from '@/modules/m04-cuentas/dtos';
import { Mail as MailIcon, Lock as LockIcon } from 'lucide-vue-next';
import { Modal, Input, Button } from '@/core/components';
import EncabezadoModal from '../comunes/EncabezadoModal.vue';
import BotonGoogleAuth from './BotonGoogleAuth.vue';
import PantallaVincularGoogle from './PantallaVincularGoogle.vue';
import PantallaCompletarPasswordGoogle from './PantallaCompletarPasswordGoogle.vue';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'goToRegister': [];
  'goToRecover': [];
  'success': [];
}>();

type VistaModal = 'login' | 'vincular_google' | 'completar_password';
const vistaActual = ref<VistaModal>('login');
const botonGoogleRef = ref<InstanceType<typeof BotonGoogleAuth> | null>(null);

const datosVinculacion = ref<{
  correo: string;
  googleId: string;
}>({
  correo: '',
  googleId: '',
});

const datosPassword = ref<{
  correo: string;
}>({
  correo: '',
});

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
  }
}

const schema = toTypedSchema(loginSchema);
const { handleSubmit } = useForm({ validationSchema: schema });

const onSubmit = handleSubmit(async (values) => {
  limpiarErrores();
  const resultado = await iniciarSesion({ correo: values.correo, contrasena: values.contrasena });
  if (resultado) {
    emit('success');
    cerrarModal(false);
  }
});

async function procesarRespuestaGoogle(idToken: string): Promise<void> {
  const respuesta = await loginConGoogle(idToken);
  if (!respuesta) return;

  if (respuesta.tipo === 'login_exitoso') {
    emit('success');
    cerrarModal(false);
  } else if (respuesta.tipo === 'sugerencia_vinculacion') {
    datosVinculacion.value = {
      correo: respuesta.correo,
      googleId: respuesta.datos_google?.googleId ?? '',
    };
    vistaActual.value = 'vincular_google';
  } else if (respuesta.tipo === 'requiere_password_inicial') {
    datosPassword.value = {
      correo: respuesta.correo,
    };
    vistaActual.value = 'completar_password';
  }
}

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      void nextTick(() => {
        botonGoogleRef.value?.montar();
      });
    }
  },
  { immediate: true }
);

async function confirmarVinculacion(): Promise<void> {
  const resultado = await confirmarVinculacionGoogle(
    datosVinculacion.value.correo,
    datosVinculacion.value.googleId,
    true
  );
  if (resultado) {
    emit('success');
    cerrarModal(false);
  }
}

function cancelarVinculacion(): void {
  vistaActual.value = 'login';
  limpiarErrores();
}

async function guardarPasswordInicial(password: string): Promise<void> {
  const resultado = await completarPasswordGoogle(
    datosPassword.value.correo,
    password
  );
  if (resultado) {
    emit('success');
    cerrarModal(false);
  }
}
</script>
