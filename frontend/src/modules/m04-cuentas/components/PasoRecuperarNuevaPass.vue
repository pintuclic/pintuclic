<template>
  <div>
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-corporate mb-2">Restablecer contraseña</h2>
      <p class="text-neutral-medium text-sm">Crea una nueva contraseña segura para tu cuenta</p>
    </div>

    <form @submit="onSubmit" class="space-y-4">
      <div>
        <Entrada
          name="contrasena_nueva"
          label="Nueva Contraseña"
          type="password"
          placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número"
          :icon="LockIcon"
        />
        <span class="text-xs text-neutral-medium block mt-1">Mínimo 8 caracteres, con al menos una mayúscula y un número.</span>
      </div>

      <!-- Error Global -->
      <div v-if="errorMsg" class="bg-red-50 text-conversion text-sm p-3 rounded-lg flex items-start gap-2 mt-2">
        <AlertCircleIcon class="w-5 h-5 shrink-0" />
        <p>{{ errorMsg }}</p>
      </div>

      <Button type="submit" variant="primary" size="full" class="mt-6" :disabled="isSubmitting">
        {{ isSubmitting ? 'Guardando...' : 'Guardar contraseña' }}
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { Lock as LockIcon, AlertCircle as AlertCircleIcon } from 'lucide-vue-next';
import { CuentasService } from '../services/cuentas.service';
import Boton from '@/core/components/buttons/Button.vue';
import Entrada from '@/core/components/forms/Input.vue';

const props = defineProps<{
  correo: string;
  codigo: string;
}>();

const emit = defineEmits<{
  'completado': [];
}>();

const errorMsg = ref('');

const schema = toTypedSchema(
  z.object({
    contrasena_nueva: z.string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'Debe tener mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número')
  })
);

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
});

const onSubmit = handleSubmit(async (values) => {
  errorMsg.value = '';
  try {
    await CuentasService.confirmarRecuperacion(props.correo, props.codigo, values.contrasena_nueva);
    emit('completado');
  } catch (error: any) {
    errorMsg.value = error.response?.data?.mensaje || 'Error al cambiar la contraseña. El código puede ser inválido o haber expirado.';
  }
});
</script>
