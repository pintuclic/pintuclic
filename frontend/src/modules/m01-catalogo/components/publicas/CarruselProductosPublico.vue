<template>
  <section
    class="relative"
    role="region"
    aria-roledescription="carrusel"
    :aria-label="etiqueta"
    data-carrusel
  >
    <!--
      Carrusel MANUAL: solo avanza con las flechas, deslizando o con el teclado.
      No hay avance automático ni temporizadores (decisión del líder técnico).
    -->
    <div
      ref="pista"
      class="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      :class="variante === 'inicio' ? 'gap-3.5' : 'gap-4'"
      tabindex="0"
      :aria-label="`${etiqueta}: usa las flechas para ver más`"
      @scroll.passive="actualizarFlechas"
      @keydown.left.prevent="desplazar(-1)"
      @keydown.right.prevent="desplazar(1)"
    >
      <div
        v-for="(elemento, indice) in elementos"
        :key="claveDe(elemento, indice)"
        class="shrink-0 snap-start"
        :class="ANCHOS[variante]"
        role="group"
        aria-roledescription="diapositiva"
        :aria-label="`${indice + 1} de ${elementos.length}`"
      >
        <slot name="elemento" :elemento="elemento" :indice="indice" />
      </div>
    </div>

    <template v-if="desborda">
      <button
        type="button"
        class="absolute left-0 top-1/2 z-10 grid h-10 w-10 -translate-x-1/3 -translate-y-1/2 place-items-center rounded-full border border-neutral-light bg-neutral-white text-corporate shadow-md transition-opacity hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:pointer-events-none disabled:opacity-0"
        :aria-label="`Ver productos anteriores de ${etiqueta}`"
        :disabled="!puedeAnterior"
        data-anterior
        @click="desplazar(-1)"
      >
        <ChevronLeft :size="20" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="absolute right-0 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 translate-x-1/3 place-items-center rounded-full border border-neutral-light bg-neutral-white text-corporate shadow-md transition-opacity hover:text-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:pointer-events-none disabled:opacity-0"
        :aria-label="`Ver más productos de ${etiqueta}`"
        :disabled="!puedeSiguiente"
        data-siguiente
        @click="desplazar(1)"
      >
        <ChevronRight :size="20" aria-hidden="true" />
      </button>
    </template>
  </section>
</template>

<script setup lang="ts" generic="T">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    elementos: readonly T[];
    /** Nombre accesible del carrusel (p. ej. «Productos destacados»). */
    etiqueta: string;
    /** Tarjetas visibles por pantalla: catálogo hasta 4 (junto al panel), inicio hasta 5. */
    variante?: 'catalogo' | 'inicio';
    claveDe?: (elemento: T, indice: number) => string | number;
  }>(),
  { variante: 'catalogo', claveDe: (_elemento: unknown, indice: number) => indice },
);

/** Ancho de cada diapositiva según las tarjetas visibles y el espacio entre ellas. */
const ANCHOS = {
  catalogo: 'basis-full min-[480px]:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)] xl:basis-[calc((100%-3rem)/4)]',
  inicio: 'basis-full min-[420px]:basis-[calc((100%-0.875rem)/2)] sm:basis-[calc((100%-1.75rem)/3)] md:basis-[calc((100%-2.625rem)/4)] lg:basis-[calc((100%-3.5rem)/5)]',
} as const;

const pista = ref<HTMLElement | null>(null);
const puedeAnterior = ref(false);
const puedeSiguiente = ref(false);
const desborda = ref(false);

function actualizarFlechas(): void {
  const el = pista.value;
  if (!el) return;
  desborda.value = el.scrollWidth - el.clientWidth > 1;
  puedeAnterior.value = el.scrollLeft > 1;
  puedeSiguiente.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
}

/** Avanza o retrocede una «pantalla» de tarjetas. */
function desplazar(direccion: -1 | 1): void {
  const el = pista.value;
  if (!el) return;
  const reducirMovimiento = typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof el.scrollBy !== 'function') return;
  el.scrollBy({ left: direccion * el.clientWidth, behavior: reducirMovimiento ? 'auto' : 'smooth' });
}

let observador: InstanceType<typeof window.ResizeObserver> | null = null;

onMounted(() => {
  actualizarFlechas();
  if (typeof window.ResizeObserver !== 'undefined' && pista.value) {
    observador = new window.ResizeObserver(actualizarFlechas);
    observador.observe(pista.value);
  }
});

// Nuevos resultados (filtro, página): vuelve al inicio de la fila y recalcula las flechas.
watch(() => props.elementos, async () => {
  await nextTick();
  if (typeof pista.value?.scrollTo === 'function') pista.value.scrollTo({ left: 0 });
  actualizarFlechas();
});

onBeforeUnmount(() => observador?.disconnect());

defineExpose({ desplazar, actualizarFlechas });
</script>
