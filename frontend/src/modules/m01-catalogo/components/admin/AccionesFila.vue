<template>
  <div class="flex items-center justify-end gap-1">
    <IconButton v-if="ver" icon="eye" :label="`Ver ${nombre}`" tone="action" :to="ver" class="p-1.5" />
    <IconButton v-if="editable" icon="edit" :label="`Editar ${nombre}`" tone="neutral" class="p-1.5" @click="emit('editar')" />
    <IconButton
      v-if="activo"
      icon="power"
      :label="`Desactivar ${nombre}`"
      tone="danger"
      has-popup="dialog"
      class="p-1.5"
      @click="emit('desactivar')"
    />
    <IconButton
      v-else
      icon="refresh"
      :label="`Reactivar ${nombre}`"
      tone="success"
      has-popup="dialog"
      class="p-1.5"
      @click="emit('reactivar')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IconButton } from '@/core/components';

/**
 * M01 - Acciones estándar de una fila del catálogo (ver · editar · desactivar/reactivar).
 * Botones en línea en lugar de menú flotante: la tabla del core tiene overflow
 * horizontal y recortaría un menú desplegable en las últimas filas.
 */
const props = withDefaults(defineProps<{
  nombre: string;
  estado: string;
  ver?: string | object;
  editable?: boolean;
}>(), { ver: undefined, editable: true });

const emit = defineEmits<{ editar: []; desactivar: []; reactivar: [] }>();

/** Solo lo inactivo se reactiva; `agotado`/`descontinuado` (variantes) siguen siendo desactivables. */
const activo = computed(() => props.estado !== 'inactivo');
</script>
