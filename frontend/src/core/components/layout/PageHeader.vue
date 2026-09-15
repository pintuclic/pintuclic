<script setup lang="ts">
defineProps<{ title: string; description: string }>();
</script>
<template>
  <div class="mb-7 flex flex-wrap items-center justify-between gap-4">
    <div class="min-w-0">
      <h1
        class="break-words text-2xl font-bold tracking-tight text-corporate xl:text-3xl"
      >
        {{ title }}
      </h1>
      <p class="mt-2 text-sm leading-6 text-neutral-medium">
        {{ description }}
      </p>
    </div>
    <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap"><slot /></div>
  </div>
</template>
