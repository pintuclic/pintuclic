<template>
  <div class="flex flex-col gap-5">
    <div class="text-center">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-subaction flex items-center justify-center text-corporate">
        <ShieldCheck class="w-6 h-6" />
      </div>
      <h2 class="text-xl font-title font-semibold text-corporate mb-2">Vincular cuenta con Google</h2>
      <p class="text-neutral-medium text-sm">
        Ya existe una cuenta en Pintuclic registrada con el correo:
      </p>
      <p class="font-semibold text-corporate mt-1 text-base">
        {{ correo }}
      </p>
    </div>

    <div class="p-3.5 bg-neutral-lightest border border-neutral-light rounded-lg text-sm text-neutral-dark">
      ¿Deseas vincular tu acceso de Google a tu cuenta actual? Podrás iniciar sesión indistintamente con tu contraseña o con Google.
    </div>

    <div v-if="errorMensaje" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
      {{ errorMensaje }}
    </div>

    <div class="flex flex-col gap-3 mt-2">
      <Button variant="corporate" size="full" :disabled="cargando" @click="$emit('confirmar')">
        {{ cargando ? 'Vinculando...' : 'Sí, vincular cuenta' }}
      </Button>
      <Button variant="outline" size="full" :disabled="cargando" @click="$emit('cancelar')">
        Cancelar
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next';
import { Button } from '@/core/components';

defineProps<{
  correo: string;
  cargando: boolean;
  errorMensaje?: string | null;
}>();

defineEmits<{
  (e: 'confirmar'): void;
  (e: 'cancelar'): void;
}>();
</script>
