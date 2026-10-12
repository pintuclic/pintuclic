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
        @mousedown="alPulsarFondo"
        @click="alSoltarEnFondo"
      >
        <section
          ref="dialogo"
          class="w-full max-w-4xl overflow-hidden rounded-modal bg-neutral-white shadow-2xl"
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
              <h2 id="titulo-menu-categorias" class="font-poppins text-lg font-bold text-neutral-black">
                Categorías
              </h2>
            </div>
            <button
              ref="botonCerrar"
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

            <div v-else-if="categorias.length">
              <button
                type="button"
                class="group mb-5 flex min-h-11 w-full items-center justify-between rounded-button border border-action px-4 text-left text-sm font-semibold text-action transition-colors hover:bg-action hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                @click="emit('seleccionarTodos')"
              >
                Ver todos los productos
                <ChevronRight :size="16" class="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </button>

              <!-- Categoría → subcategorías: se elige una categoría y se muestran las suyas -->
              <div class="grid gap-5 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:gap-8">
                <ul class="space-y-1" aria-label="Categorías">
                  <li v-for="categoria in categorias" :key="categoria.id_categoria">
                    <button
                      type="button"
                      class="flex min-h-11 w-full items-center gap-2 rounded-button px-3 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                      :class="categoria.id_categoria === categoriaActiva?.id_categoria ? 'bg-subaction text-action' : 'text-corporate hover:bg-neutral-lightest'"
                      :aria-pressed="categoria.id_categoria === categoriaActiva?.id_categoria"
                      :title="categoria.nombre"
                      @click="idCategoriaActiva = categoria.id_categoria"
                    >
                      <Tags :size="16" class="shrink-0 text-action" aria-hidden="true" />
                      <!-- Sin número: contaba subcategorías y se leía como cantidad de productos. -->
                      <span class="min-w-0 flex-1 truncate">{{ categoria.nombre }}</span>
                      <ChevronRight :size="15" class="shrink-0" aria-hidden="true" />
                    </button>
                  </li>
                </ul>

                <section v-if="categoriaActiva" class="min-w-0 rounded-card border border-neutral-light p-4" aria-live="polite">
                  <h3 class="font-poppins mb-2 text-sm font-bold uppercase text-corporate">{{ categoriaActiva.nombre }}</h3>
                  <ul v-if="categoriaActiva.subcategorias.length" class="grid gap-1 sm:grid-cols-2">
                    <li v-for="subcategoria in categoriaActiva.subcategorias" :key="subcategoria.id_subcategoria" class="min-w-0">
                      <button
                        type="button"
                        class="group flex min-h-11 w-full items-center justify-between gap-2 rounded-button px-2 text-left text-sm text-neutral-medium transition-colors hover:bg-subaction hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                        :title="subcategoria.nombre"
                        @click="emit('seleccionar', subcategoria.id_subcategoria)"
                      >
                        <span class="min-w-0 truncate">{{ subcategoria.nombre }}</span>
                        <ChevronRight :size="15" class="shrink-0 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </button>
                    </li>
                  </ul>
                  <p v-else class="py-3 text-sm text-neutral-medium">Esta categoría aún no tiene subcategorías publicadas.</p>
                </section>
              </div>
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
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { ChevronRight, Palette, PanelsTopLeft, Tags, X } from 'lucide-vue-next';
import type { CategoriaPublica } from '../../interfaces/publicas/catalogo-publico.interface';
import { useCierrePorFondo } from '../../composables/publicas/useCierrePorFondo';

const props = defineProps<{
  abierto: boolean;
  cargando: boolean;
  categorias: readonly CategoriaPublica[];
}>();

const emit = defineEmits<{
  cerrar: [];
  seleccionar: [idSubcategoria: number];
  /** «Ver todos los productos»: el catálogo sin categoría. */
  seleccionarTodos: [];
}>();

const { alPulsarFondo, alSoltarEnFondo } = useCierrePorFondo(() => emit('cerrar'));

const idCategoriaActiva = ref<number | null>(null);
/** Categoría elegida; por defecto la primera, y si desaparece se vuelve a la primera. */
const categoriaActiva = computed(
  () => props.categorias.find((c) => c.id_categoria === idCategoriaActiva.value) ?? props.categorias[0] ?? null
);

const dialogo = ref<HTMLElement | null>(null);
const botonCerrar = ref<HTMLElement | null>(null);
/** Elemento que abrió el menú: recupera el foco al cerrar. */
let focoPrevio: HTMLElement | null = null;

const SELECTOR_ENFOCABLES = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Escape cierra; Tab y Mayús+Tab quedan dentro del diálogo mientras está abierto. */
function alPulsarTecla(evento: KeyboardEvent): void {
  if (evento.key === 'Escape') {
    evento.preventDefault();
    emit('cerrar');
    return;
  }
  if (evento.key !== 'Tab' || !dialogo.value) return;
  const enfocables = Array.from(dialogo.value.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES));
  const primero = enfocables[0];
  const ultimo = enfocables[enfocables.length - 1];
  if (!primero || !ultimo) return;
  const activo = document.activeElement;
  if (evento.shiftKey && (activo === primero || !dialogo.value.contains(activo))) {
    evento.preventDefault();
    ultimo.focus();
  } else if (!evento.shiftKey && (activo === ultimo || !dialogo.value.contains(activo))) {
    evento.preventDefault();
    primero.focus();
  }
}

watch(
  () => props.abierto,
  async (abierto, estabaAbierto) => {
    // Al montarse cerrado no hay nada que restaurar (no se toca el overflow de otros modales).
    if (!abierto && !estabaAbierto) return;
    document.body.style.overflow = abierto ? 'hidden' : '';
    if (abierto) {
      focoPrevio = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      document.addEventListener('keydown', alPulsarTecla);
      await nextTick();
      botonCerrar.value?.focus();
    } else {
      document.removeEventListener('keydown', alPulsarTecla);
      focoPrevio?.focus();
      focoPrevio = null;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  document.body.style.overflow = '';
  document.removeEventListener('keydown', alPulsarTecla);
});
</script>
