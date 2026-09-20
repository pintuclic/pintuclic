<template>
  <Modal
    :model-value="modelValue"
    maxWidth="md"
    title="Confirmar Identidad"
    accent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="p-6">
      <div class="mb-4">
        <h3 class="text-lg font-title font-semibold text-corporate mb-2">Autorización de Seguridad</h3>
        <p class="text-sm text-neutral-medium">
          Por seguridad de su cuenta, ingrese su contraseña actual para autorizar el cambio de correo electrónico a <strong>{{ nuevoCorreo }}</strong>. Enviaremos un código de confirmación a su correo actual vigente.
        </p>
      </div>

      <div
        v-if="error"
        class="mb-4 p-3 rounded-md bg-subaction border border-action/30 text-sm font-medium text-corporate text-center"
      >
        {{ error }}
      </div>

      <form @submit.prevent="onConfirmarSubmit" class="space-y-4">
        <div>
          <Input
            v-model="contrasena"
            type="password"
            label="Contraseña Actual"
            placeholder="••••••••"
            required
          />
        </div>

        <div class="flex gap-3 justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            @click="onCancelar"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="corporate"
            size="md"
            :disabled="cargando || !contrasena"
          >
            {{ cargando ? 'Verificando...' : 'Continuar' }}
          </Button>
        </div>
      </form>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Modal, Input, Button } from '@/core/components';

const props = defineProps<{
  modelValue: boolean;
  nuevoCorreo: string;
  cargando: boolean;
  error: string | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'confirmar', contrasena: string): void;
  (e: 'cancelar'): void;
}>();

const contrasena = ref('');

watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      contrasena.value = '';
    }
  }
);

function onConfirmarSubmit(): void {
  if (!contrasena.value) return;
  emit('confirmar', contrasena.value);
}

function onCancelar(): void {
  emit('cancelar');
  emit('update:modelValue', false);
}
</script>
