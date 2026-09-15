<script setup lang="ts">
import { Icon } from "@/core/components";
import { RouterLink } from "vue-router";
</script>
<template>
  <section
    class="rounded-xl border border-neutral-light bg-neutral-white p-12 text-center"
  >
    <Icon name="search" class="mx-auto mb-5 h-12 w-12 text-action" />
    <h1 class="text-2xl font-bold text-corporate">Página no encontrada</h1>
    <p class="mt-3 text-neutral-medium">
      La sección que buscas no está disponible.
    </p>
    <RouterLink
      to="/admin"
      class="mt-6 inline-block rounded-lg bg-action px-5 py-3 text-sm font-semibold text-neutral-white"
      >Volver al inicio</RouterLink
    >
  </section>
</template>
