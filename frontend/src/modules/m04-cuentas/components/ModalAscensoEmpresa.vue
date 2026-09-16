<template>
  <Modal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" titulo="Ascender a Cuenta Empresa" maxWidth="md">
    <template #descripcion>
      Por favor, completa los siguientes datos para solicitar la actualización de tu cuenta.
      Un administrador revisará tu solicitud.
    </template>

    <div v-if="success" class="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm mb-4">
      Tu solicitud ha sido enviada con éxito. Nuestro equipo la revisará pronto.
    </div>

    <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-5 mt-4">
      <Input
        id="nombre_empresa"
        name="nombre_empresa"
        label="Razón Social / Nombre de Empresa"
        v-model="formData.nombre_empresa"
        :error="errores.nombre_empresa"
        placeholder="Ej. Constructora Pintu Clic S.A.S"
      />

      <Input
        id="nit"
        name="nit"
        label="NIT o RUT"
        v-model="formData.nit"
        :error="errores.nit"
        placeholder="Ej. 900123456-7"
      />

      <Input
        id="nombre_representante"
        name="nombre_representante"
        label="Nombre del Representante Legal"
        v-model="formData.nombre_representante"
        :error="errores.nombre_representante"
      />

      <Input
        id="telefono"
        name="telefono"
        label="Teléfono de Contacto"
        v-model="formData.telefono"
        :error="errores.telefono"
        type="tel"
      />

      <div class="flex items-center gap-3 mt-4">
        <Button type="button" variant="outline" class="flex-1" @click="closeModal" :disabled="loading">
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
import Input from '@/core/components/forms/Input.vue';
import Button from '@/core/components/buttons/Button.vue';
import { CuentasService } from '@/modules/m04-cuentas/services/cuentas.service';

import { ascensoEmpresaSchema } from '../dtos';

const props = defineProps<{
  modelValue: boolean;
  initialName?: string;
  initialPhone?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'success'): void;
}>();

const loading = ref(false);
const success = ref(false);
const errores = reactive<Record<string, string>>({});

const formData = reactive({
  nombre_empresa: '',
  nit: '',
  nombre_representante: '',
  telefono: ''
});

// Inicializar datos al abrir el modal
watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    formData.nombre_empresa = '';
    formData.nit = '';
    formData.nombre_representante = props.initialName || '';
    formData.telefono = props.initialPhone || '';
    success.value = false;
    Object.keys(errores).forEach(k => delete errores[k]);
  }
});

const closeModal = () => {
  emit('update:modelValue', false);
};

const handleSubmit = async () => {
  try {
    Object.keys(errores).forEach(k => delete errores[k]);
    ascensoEmpresaSchema.parse(formData);
    
    loading.value = true;
    await CuentasService.solicitarAscensoEmpresa(formData);
    success.value = true;
    
    setTimeout(() => {
      emit('success');
      closeModal();
    }, 2500);

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
