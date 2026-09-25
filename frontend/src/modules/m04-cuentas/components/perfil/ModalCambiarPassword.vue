<template>
  <Modal
    :model-value="modelValue"
    maxWidth="md"
    title="Cambiar Contraseña"
    accent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="p-6">
      <!-- PANTALLA DE ÉXITO ESTÁNDAR DEL DESIGN SYSTEM (HU-SEG-01 / HU-CUE-06) -->
      <div v-if="exito" class="flex flex-col items-center text-center px-2 py-4">
        <div class="w-20 h-20 bg-conversion/15 rounded-full flex items-center justify-center mb-5 border-2 border-conversion/30">
          <ShieldCheckIcon class="w-10 h-10 text-conversion" />
        </div>

        <h2 class="text-2xl font-title font-bold text-corporate mb-2">
          ¡Contraseña actualizada con éxito!
        </h2>

        <p class="text-neutral-medium text-sm max-w-sm mb-6 leading-relaxed">
          Su contraseña de acceso ha sido modificada de manera segura.
        </p>

        <div class="w-full p-3.5 bg-subaction/40 border border-action/20 rounded-xl text-xs text-corporate text-left mb-6 flex gap-2.5 items-start">
          <InfoIcon class="w-4 h-4 text-action shrink-0 mt-0.5" />
          <p>
            Recuerde utilizar su nueva contraseña para iniciar sesión en sus otros dispositivos.
          </p>
        </div>

        <Button variant="corporate" size="full" @click="onFinalizarExito">
          ¡Entendido, volver a mi perfil!
        </Button>
      </div>

      <div v-else>
        <div class="mb-5">
          <h3 class="text-lg font-title font-semibold text-corporate mb-1">Actualizar Credenciales</h3>
          <p class="text-sm text-neutral-medium">
            Ingrese su contraseña actual y defina una nueva contraseña segura para proteger su cuenta.
          </p>
        </div>

        <div
          v-if="error"
          class="mb-4 p-3 rounded-xl bg-danger-subtle border border-danger/30 text-sm font-medium text-danger text-center"
        >
          {{ error }}
        </div>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <div>
            <Input
              v-model="form.contrasenaActual"
              type="password"
              label="Contraseña Actual"
              placeholder="••••••••"
              required
              :error="errores.contrasenaActual"
            />
          </div>

          <div>
            <Input
              v-model="form.contrasenaNueva"
              type="password"
              label="Nueva Contraseña"
              placeholder="Mínimo 8 caracteres, mayúscula, número"
              required
              :error="errores.contrasenaNueva"
            />
          </div>

          <div>
            <Input
              v-model="form.confirmarContrasena"
              type="password"
              label="Confirmar Nueva Contraseña"
              placeholder="Repita la nueva contraseña"
              required
              :error="errores.confirmarContrasena"
            />
          </div>

          <div class="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="neutral"
              size="md"
              :disabled="cargando"
              @click="cerrar"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="corporate"
              size="md"
              :disabled="cargando"
            >
              {{ cargando ? 'Actualizando...' : 'Guardar contraseña' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Modal, Input, Button } from '@/core/components';
import { ShieldCheck as ShieldCheckIcon, Info as InfoIcon } from 'lucide-vue-next';
import { cambiarPasswordSchema } from '../../dtos/cambiar-password.dto';
import { CuentasService } from '../../services/cuentas.service';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const form = reactive({
  contrasenaActual: '',
  contrasenaNueva: '',
  confirmarContrasena: '',
});

const errores = reactive<{
  contrasenaActual?: string;
  contrasenaNueva?: string;
  confirmarContrasena?: string;
}>({});

const cargando = ref(false);
const error = ref<string | null>(null);
const exito = ref(false);

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      form.contrasenaActual = '';
      form.contrasenaNueva = '';
      form.confirmarContrasena = '';
      limpiarAlertas();
    }
  }
);

function limpiarAlertas(): void {
  error.value = null;
  exito.value = false;
  errores.contrasenaActual = undefined;
  errores.contrasenaNueva = undefined;
  errores.confirmarContrasena = undefined;
}

function cerrar(): void {
  emit('update:modelValue', false);
}

function onFinalizarExito(): void {
  emit('success');
  cerrar();
}

async function onSubmit(): Promise<void> {
  limpiarAlertas();

  const validacion = cambiarPasswordSchema.safeParse(form);
  if (!validacion.success) {
    for (const issue of validacion.error.issues) {
      const campo = issue.path[0] as keyof typeof errores;
      if (campo) errores[campo] = issue.message;
    }
    return;
  }

  cargando.value = true;
  try {
    await CuentasService.cambiarPassword({
      contrasenaActual: form.contrasenaActual,
      contrasenaNueva: form.contrasenaNueva,
    });
    exito.value = true;
  } catch (err: unknown) {
    const errObj = err as { response?: { data?: { error?: { message?: string } } } };
    error.value =
      errObj.response?.data?.error?.message ||
      'No fue posible cambiar la contraseña. Verifique que la contraseña actual sea correcta.';
  } finally {
    cargando.value = false;
  }
}
</script>
