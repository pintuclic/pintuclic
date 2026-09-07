<template>
  <ModalBase :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" maxWidth="lg" accent>
    <PasoDatos
      v-if="paso === 1"
      @ir-a-login="$emit('irALogin')"
      @datos-listos="onDatosListos"
      @registro-google-exitoso="onRegistroGoogleExitoso"
    />
    <PasoVerificacion
      v-else-if="paso === 2"
      :correo="correoRegistro"
      @verificado="paso = 3"
      @volver="paso = 1"
    />
    <PasoListo
      v-else
      :tipo-cuenta="tipoCuenta"
      @finalizar="onFinalizar"
    />
  </ModalBase>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ModalBase from '@/core/components/ModalBase.vue';
import PasoDatos from './PasoDatos.vue';
import PasoVerificacion from './PasoVerificacion.vue';
import PasoListo from './PasoListo.vue';
import type { TipoCuentaRegistro } from '../interfaces/registro.interface';

/**
 * Contenedor del flujo de registro de 3 pasos (Datos → Verificación → Listo).
 *
 * Responsabilidad única: mantener en qué paso va el usuario y los datos que
 * un paso necesita pasarle al siguiente (tipo de cuenta, correo). No sabe
 * nada del contenido de ningún paso — cada PasoX.vue es responsable de sí
 * mismo y no conoce que existen los otros dos.
 *
 * Es un solo ModalBase (con accent) que persiste abierto mientras cambia el
 * contenido interno, en vez de 3 modales que se cierran y abren entre sí:
 * elimina el parpadeo entre pasos y hace estructuralmente imposible que un
 * paso "olvide" la franja de marca, como pasaba antes con ModalCuentaCreada.
 *
 * Nombrado como "wizard" genérico y no como "registro" a propósito: el mismo
 * patrón (ModalBase único + estado de paso + PasosProgreso) sirve para otros
 * flujos multi-paso que ya se identificaron (p. ej. aprobación de cuenta
 * empresa), sin tener que inventarlo de nuevo cuando llegue ese momento.
 */
defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  irALogin: [];
  exito: [tipo: TipoCuentaRegistro];
}>();

const paso = ref<1 | 2 | 3>(1);
const tipoCuenta = ref<TipoCuentaRegistro>('natural');
const correoRegistro = ref('');

function onDatosListos(tipo: TipoCuentaRegistro, correo: string) {
  tipoCuenta.value = tipo;
  correoRegistro.value = correo;
  paso.value = 2;
}

function onRegistroGoogleExitoso(correo: string) {
  tipoCuenta.value = 'natural';
  correoRegistro.value = correo;
  paso.value = 3;
}

function onFinalizar() {
  emit('update:modelValue', false);
  emit('exito', tipoCuenta.value);
  // Se reinicia para la próxima vez que se abra el wizard desde cero.
  paso.value = 1;
}
</script>
