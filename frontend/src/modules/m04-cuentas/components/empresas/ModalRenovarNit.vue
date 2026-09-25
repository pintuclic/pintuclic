<template>
  <Modal
    :model-value="modelValue"
    maxWidth="md"
    title="Actualización de NIT"
    accent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="p-6">
      <!-- PANTALLA DE ÉXITO ESTÁNDAR DEL DESIGN SYSTEM (HU-CUE-10 / HU-CUE-09) -->
      <div v-if="exito" class="flex flex-col items-center text-center px-2 py-4">
        <div class="w-20 h-20 bg-highlight/15 rounded-full flex items-center justify-center mb-5 border-2 border-highlight/30">
          <ClockIcon class="w-10 h-10 text-corporate" />
        </div>

        <h2 class="text-2xl font-title font-bold text-corporate mb-2">
          ¡Solicitud de renovación radicada!
        </h2>

        <p class="text-neutral-medium text-sm max-w-sm mb-6 leading-relaxed">
          Hemos recibido su solicitud de actualización de NIT. Su NIT actual continuará vigente para operaciones y compras hasta que el administrador verifique el soporte del RUT.
        </p>

        <!-- Tarjeta resumen con datos de radicación -->
        <div class="w-full bg-neutral-lightest border border-neutral-light rounded-xl p-4 text-left mb-6 space-y-2.5 text-xs">
          <div class="flex justify-between items-center py-1 border-b border-neutral-light/60">
            <span class="text-neutral-medium">Nuevo NIT solicitado:</span>
            <span class="font-semibold text-corporate font-mono">{{ form.nitNuevo }}</span>
          </div>
          <div class="flex justify-between items-center py-1 border-b border-neutral-light/60">
            <span class="text-neutral-medium">Soporte RUT adjunto:</span>
            <span class="font-medium text-action truncate max-w-[200px]" :title="form.documentoAdjuntoUrl">
              {{ form.documentoAdjuntoUrl }}
            </span>
          </div>
          <div class="flex justify-between items-center py-1">
            <span class="text-neutral-medium">Estado inicial:</span>
            <span class="inline-flex items-center gap-1 font-semibold text-corporate bg-highlight/25 px-2.5 py-0.5 rounded-full text-[11px]">
              <ClockIcon class="w-3 h-3 text-corporate" /> En revisión administrativa
            </span>
          </div>
        </div>

        <div class="p-3 bg-subaction/40 border border-action/20 rounded-xl text-xs text-corporate text-left mb-6 flex gap-2.5 items-start">
          <MailIcon class="w-4 h-4 text-action shrink-0 mt-0.5" />
          <p>
            Le notificaremos la decisión del administrador a su correo empresarial registrado.
          </p>
        </div>

        <Button variant="corporate" size="full" @click="onFinalizarExito">
          ¡Entendido, volver a mi perfil!
        </Button>
      </div>

      <div v-else>
        <div class="mb-5">
          <h3 class="text-lg font-title font-semibold text-corporate mb-1">Solicitar Renovación de NIT</h3>
          <p class="text-sm text-neutral-medium">
            Para actualizar el NIT de su empresa, digite el nuevo número y adjunte el documento de renovación del RUT o Cámara de Comercio. Su NIT actual permanecerá activo hasta que el administrador dictamine la solicitud.
          </p>
        </div>

        <div
          v-if="error"
          class="mb-4 p-3 rounded-xl bg-danger-subtle border border-danger/30 text-sm font-medium text-danger text-center"
        >
          {{ error }}
        </div>

        <form @submit.prevent="onSubmit" class="space-y-4">
          <div class="min-w-0 w-full flex flex-col gap-1.5 font-sans">
            <label for="nitNuevo" class="text-sm font-medium text-neutral-dark">
              Nuevo NIT o RUT
            </label>
            <input
              id="nitNuevo"
              v-model="form.nitNuevo"
              type="text"
              placeholder="Ej: 901234567-8"
              class="w-full min-w-0 px-4 py-3 text-base sm:text-sm rounded-lg border outline-none transition-colors duration-200 font-sans border-neutral-light focus:border-action bg-neutral-white"
              :class="{ 'border-danger focus:border-danger bg-danger/5': errores.nitNuevo }"
            />
            <span v-if="errores.nitNuevo" class="text-sm text-danger font-medium">
              {{ errores.nitNuevo }}
            </span>
          </div>

          <div class="min-w-0 w-full flex flex-col gap-1.5 font-sans">
            <label for="documentoAdjuntoUrl" class="text-sm font-medium text-neutral-dark">
              Enlace al Soporte RUT (PDF / Documento)
            </label>
            <input
              id="documentoAdjuntoUrl"
              v-model="form.documentoAdjuntoUrl"
              type="text"
              placeholder="https://documentos.empresa.com/rut_actualizado.pdf"
              class="w-full min-w-0 px-4 py-3 text-base sm:text-sm rounded-lg border outline-none transition-colors duration-200 font-sans border-neutral-light focus:border-action bg-neutral-white"
              :class="{ 'border-danger focus:border-danger bg-danger/5': errores.documentoAdjuntoUrl }"
            />
            <span v-if="errores.documentoAdjuntoUrl" class="text-sm text-danger font-medium">
              {{ errores.documentoAdjuntoUrl }}
            </span>
            <p class="text-xs text-neutral-medium mt-1">
              Indique el enlace seguro donde el administrador pueda auditar el RUT vigente.
            </p>
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
              {{ cargando ? 'Radicando...' : 'Radicar solicitud' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Modal, Button } from '@/core/components';
import { Clock as ClockIcon, Mail as MailIcon } from 'lucide-vue-next';
import { renovarNitSchema } from '../../dtos/renovar-nit.dto';
import { CuentasService } from '../../services/cuentas.service';
import { useAuthStore } from '../../store/auth.store';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const authStore = useAuthStore();
const form = reactive({
  nitNuevo: '',
  documentoAdjuntoUrl: '',
});

const errores = reactive<{
  nitNuevo?: string;
  documentoAdjuntoUrl?: string;
}>({});

const cargando = ref(false);
const error = ref<string | null>(null);
const exito = ref(false);

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      form.nitNuevo = '';
      form.documentoAdjuntoUrl = '';
      limpiarAlertas();
    }
  }
);

function limpiarAlertas(): void {
  error.value = null;
  exito.value = false;
  errores.nitNuevo = undefined;
  errores.documentoAdjuntoUrl = undefined;
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

  const validacion = renovarNitSchema.safeParse(form);
  if (!validacion.success) {
    for (const issue of validacion.error.issues) {
      const campo = issue.path[0] as keyof typeof errores;
      if (campo) errores[campo] = issue.message;
    }
    return;
  }

  cargando.value = true;
  try {
    await CuentasService.solicitarRenovacionNit({
      nitNuevo: form.nitNuevo,
      documentoAdjuntoUrl: form.documentoAdjuntoUrl,
    });

    const idUsuario = authStore.user?.id_usuario;
    if (idUsuario) {
      const registroNit = {
        nit_nuevo: form.nitNuevo.trim(),
        documento_adjunto_url: form.documentoAdjuntoUrl.trim(),
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString(),
      };
      localStorage.setItem(`pintuclic_solicitud_nit_${idUsuario}`, JSON.stringify(registroNit));
    }

    exito.value = true;
  } catch (err: unknown) {
    const errObj = err as { response?: { data?: { error?: { message?: string } } } };
    error.value =
      errObj.response?.data?.error?.message ||
      'No fue posible radicar la solicitud de renovación de NIT.';
  } finally {
    cargando.value = false;
  }
}
</script>
