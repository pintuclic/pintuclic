<template>
  <Modal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" titulo="Ascender a Cuenta Empresa" maxWidth="md">
    <template #descripcion>
      Por favor, completa los siguientes datos para solicitar la actualización de tu cuenta.
      Un administrador revisará tu solicitud.
    </template>

    <!-- PANTALLA DE ÉXITO ESTÁNDAR DEL DESIGN SYSTEM (HU-CUE-06 / HU-CUE-09) -->
    <div v-if="success" class="flex flex-col items-center text-center px-2 py-4">
      <div class="w-20 h-20 bg-highlight/15 rounded-full flex items-center justify-center mb-5 border-2 border-highlight/30">
        <ClockIcon class="w-10 h-10 text-corporate" />
      </div>

      <h2 class="text-2xl font-title font-bold text-corporate mb-2">
        ¡Solicitud radicada con éxito!
      </h2>

      <p class="text-neutral-medium text-sm max-w-sm mb-6 leading-relaxed">
        Hemos recibido su solicitud para ascender a <strong>Cliente Empresa</strong>. Un administrador revisará la información corporativa y su NIT.
      </p>

      <!-- Tarjeta resumen con datos de radicación -->
      <div class="w-full bg-neutral-lightest border border-neutral-light rounded-xl p-4 text-left mb-6 space-y-2.5 text-xs">
        <div class="flex justify-between items-center py-1 border-b border-neutral-light/60">
          <span class="text-neutral-medium">Empresa:</span>
          <span class="font-semibold text-corporate">{{ formData.nombre_empresa }}</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-neutral-light/60">
          <span class="text-neutral-medium">NIT / RUT:</span>
          <span class="font-semibold text-corporate font-mono">{{ formData.nit }}</span>
        </div>
        <div class="flex justify-between items-center py-1 border-b border-neutral-light/60">
          <span class="text-neutral-medium">Representante:</span>
          <span class="font-semibold text-corporate">{{ formData.nombre_representante }}</span>
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
          Le notificaremos por correo electrónico una vez el administrador dictamine la solicitud. Mientras tanto, puede seguir comprando como cliente particular.
        </p>
      </div>

      <Button variant="corporate" size="full" @click="onFinalizarExito">
        ¡Entendido, volver a mi perfil!
      </Button>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-5 mt-4">
      <div class="min-w-0 w-full flex flex-col gap-1.5 font-sans">
        <label for="nombre_empresa" class="text-sm font-medium text-neutral-dark">
          Razón Social / Nombre de Empresa
        </label>
        <input
          id="nombre_empresa"
          v-model="formData.nombre_empresa"
          type="text"
          placeholder="Ej. Constructora Pintu Clic S.A.S"
          class="w-full min-w-0 px-4 py-3 text-base sm:text-sm rounded-lg border outline-none transition-colors duration-200 font-sans border-neutral-light focus:border-action bg-neutral-white"
          :class="{ 'border-danger focus:border-danger bg-danger/5': errores.nombre_empresa }"
        />
        <span v-if="errores.nombre_empresa" class="text-sm text-danger font-medium">
          {{ errores.nombre_empresa }}
        </span>
      </div>

      <div class="min-w-0 w-full flex flex-col gap-1.5 font-sans">
        <label for="nit" class="text-sm font-medium text-neutral-dark">
          NIT o RUT
        </label>
        <input
          id="nit"
          v-model="formData.nit"
          type="text"
          placeholder="Ej. 900123456-7"
          class="w-full min-w-0 px-4 py-3 text-base sm:text-sm rounded-lg border outline-none transition-colors duration-200 font-sans border-neutral-light focus:border-action bg-neutral-white"
          :class="{ 'border-danger focus:border-danger bg-danger/5': errores.nit }"
        />
        <span v-if="errores.nit" class="text-sm text-danger font-medium">
          {{ errores.nit }}
        </span>
      </div>

      <div class="min-w-0 w-full flex flex-col gap-1.5 font-sans">
        <label for="nombre_representante" class="text-sm font-medium text-neutral-dark">
          Nombre del Representante Legal
        </label>
        <input
          id="nombre_representante"
          v-model="formData.nombre_representante"
          type="text"
          placeholder="Nombre del representante"
          class="w-full min-w-0 px-4 py-3 text-base sm:text-sm rounded-lg border outline-none transition-colors duration-200 font-sans border-neutral-light focus:border-action bg-neutral-white"
          :class="{ 'border-danger focus:border-danger bg-danger/5': errores.nombre_representante }"
        />
        <span v-if="errores.nombre_representante" class="text-sm text-danger font-medium">
          {{ errores.nombre_representante }}
        </span>
      </div>

      <div class="min-w-0 w-full flex flex-col gap-1.5 font-sans">
        <label for="telefono" class="text-sm font-medium text-neutral-dark">
          Teléfono de Contacto
        </label>
        <input
          id="telefono"
          v-model="formData.telefono"
          type="tel"
          placeholder="Teléfono"
          class="w-full min-w-0 px-4 py-3 text-base sm:text-sm rounded-lg border outline-none transition-colors duration-200 font-sans border-neutral-light focus:border-action bg-neutral-white"
          :class="{ 'border-danger focus:border-danger bg-danger/5': errores.telefono }"
        />
        <span v-if="errores.telefono" class="text-sm text-danger font-medium">
          {{ errores.telefono }}
        </span>
      </div>

      <div class="flex items-center gap-3 mt-4">
        <Button type="button" variant="neutral" class="flex-1" @click="closeModal" :disabled="loading">
          Cancelar
        </Button>
        <Button type="submit" variant="corporate" class="flex-1" :disabled="loading">
          <span v-if="loading">Enviando...</span>
          <span v-else>Enviar solicitud</span>
        </Button>
      </div>
    </form>
  </Modal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { z } from 'zod';
import Modal from '@/core/components/overlays/Modal.vue';
import Button from '@/core/components/buttons/Button.vue';
import { Clock as ClockIcon, Mail as MailIcon } from 'lucide-vue-next';
import { CuentasService } from '@/modules/m04-cuentas/services/cuentas.service';
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store';
import { ascensoEmpresaSchema } from '@/modules/m04-cuentas/dtos';

const props = defineProps<{
  modelValue: boolean;
  initialName?: string;
  initialPhone?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const authStore = useAuthStore();
const loading = ref(false);
const success = ref(false);
const errores = reactive<Record<string, string>>({});

function obtenerNombreInicial(): string {
  return props.initialName || authStore.user?.nombre || '';
}

function obtenerTelefonoInicial(): string {
  return props.initialPhone || authStore.user?.telefono || '';
}

const formData = reactive({
  nombre_empresa: '',
  nit: '',
  nombre_representante: obtenerNombreInicial(),
  telefono: obtenerTelefonoInicial(),
});

function resetearFormulario(): void {
  formData.nombre_empresa = '';
  formData.nit = '';
  formData.nombre_representante = obtenerNombreInicial();
  formData.telefono = obtenerTelefonoInicial();
  success.value = false;
  Object.keys(errores).forEach((k) => delete errores[k]);
}

// Inicializar datos al abrir el modal
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetearFormulario();
  }
});

// Si los datos se hidratan después, autocompletar campos vacíos
watch(
  [() => props.initialName, () => props.initialPhone, () => authStore.user],
  ([name, phone, user]) => {
    const nombre = name || user?.nombre || '';
    const tel = phone || user?.telefono || '';
    if (!formData.nombre_representante && nombre) {
      formData.nombre_representante = nombre;
    }
    if (!formData.telefono && tel) {
      formData.telefono = tel;
    }
  },
  { immediate: true }
);

const closeModal = () => {
  emit('update:modelValue', false);
};

function onFinalizarExito(): void {
  emit('success');
  closeModal();
}

const handleSubmit = async () => {
  try {
    Object.keys(errores).forEach(k => delete errores[k]);
    ascensoEmpresaSchema.parse(formData);
    
    loading.value = true;
    await CuentasService.solicitarAscensoEmpresa(formData);
    
    // Registrar solicitud pendiente en localStorage para seguimiento visual en Mi Perfil
    const idUsuario = authStore.user?.id_usuario;
    if (idUsuario) {
      const registroSolicitud = {
        nit: formData.nit.trim(),
        nombre_empresa: formData.nombre_empresa.trim(),
        nombre_representante: formData.nombre_representante.trim(),
        telefono: formData.telefono.trim(),
        estado: 'pendiente',
        fecha_solicitud: new Date().toISOString(),
      };
      localStorage.setItem(`pintuclic_solicitud_empresa_${idUsuario}`, JSON.stringify(registroSolicitud));
    }

    success.value = true;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(e => {
        if (e.path[0]) errores[e.path[0].toString()] = e.message;
      });
    } else {
      const err = error as { response?: { data?: { mensaje?: string } } };
      if (err.response?.data?.mensaje) {
        errores.nombre_empresa = err.response.data.mensaje;
      }
    }
  } finally {
    loading.value = false;
  }
};
</script>
