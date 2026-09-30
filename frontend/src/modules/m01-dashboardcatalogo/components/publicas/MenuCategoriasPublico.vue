<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="abierto"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-corporate/70 px-4 py-8 sm:py-14"
        role="presentation"
        @click.self="emit('cerrar')"
      >
        <section
          class="w-full max-w-4xl overflow-hidden rounded-2xl bg-neutral-white shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-menu-categorias"
        >
          <!-- Franja decorativa de marca arcoíris Pintu Clic -->
          <div
            class="h-2 w-full shrink-0"
            style="background: linear-gradient(90deg, #FF4D4D 0%, #FFB703 20%, #4CAF50 40%, #00B4D8 65%, #0877E8 80%, #7B2FF7 100%);"
          />

          <header class="flex items-center justify-between border-b border-neutral-light px-5 py-4 sm:px-7">
            <div class="flex items-center gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-card bg-neutral-lightest text-corporate">
                <PanelsTopLeft :size="20" aria-hidden="true" />
              </span>
              <h2 id="titulo-menu-categorias" class="font-title text-lg font-bold text-neutral-black">
                Categorías
              </h2>
            </div>
            <button
              type="button"
              class="grid h-11 w-11 place-items-center rounded-button text-neutral-medium transition-colors hover:bg-neutral-lightest hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              aria-label="Cerrar categorías"
              @click="emit('cerrar')"
            >
              <X :size="21" aria-hidden="true" />
            </button>
          </header>

          <div class="px-5 py-6 sm:px-8 sm:py-8">
            <div v-if="cargando" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
              <div v-for="indice in 6" :key="indice" class="animate-pulse space-y-3">
                <div class="h-5 w-2/3 rounded bg-neutral-light" />
                <div class="h-3 w-full rounded bg-neutral-lightest" />
                <div class="h-3 w-5/6 rounded bg-neutral-lightest" />
              </div>
            </div>

            <div v-else-if="categorias.length" class="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              <article v-for="categoria in categorias" :key="categoria.id_categoria">
                <h3 class="font-title mb-3 flex items-center gap-2 text-sm font-bold uppercase text-corporate">
                  <Tags :size="17" class="text-action" aria-hidden="true" />
                  {{ categoria.nombre }}
                </h3>
                <ul class="space-y-1.5">
                  <li
                    v-for="subcategoria in categoria.subcategorias"
                    :key="subcategoria.id_subcategoria"
                  >
                    <button
                      type="button"
                      class="group flex min-h-11 w-full items-center justify-between rounded-button px-2 text-left text-sm text-neutral-medium transition-colors hover:bg-subaction hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                      @click="emit('seleccionar', subcategoria.id_subcategoria)"
                    >
                      {{ subcategoria.nombre }}
                      <ChevronRight :size="15" class="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </button>
                  </li>
                </ul>
              </article>
            </div>

            <p v-else class="py-8 text-center text-sm text-neutral-medium">
              No hay categorías públicas disponibles.
            </p>

            <div class="mt-8 flex flex-col gap-4 rounded-card bg-subaction p-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-action text-white">
                  <Palette :size="20" aria-hidden="true" />
                </span>
                <div>
                  <p class="font-bold text-corporate">¿No sabes qué pintura necesitas?</p>
                  <p class="text-xs text-neutral-medium">Te ayudamos a encontrar la ideal para tu proyecto.</p>
                </div>
              </div>
              <button
                type="button"
                disabled
                title="La asesoría guiada estará disponible próximamente"
                class="min-h-11 cursor-not-allowed rounded-button bg-neutral-light px-4 text-sm font-medium text-neutral-medium shadow-none"
              >
                Encontrar pintura ideal
              </button>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue';
import { ChevronRight, Palette, PanelsTopLeft, Tags, X } from 'lucide-vue-next';
import type { CategoriaPublica } from '../../interfaces/catalogo-publico.interface';

const props = defineProps<{
  abierto: boolean;
  cargando: boolean;
  categorias: readonly CategoriaPublica[];
}>();

const emit = defineEmits<{
  cerrar: [];
  seleccionar: [idSubcategoria: number];
}>();

watch(
  () => props.abierto,
  (abierto) => {
    document.body.style.overflow = abierto ? 'hidden' : '';
  }
);

onBeforeUnmount(() => {
  document.body.style.overflow = '';
});
</script>
