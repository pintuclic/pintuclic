<template>
  <span
    class="inline-block rounded-full border-2 border-white shadow-md ring-1 ring-black/20 shrink-0 transition-transform duration-200"
    :class="[
      tamanoClases,
      { 'ring-2 ring-action ring-offset-1 scale-110': activo }
    ]"
    :style="{ backgroundColor: colorValido }"
    :title="tituloMuestra"
    :aria-label="tituloMuestra"
    role="img"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    hex?: string | null;
    nombre?: string | null;
    codigo?: string | null;
    tamano?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    activo?: boolean;
  }>(),
  {
    hex: null,
    nombre: null,
    codigo: null,
    tamano: 'md',
    activo: false,
  }
);

const colorValido = computed(() => {
  if (!props.hex) return '#CCCCCC';
  const recortado = props.hex.trim();
  if (recortado.startsWith('#') || recortado.startsWith('rgb')) {
    return recortado;
  }
  return `#${recortado}`;
});

const tituloMuestra = computed(() => {
  const partes: string[] = [];
  if (props.nombre) partes.push(props.nombre);
  if (props.codigo) partes.push(`(${props.codigo})`);
  if (!partes.length && props.hex) partes.push(props.hex);
  return partes.length ? partes.join(' ') : 'Muestra de color';
});

const tamanoClases = computed(() => {
  switch (props.tamano) {
    case 'xs':
      return 'h-4 w-4';
    case 'sm':
      return 'h-6 w-6';
    case 'lg':
      return 'h-10 w-10 border-[3px]';
    case 'xl':
      return 'h-14 w-14 border-4';
    case 'md':
    default:
      return 'h-7 w-7 sm:h-8 sm:w-8';
  }
});
</script>
