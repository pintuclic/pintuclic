<template>
  <ModalBase :modelValue="modelValue" @update:modelValue="handleCerrar" maxWidth="md" accent>
    <div class="flex flex-col h-full relative">
      <!-- El componente ModalBase ya nos da un padding y estructura, 
           así que renderizamos directamente el contenido del paso aquí -->
      <EncabezadoModal 
        :titulo="titulosPasos[pasoActual]"
        :mostrar-atras="pasoActual > 0 && pasoActual < 3"
        @cerrar="handleCerrar"
        @atras="handleAtras"
      />
      
      <!-- Stepper Header -->
      <div class="pt-2 pb-6">
        <PasosProgreso v-if="pasoActual > 0 && pasoActual < 3" :paso-actual="pasoActual" :total-pasos="3" :etiquetas="['', 'Verificación', 'Nueva Pass']" />
      </div>

      <div class="flex-1">
        <PasoRecuperarCorreo 
          v-if="pasoActual === 0" 
          @solicitado="handleCorreoSolicitado" 
        />
        <PasoRecuperarOTP 
          v-else-if="pasoActual === 1" 
          :correo="correoGuardado"
          @verificado="handleCodigoVerificado" 
        />
        <PasoRecuperarNuevaPass 
          v-else-if="pasoActual === 2" 
          :correo="correoGuardado"
          :codigo="codigoGuardado"
          @completado="handleCompletado" 
        />
        
        <div v-if="pasoActual === 3" class="text-center py-2">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon class="w-8 h-8 text-green-600" />
          </div>
          <h3 class="text-xl font-bold text-corporate mb-2">¡Contraseña restablecida!</h3>
          <p class="text-neutral-medium mb-6">Tu contraseña ha sido cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.</p>
          <button type="button" @click="$emit('openLogin')" class="w-full bg-action hover:bg-[#007BFF] text-white py-2.5 rounded-lg font-semibold transition-colors cursor-pointer">
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  </ModalBase>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ModalBase from '@/core/components/ModalBase.vue';
import EncabezadoModal from './EncabezadoModal.vue';
import PasosProgreso from './PasosProgreso.vue';
import PasoRecuperarCorreo from './PasoRecuperarCorreo.vue';
import PasoRecuperarOTP from './PasoRecuperarOTP.vue';
import PasoRecuperarNuevaPass from './PasoRecuperarNuevaPass.vue';
import { Check as CheckIcon } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'openLogin': [];
}>();

const pasoActual = ref(0);
const correoGuardado = ref('');
const codigoGuardado = ref('');

const titulosPasos = [
  'Recuperar Contraseña',
  'Verifica tu identidad',
  'Crea una nueva contraseña',
  ''
];

const handleCerrar = () => {
  emit('update:modelValue', false);
  setTimeout(() => {
    pasoActual.value = 0;
    correoGuardado.value = '';
    codigoGuardado.value = '';
  }, 300);
};

const handleAtras = () => {
  if (pasoActual.value > 0 && pasoActual.value < 3) {
    pasoActual.value--;
  }
};

const handleCorreoSolicitado = (correo: string) => {
  correoGuardado.value = correo;
  pasoActual.value = 1;
};

const handleCodigoVerificado = (codigo: string) => {
  codigoGuardado.value = codigo;
  pasoActual.value = 2;
};

const handleCompletado = () => {
  pasoActual.value = 3;
};
</script>
