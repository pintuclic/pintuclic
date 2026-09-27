<template>
  <EncabezadoModal />
  <PasosProgreso :pasos="['Datos', 'Verificación', 'Listo']" :paso-actual="3" />

  <div class="flex flex-col items-center text-center px-4 pb-2">
    <div class="w-20 h-20 bg-conversion-accent/10 rounded-full flex items-center justify-center mb-6">
      <CheckIcon class="w-10 h-10 text-conversion-accent" />
    </div>

    <h2 class="text-2xl font-bold text-corporate mb-3">¡Cuenta creada con éxito!</h2>

    <p v-if="tipoCuenta === 'natural'" class="text-neutral-medium text-sm mb-8">
      Tu registro se ha completado correctamente. Ya puedes acceder a todas nuestras funciones y comprar fácil y rápido.
    </p>
    <p v-else class="text-neutral-medium text-sm mb-8">
      Hemos recibido tu solicitud de cuenta empresarial. <strong>Un administrador revisará tus datos</strong> y te notificaremos cuando esté activa.
    </p>

    <Button variant="corporate" size="full" @click="$emit('finalizar')">
      ¡Entendido, ir a inicio!
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Check as CheckIcon } from 'lucide-vue-next';
<<<<<<< HEAD:frontend/src/modules/m04-cuentas/components/PasoListo.vue
import EncabezadoModal from './EncabezadoModal.vue';
import PasosProgreso from './PasosProgreso.vue';
import { Button } from '@/core/components';
import type { TipoCuentaRegistro } from '../interfaces/registro.interface';
=======
import EncabezadoModal from '../comunes/EncabezadoModal.vue';
import { Button, PasosProgreso } from '@/core/components';
import type { TipoCuentaRegistro } from '@/modules/m04-cuentas/interfaces/registro.interface';
>>>>>>> 2ef493460a3531eb1ba1a145750138bfc779fc55:frontend/src/modules/m04-cuentas/components/registro/PasoListo.vue

defineProps<{
  tipoCuenta: TipoCuentaRegistro;
}>();

defineEmits<{
  finalizar: [];
}>();
</script>

