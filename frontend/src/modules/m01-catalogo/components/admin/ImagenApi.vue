<template>
  <div class="flex items-center justify-center overflow-hidden rounded-lg border border-neutral-light bg-neutral-lightest">
    <img v-if="url" :src="url" :alt="alt" class="h-full w-full object-contain" loading="lazy" />
    <span v-else class="px-1 text-center text-[10px] leading-tight text-neutral-medium">
      {{ fallo ? 'No disponible' : '…' }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useImagenProtegida } from '../../composables/useArchivos';
import type { CargarBinario } from '../../composables/useArchivos';

/** M01 - Imagen servida por un endpoint protegido (logotipos, imágenes de producto). */
const props = defineProps<{ clave: string | number | null; cargar: CargarBinario; alt: string }>();

const { url, fallo } = useImagenProtegida(() => props.clave, () => props.cargar());
</script>
