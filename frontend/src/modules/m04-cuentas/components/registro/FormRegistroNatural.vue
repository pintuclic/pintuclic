<template>
  <div>
    <form @submit="onSubmit" class="flex flex-col gap-4">
      <Input name="nombre" label="Nombre completo" placeholder="Ej. Juan Pérez" />
      <Input name="correo" label="Correo electrónico" type="email" placeholder="correo@ejemplo.com" :icon="MailIcon" />
      <Input name="telefono" label="Teléfono (WhatsApp)" placeholder="300 000 0000" :icon="PhoneIcon" />
      <div class="flex flex-col gap-1">
        <Input name="contrasena" label="Contraseña" type="password" placeholder="Mínimo 8 caracteres" :icon="LockIcon" />
        <span class="text-xs text-neutral-medium">Mínimo 8 caracteres, con al menos una mayúscula, una minúscula y un número.</span>
      </div>

      <div>
        <Checkbox v-model="aceptaTerminos" id="termsNatural" required class="mt-1 cursor-pointer">
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

    <div class="mt-5">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-neutral-light"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-3 bg-white text-neutral-medium font-medium">O</span>
        </div>
      </div>

      <div class="mt-5">
        <BotonGoogleAuth
          ref="botonGoogleRef"
          text="signup_with"
          label="Registrarse con Google"
          :disabled="cargando"
          @success="$emit('googleSuccess', $event)"
          @error="$emit('googleError', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue';
import { useForm } from 'vee-validate';
import { toTypedSchema } from '@vee-validate/zod';
import { Mail as MailIcon, Lock as LockIcon, Phone as PhoneIcon } from 'lucide-vue-next';
import { Input, Button, Checkbox } from '@/core/components';
import { registroNaturalSchema } from '@/modules/m04-cuentas/dtos';
import type { RegistroNaturalPayload } from '@/modules/m04-cuentas/interfaces/registro.interface';
import BotonGoogleAuth from '../auth/BotonGoogleAuth.vue';

defineProps<{
  cargando: boolean;
  errorMensaje?: string | null;
}>();

const emit = defineEmits<{
  (e: 'submit', payload: RegistroNaturalPayload): void;
  (e: 'googleSuccess', credential: string): void;
  (e: 'googleError', mensaje: string): void;
}>();

const botonGoogleRef = ref<InstanceType<typeof BotonGoogleAuth> | null>(null);

const aceptaTerminos = ref(false);
const errorTerminos = ref('');

watch(aceptaTerminos, (val) => {
  if (val) {
    errorTerminos.value = '';
  }
});

const schema = toTypedSchema(registroNaturalSchema);
const { handleSubmit } = useForm({ validationSchema: schema });

const onSubmit = handleSubmit((values) => {
  if (!aceptaTerminos.value) {
    errorTerminos.value = 'Debes aceptar los Términos y Condiciones para continuar.';
    return;
  }
  errorTerminos.value = '';
  emit('submit', {
    nombre: values.nombre,
    correo: values.correo,
    telefono: values.telefono,
    contrasena: values.contrasena,
  });
});

onMounted(() => {
  void nextTick(() => {
    botonGoogleRef.value?.montar();
  });
});
</script>
