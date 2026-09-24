<template>
  <Modal :model-value="abierta" max-width="5xl" :accent="true" @update:model-value="emit('cerrar')">
    <CalculadoraPinturaContenido :producto="producto" @agregar="emit('agregar')" @ver-producto="emit('cerrar')" />
  </Modal>
</template>

<script setup lang="ts">
import { Modal } from '@/core/components';
import type { FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';
import CalculadoraPinturaContenido from './CalculadoraPinturaContenido.vue';

defineProps<{ abierta: boolean; producto?: FichaProductoPublico | null }>();
const emit = defineEmits<{ cerrar: []; agregar: [] }>();
</script>
