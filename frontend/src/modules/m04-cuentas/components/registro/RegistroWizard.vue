<template>
  <Modal
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
    maxWidth="lg"
    accent
  >
    <PasoDatos
      v-if="paso === 1"
      @ir-a-login="onIrALogin"
      @datos-listos="onDatosListos"
      @registro-google-exitoso="onRegistroGoogleExitoso"
    />
    <PasoVerificacion
      v-else-if="paso === 2"
      :correo="correoRegistro"
      @verificado="onVerificado"
      @volver="paso = 1"
    />
    <PasoListo v-else :tipo-cuenta="tipoCuenta" @finalizar="onFinalizar" />
  </Modal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Modal } from "@/core/components";
import PasoDatos from "./PasoDatos.vue";
import PasoVerificacion from "./PasoVerificacion.vue";
import PasoListo from "./PasoListo.vue";
import type { TipoCuentaRegistro } from "@/modules/m04-cuentas/interfaces/registro.interface";
import { useCuentas } from "@/modules/m04-cuentas/composables/useCuentas";

defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  irALogin: [];
  goToLogin: [];
  exito: [tipo: TipoCuentaRegistro];
  success: [tipo: TipoCuentaRegistro];
}>();

const { iniciarSesion } = useCuentas();

const paso = ref<1 | 2 | 3>(1);
const tipoCuenta = ref<TipoCuentaRegistro>("natural");
const correoRegistro = ref("");
const passwordRegistro = ref("");

function onDatosListos(tipo: TipoCuentaRegistro, correo: string, password?: string) {
  tipoCuenta.value = tipo;
  correoRegistro.value = correo;
  passwordRegistro.value = password || "";
  paso.value = 2;
}

function onRegistroGoogleExitoso(correo: string) {
  tipoCuenta.value = "natural";
  correoRegistro.value = correo;
  paso.value = 3;
}

async function onVerificado() {
  // Para cuenta particular con contraseña registrada, iniciar sesión inmediatamente
  if (tipoCuenta.value === "natural" && passwordRegistro.value) {
    try {
      await iniciarSesion({
        correo: correoRegistro.value,
        contrasena: passwordRegistro.value,
      });
    } catch (err) {
      console.warn("Auto-login posterior a la verificación falló:", err);
    }
  }
  paso.value = 3;
}

function onIrALogin() {
  emit("irALogin");
  emit("goToLogin");
}

function onFinalizar() {
  emit("update:modelValue", false);
  emit("exito", tipoCuenta.value);
  emit("success", tipoCuenta.value);
  // Se reinicia para la próxima vez que se abra el wizard desde cero.
  paso.value = 1;
  passwordRegistro.value = "";
}
</script>
