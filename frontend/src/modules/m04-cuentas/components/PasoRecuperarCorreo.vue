<template>
  <div>
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-corporate mb-2">Restablecer contraseña</h2>
      <p class="text-neutral-medium text-sm">
        Ingresa tu correo para recibir un código de recuperación
      </p>
    </div>

    <form @submit="onSubmit" class="space-y-4">
      <Input
        name="correo"
        label="Correo Electrónico"
        type="email"
        placeholder="ejemplo@correo.com"
        :icon="MailIcon"
      />

      <!-- Error Global -->
      <div v-if="errorMsg" class="bg-red-50 text-conversion text-sm p-3 rounded-lg flex items-start gap-2 mt-2">
        <AlertCircleIcon class="w-5 h-5 shrink-0" />
        <p>{{ errorMsg }}</p>
      </div>

      <Button type="submit" variant="primary" size="full" class="mt-6" :disabled="isSubmitting">
        {{ isSubmitting ? 'Procesando...' : 'Enviar código' }}
      </Button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { Mail as MailIcon, AlertCircle as AlertCircleIcon } from 'lucide-vue-next';
import { CuentasService } from '../services/cuentas.service';
import Button from '@/core/components/buttons/Button.vue';
import Input from '@/core/components/forms/Input.vue';

const emit = defineEmits<{
  'solicitado': [correo: string];
}>();

const errorMsg = ref('');

const schema = toTypedSchema(
  z.object({
    correo: z.string({ required_error: 'El correo es obligatorio' })
      .email('Formato de correo inválido')
      .toLowerCase()
      .trim()
  })
);

const { handleSubmit, isSubmitting } = useForm({
  validationSchema: schema,
});

const onSubmit = handleSubmit(async (values) => {
  errorMsg.value = '';
  try {
    await CuentasService.solicitarRecuperacion(values.correo);
    emit('solicitado', values.correo);
  } catch (error: any) {
    errorMsg.value = error.response?.data?.mensaje || 'Ocurrió un error al solicitar la recuperación.';
  }
});
</script>
