<template>
  <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <h1 class="text-2xl font-bold text-neutral-black">{{ titulo }}</h1>
      <p v-if="descripcion" class="mt-1 text-sm text-neutral-medium">{{ descripcion }}</p>
    </div>
    <div v-if="$slots.acciones" class="flex flex-wrap items-center gap-3">
      <slot name="acciones" />
    </div>
  </header>
</template>

<script setup lang="ts">
/**
 * Encabezado reutilizable de pantalla del panel: título + descripción + acciones.
 * Las acciones (botones "Nuevo…", "Exportar", etc.) se pasan por el slot `acciones`.
 */
defineProps<{
  titulo: string;
  descripcion?: string;
}>();
</script>
