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
          :accept="FORMATOS_IMAGEN_PERMITIDOS.join(',')"
          multiple
          class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          @click="guardarPosicionScroll"
          @change="onSeleccionarArchivos"
        />
      </label>
    </div>

    <p
      v-if="errorMostrado"
      class="mt-2 flex items-center gap-1 text-xs font-medium text-neutral-black"
      role="alert"
    >
      <AlertCircle class="h-3.5 w-3.5 shrink-0 text-highlight" aria-hidden="true" />
      {{ errorMostrado }}
    </p>
    <p v-else class="mt-2 text-xs text-neutral-medium">
      Sube imágenes en alta resolución (mín. 1200×1200 px) con fondo blanco o en uso real.
      Formatos {{ FORMATOS_LEGIBLES }}, hasta {{ PESO_MAXIMO_MB }}MB cada una.
      La primera es la principal (HU-CAT-07).
    </p>
  </div>
</template>

<script setup lang="ts">
/**
 * ==============================================================================
 * M01 - GALERÍA DE IMÁGENES DEL PRODUCTO (HU-CAT-07)
 *
 * El backend recibe cada imagen como data URL base64 (`CrearImagenDto.imagen`),
 * limitada a jpeg/png/webp y 5MB. Aquí se aplican esas mismas reglas antes de
 * leer el archivo, para avisar al usuario en el navegador en vez de esperar a
 * que el servidor rechace la subida. Las reglas viven en `dtos/` (directiva 12).
 *
 * NOTA: en esta rama no hay endpoint de subida cableado; la galería solo
 * mantiene el modelo local (`url`, `orden`, `esPrincipal`).
 * ==============================================================================
 */
import { computed, ref } from 'vue';
import { Image as ImageIcon, Plus, X, AlertCircle } from 'lucide-vue-next';
import {
  FORMATOS_IMAGEN_PERMITIDOS,
  PESO_MAXIMO_IMAGEN_BYTES,
} from '../dtos/producto-formulario.dto';
import type { ImagenProducto } from '../interfaces';

const props = defineProps<{
  imagenes: ImagenProducto[];
  error?: string;
}>();

const emit = defineEmits<{
  (e: 'agregar', archivo: { nombre: string; url: string }): void;
  (e: 'quitar', id: string): void;
  (e: 'principal', id: string): void;
}>();

const PESO_MAXIMO_MB = PESO_MAXIMO_IMAGEN_BYTES / (1024 * 1024);
const FORMATOS_LEGIBLES = FORMATOS_IMAGEN_PERMITIDOS.map((f) => f.replace('image/', '')).join(', ');

/** Error propio del selector (formato / peso); el del formulario tiene prioridad. */
const errorArchivo = ref<string | null>(null);
const errorMostrado = computed(() => props.error || errorArchivo.value || '');

/** Mismas reglas que `CrearImagenDto`, aplicadas sobre el archivo elegido. */
function motivoRechazo(archivo: { name: string; type: string; size: number }): string | null {
  if (!(FORMATOS_IMAGEN_PERMITIDOS as readonly string[]).includes(archivo.type)) {
    return `«${archivo.name}»: solo se admiten imágenes ${FORMATOS_LEGIBLES}.`;
  }
  if (archivo.size > PESO_MAXIMO_IMAGEN_BYTES) {
    return `«${archivo.name}»: la imagen no puede pesar más de ${PESO_MAXIMO_MB}MB.`;
  }
  return null;
}

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
  errorArchivo.value = null;

  for (const archivo of archivos) {
    const rechazo = motivoRechazo(archivo);
    if (rechazo) {
      errorArchivo.value = rechazo;
      continue;
    }
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
