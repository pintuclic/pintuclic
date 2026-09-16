<script setup lang="ts">
import { Icon, Button } from "@/core/components";
</script>
<template>
  <section
    class="rounded-xl border border-neutral-light bg-neutral-white p-12 text-center"
  >
    <Icon name="search" class="mx-auto mb-5 h-12 w-12 text-action" />
    <h1 class="font-title text-2xl font-bold text-corporate">Página no encontrada</h1>
    <p class="mt-3 text-neutral-medium">
      La sección que buscas no está disponible.
    </p>
    <Button to="/admin" variant="action" class="mt-6">Volver al inicio</Button>
  </section>
</template>
