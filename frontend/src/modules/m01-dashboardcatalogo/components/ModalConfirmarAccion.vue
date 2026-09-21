<template>
  <Modal :model-value="modelValue" max-width="sm" @update:model-value="$emit('update:modelValue', $event)">
    <div class="text-center py-2">
      <h3 class="text-lg font-title font-bold text-corporate mb-2">{{ titulo }}</h3>
      <p class="text-sm text-neutral-medium mb-6">{{ mensaje }}</p>
      <div class="flex gap-3 justify-center">
        <Button variant="text" @click="$emit('update:modelValue', false)">Cancelar</Button>
        <Button variant="danger" @click="$emit('confirmar')">{{ textoConfirmar }}</Button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { Modal, Button } from '@/core/components';

/**
 * `@/core/components/overlays/ConfirmarAccion.vue` está sin implementar (stub
 * vacío). Mientras tanto, este envoltorio delgado sobre `Modal` del Core cubre
 * el mismo caso de uso (confirmar antes de desactivar) sin duplicar el overlay.
 */
withDefaults(
  defineProps<{
    modelValue: boolean;
    titulo: string;
    mensaje: string;
    textoConfirmar?: string;
  }>(),
  { textoConfirmar: 'Desactivar' }
);

defineEmits<{
  (e: 'update:modelValue', valor: boolean): void;
  (e: 'confirmar'): void;
}>();
</script>
