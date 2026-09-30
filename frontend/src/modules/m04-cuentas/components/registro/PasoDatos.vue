<template>
  <EncabezadoModal />
  <PasosProgreso :pasos="['Datos', 'Verificación', 'Listo']" :paso-actual="1" />

  <!-- 1. VISTA ESTÁNDAR: FORMULARIO DE REGISTRO -->
  <div v-if="vistaActual === 'formulario'">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-title font-semibold text-corporate mb-2">Crear cuenta</h2>
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
    <FormRegistroNatural
      v-if="activeTab === 'natural'"
      :cargando="cargando"
      :error-mensaje="errorMensaje"
      @submit="onRegistroNaturalSubmit"
      @google-success="procesarRespuestaGoogle"
      @google-error="(msg) => (errorMensaje = msg)"
    />

    <!-- Formulario Empresa -->
    <FormRegistroEmpresa
      v-else
      :cargando="cargando"
      :error-mensaje="errorMensaje"
      @submit="onRegistroEmpresaSubmit"
    />
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
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EncabezadoModal from '../comunes/EncabezadoModal.vue';
import { PasosProgreso } from '@/core/components';
import type {
  TipoCuentaRegistro,
  RegistroNaturalPayload,
  RegistroEmpresaPayload,
} from '@/modules/m04-cuentas/interfaces/registro.interface';
import { useCuentas } from '@/modules/m04-cuentas/composables/useCuentas';
import FormRegistroNatural from './FormRegistroNatural.vue';
import FormRegistroEmpresa from './FormRegistroEmpresa.vue';
import PantallaVincularGoogle from '../auth/PantallaVincularGoogle.vue';
import PantallaCompletarPasswordGoogle from '../auth/PantallaCompletarPasswordGoogle.vue';

const emit = defineEmits<{
  irALogin: [];
  datosListos: [tipo: TipoCuentaRegistro, correo: string, password?: string];
  registroGoogleExitoso: [correo: string];
}>();

type VistaSubmodulo = 'formulario' | 'vincular_google' | 'completar_password';
const vistaActual = ref<VistaSubmodulo>('formulario');
const activeTab = ref<TipoCuentaRegistro>('natural');

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
  registrarParticular,
  registrarEmpresa,
  loginConGoogle,
  confirmarVinculacionGoogle,
  completarPasswordGoogle,
  limpiarErrores,
} = useCuentas();

async function onRegistroNaturalSubmit(payload: RegistroNaturalPayload): Promise<void> {
  limpiarErrores();
  const res = await registrarParticular(payload);
  if (res) {
    emit('datosListos', 'natural', payload.correo, payload.contrasena);
  }
}

async function onRegistroEmpresaSubmit(payload: RegistroEmpresaPayload): Promise<void> {
  limpiarErrores();
  const res = await registrarEmpresa(payload);
  if (res) {
    emit('datosListos', 'empresa', payload.correo_empresarial);
  }
}

async function procesarRespuestaGoogle(idToken: string): Promise<void> {
  const respuesta = await loginConGoogle(idToken);
  if (!respuesta) return;

  if (respuesta.tipo === 'login_exitoso') {
    emit('registroGoogleExitoso', respuesta.correo);
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

async function confirmarVinculacion(): Promise<void> {
  const resultado = await confirmarVinculacionGoogle(
    datosVinculacion.value.correo,
    datosVinculacion.value.googleId,
    true
  );
  if (resultado) {
    emit('registroGoogleExitoso', datosVinculacion.value.correo);
  }
}

function cancelarVinculacion(): void {
  vistaActual.value = 'formulario';
  limpiarErrores();
}

async function guardarPasswordInicial(password: string): Promise<void> {
  const resultado = await completarPasswordGoogle(
    datosPassword.value.correo,
    password
  );
  if (resultado) {
    emit('registroGoogleExitoso', datosPassword.value.correo);
  }
}
</script>
