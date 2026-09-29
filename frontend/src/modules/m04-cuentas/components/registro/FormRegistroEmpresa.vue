<template>
  <form @submit="onSubmit" class="flex flex-col gap-4">
    <Input name="nombre_empresa" label="Nombre Empresa" placeholder="Ej. Pinturas S.A.S" />
    <Input name="nombre_representante" label="Nombre del representante legal" placeholder="Ej. María Gómez" />
    <Input name="correo_empresarial" label="Correo corporativo" type="email" placeholder="contacto@empresa.com" :icon="MailIcon" />
    <Input name="telefono" label="Teléfono (WhatsApp)" placeholder="300 000 0000" :icon="PhoneIcon" />
    <Input name="nit" label="NIT" placeholder="900.000.000-1" />
    <div class="flex flex-col gap-1">
      <Input name="contrasena" label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" :icon="LockIcon" />
      <span class="text-xs text-neutral-medium">Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.</span>
    </div>

    <div>
      <Checkbox v-model="aceptaTerminos" id="termsEmpresa" required class="mt-1 cursor-pointer">
        <span class="text-xs text-neutral-medium">
          Acepto los <a href="#" @click.prevent.stop class="text-action hover:underline">Términos y Condiciones</a> y la
          <a href="#" @click.prevent.stop class="text-action hover:underline">Política de Tratamiento de Datos</a>.
        </span>
      </Checkbox>
      <span v-if="errorTerminos" class="text-xs text-danger font-medium mt-1 block">
        {{ errorTerminos }}
      </span>
    </div>

    <div v-if="errorMensaje" class="text-sm text-center font-medium text-corporate bg-subaction border border-action/30 p-2.5 rounded-md">
      {{ errorMensaje }}
    </div>

    <Button type="submit" variant="corporate" size="full" class="mt-2" :disabled="cargando">
      {{ cargando ? 'Cargando...' : 'Continuar' }}
    </Button>
  </form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { Mail as MailIcon, Lock as LockIcon, Phone as PhoneIcon } from 'lucide-vue-next';
import { Input, Button, Checkbox } from '@/core/components';
import { registroEmpresaSchema } from '@/modules/m04-cuentas/dtos';
import type { RegistroEmpresaPayload } from '@/modules/m04-cuentas/interfaces/registro.interface';

defineProps<{
  cargando: boolean;
  errorMensaje?: string | null;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: RegistroEmpresaPayload): void;
}>();

const aceptaTerminos = ref(false);
const errorTerminos = ref('');

watch(aceptaTerminos, (val) => {
  if (val) {
    errorTerminos.value = '';
  }
});

const schema = toTypedSchema(registroEmpresaSchema);
const { handleSubmit } = useForm({ validationSchema: schema });

const onSubmit = handleSubmit((values) => {
  if (!aceptaTerminos.value) {
    errorTerminos.value = 'Debes aceptar los Términos y Condiciones para continuar.';
    return;
  }
  errorTerminos.value = '';
  emit('submit', {
    nombre_empresa: values.nombre_empresa,
    nombre_representante: values.nombre_representante,
    correo_empresarial: values.correo_empresarial,
    telefono: values.telefono,
    nit: values.nit,
    contrasena: values.contrasena,
  });
});
</script>
