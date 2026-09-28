<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
    <header class="mb-4 flex items-start gap-3">
      <span
        v-if="icono"
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-card bg-subaction text-corporate"
      >
        <component :is="icono" class="h-4 w-4" aria-hidden="true" />
      </span>
      <div>
        <h2 class="text-base font-semibold text-neutral-black">{{ titulo }}</h2>
        <p v-if="descripcion" class="mt-0.5 text-sm text-neutral-medium">{{ descripcion }}</p>
      </div>
    </header>
    <div class="space-y-4">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

/** Tarjeta de sección del formulario de producto (Información general, Clasificación, …). */
defineProps<{
  titulo: string;
  descripcion?: string;
  icono?: Component;
}>();
</script>
