<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium whitespace-nowrap"
    :class="clases"
  >
    <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
    {{ etiqueta }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EstadoProducto } from '../interfaces';

/**
 * Píldora de estado del producto en el listado (HU-CAT-09).
 * La paleta oficial no tiene rol "destructivo": "inactivo" usa neutros.
 */
const props = defineProps<{ estado: EstadoProducto }>();

const MAPA: Record<EstadoProducto, { etiqueta: string; clases: string }> = {
  publicado: { etiqueta: 'Publicado', clases: 'bg-conversion/10 text-conversion' },
  borrador: { etiqueta: 'Borrador', clases: 'bg-action/10 text-action' },
  inactivo: { etiqueta: 'Inactivo', clases: 'bg-neutral-light text-neutral-medium' },
};

const etiqueta = computed(() => MAPA[props.estado].etiqueta);
const clases = computed(() => MAPA[props.estado].clases);
</script>
