<template>
  <div class="flex flex-col gap-5">
    <div class="text-center">
      <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-subaction flex items-center justify-center text-corporate">
        <LockIcon class="w-6 h-6" />
      </div>
      <h2 class="text-xl font-title font-semibold text-corporate mb-2">Crea tu contraseña</h2>
      <p class="text-neutral-medium text-sm">
        Tu cuenta ha sido creada mediante Google. Por favor, digita una contraseña propia para contar con ambas vías de acceso.
      </p>
    </div>

    <form @submit.prevent="onGuardar" class="flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <Input
          v-model="nuevaPassword"
          type="password"
          label="Contraseña propia"
          placeholder="Mín. 8 caracteres, 1 mayúscula, 1 minúscula y 1 número"
        />
        <span class="text-xs text-neutral-medium">Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.</span>
      </div>

      <Input
        v-model="confirmarPassword"
        type="password"
        label="Confirmar contraseña"
        placeholder="Repite la contraseña"
      />

      <div v-if="errorPasswordLocal || errorMensaje" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
        {{ errorPasswordLocal || errorMensaje }}
      </div>

      <Button type="submit" variant="corporate" size="full" class="mt-2" :disabled="cargando">
        {{ cargando ? 'Guardando...' : 'Completar y acceder' }}
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Lock as LockIcon } from 'lucide-vue-next';
import { Input, Button } from '@/core/components';
import { validarContrasenaConConfirmacion } from '@/modules/m04-cuentas/dtos';

defineProps<{
  correo: string;
  cargando: boolean;
  errorMensaje?: string | null;
}>();

const emit = defineEmits<{
  (e: 'guardar', password: string): void;
}>();

const nuevaPassword = ref('');
const confirmarPassword = ref('');
const errorPasswordLocal = ref<string | null>(null);

function onGuardar(): void {
  errorPasswordLocal.value = validarContrasenaConConfirmacion(
    nuevaPassword.value,
    confirmarPassword.value
  );

  if (errorPasswordLocal.value) {
    return;
  }

  emit('guardar', nuevaPassword.value);
}
</script>
