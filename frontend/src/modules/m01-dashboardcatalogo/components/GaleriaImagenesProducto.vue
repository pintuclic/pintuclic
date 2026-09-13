<template>
  <div>
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <figure
        v-for="(imagen, i) in imagenes"
        :key="imagen.id"
        class="group relative aspect-square overflow-hidden rounded-input border border-neutral-light bg-neutral-lightest"
      >
        <img
          v-if="imagen.url"
          :src="imagen.url"
          :alt="imagen.nombre"
          class="h-full w-full object-cover"
        />
        <div v-else class="flex h-full w-full flex-col items-center justify-center gap-1 p-2 text-center">
          <ImageIcon class="h-5 w-5 text-neutral-medium" aria-hidden="true" />
          <figcaption class="line-clamp-2 text-[11px] text-neutral-medium">{{ imagen.nombre }}</figcaption>
        </div>

        <span
          v-if="imagen.esPrincipal"
          class="absolute left-1.5 top-1.5 rounded-button bg-corporate px-1.5 py-0.5 text-[10px] font-medium text-neutral-white"
        >
          Principal
        </span>

        <div
          class="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-neutral-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <button
            v-if="!imagen.esPrincipal"
            type="button"
            class="rounded-button px-1.5 py-0.5 text-[10px] font-medium text-neutral-white hover:bg-neutral-white/20"
            @click="$emit('principal', imagen.id)"
          >
            Hacer principal
          </button>
          <span v-else />
          <button
            type="button"
            class="grid h-5 w-5 place-items-center rounded-button text-neutral-white hover:bg-neutral-white/20"
            :aria-label="`Quitar imagen ${i + 1}`"
            @click="$emit('quitar', imagen.id)"
          >
            <X class="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </figure>

      <button
        type="button"
        class="flex aspect-square flex-col items-center justify-center gap-1 rounded-input border border-dashed border-neutral-light text-neutral-medium hover:border-action hover:text-action"
        @click="$emit('agregar')"
      >
        <Plus class="h-5 w-5" aria-hidden="true" />
        <span class="text-xs font-medium">Añadir más</span>
      </button>
    </div>

    <p v-if="error" class="mt-2 flex items-center gap-1 text-xs font-medium text-neutral-black" role="alert">
      <AlertCircle class="h-3.5 w-3.5 shrink-0 text-highlight" aria-hidden="true" />
      {{ error }}
    </p>
    <p v-else class="mt-2 text-xs text-neutral-medium">
      Sube imágenes en alta resolución (mín. 1200×1200 px) con fondo blanco o en uso real.
      La primera es la principal (HU-CAT-07).
    </p>
  </div>
</template>

<script setup lang="ts">
import { Image as ImageIcon, Plus, X, AlertCircle } from 'lucide-vue-next';
import type { ImagenProducto } from '../interfaces';

defineProps<{
  imagenes: ImagenProducto[];
  error?: string;
}>();

defineEmits<{
  (e: 'agregar'): void;
  (e: 'quitar', id: string): void;
  (e: 'principal', id: string): void;
}>();
</script>
