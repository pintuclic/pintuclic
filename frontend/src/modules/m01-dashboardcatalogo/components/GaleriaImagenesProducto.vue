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

      <label
        class="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-input border border-dashed border-neutral-light text-neutral-medium hover:border-action hover:text-action"
      >
        <Plus class="h-5 w-5" aria-hidden="true" />
        <span class="text-xs font-medium">Añadir más</span>
        <input
          type="file"
          accept="image/*"
          multiple
          class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          @click="guardarPosicionScroll"
          @change="onSeleccionarArchivos"
        />
      </label>
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

const emit = defineEmits<{
  (e: 'agregar', archivo: { nombre: string; url: string }): void;
  (e: 'quitar', id: string): void;
  (e: 'principal', id: string): void;
}>();

/**
 * Posición de scroll justo antes de abrir el selector de archivos del sistema.
 * Al cerrarse el diálogo, algunos navegadores desplazan la página hacia el
 * input (aunque esté invisible), dejando un salto/espacio en blanco. La
 * capturamos aquí (antes de que el diálogo nativo abra) para poder
 * restaurarla después, sin importar qué haga el navegador mientras tanto.
 */
let posicionScrollPrevia = 0;
let contenedorScroll: Element | null = null;

function guardarPosicionScroll(evento: Event): void {
  const input = evento.target as HTMLInputElement;
  contenedorScroll = input.closest('main') ?? document.scrollingElement;
  posicionScrollPrevia = contenedorScroll?.scrollTop ?? 0;
}

function restaurarPosicionScroll(): void {
  if (contenedorScroll) contenedorScroll.scrollTop = posicionScrollPrevia;
}

/** Lee cada archivo elegido como data URL para previsualizarlo (sin backend de upload aún: HU-CAT-07). */
function onSeleccionarArchivos(evento: Event): void {
  const input = evento.target as HTMLInputElement;
  const archivos = input.files ? Array.from(input.files) : [];

  for (const archivo of archivos) {
    const lector = new FileReader();
    lector.onload = () => {
      emit('agregar', { nombre: archivo.name, url: String(lector.result ?? '') });
      requestAnimationFrame(restaurarPosicionScroll);
    };
    lector.readAsDataURL(archivo);
  }

  input.value = '';
  input.blur();
  restaurarPosicionScroll();
  requestAnimationFrame(restaurarPosicionScroll);
}
</script>
