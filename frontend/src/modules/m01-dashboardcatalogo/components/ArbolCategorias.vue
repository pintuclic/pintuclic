<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    aria-label="Estructura de categorías"
  >
    <header class="border-b border-neutral-light p-4">
      <h2 class="text-base font-semibold text-neutral-black">Estructura de categorías</h2>
      <p class="mt-0.5 text-sm text-neutral-medium">
        Navega y selecciona una categoría para ver sus detalles.
      </p>
      <div class="relative mt-3">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-medium"
          aria-hidden="true"
        />
        <input
          :value="busqueda"
          type="search"
          placeholder="Buscar categoría…"
          class="w-full rounded-input border border-neutral-light bg-neutral-lightest py-2 pl-9 pr-3 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          aria-label="Buscar categoría"
          @input="$emit('buscar', ($event.target as HTMLInputElement).value)"
        />
      </div>
    </header>

    <div v-if="cargando" class="space-y-2 p-4">
      <div v-for="n in 6" :key="n" class="h-9 animate-pulse rounded-input bg-neutral-lightest" />
    </div>

    <p v-else-if="!arbol.length" class="p-6 text-center text-sm text-neutral-medium">
      No hay categorías que coincidan con la búsqueda.
    </p>

    <ul v-else class="max-h-[32rem] overflow-y-auto p-2">
      <li v-for="cat in arbol" :key="cat.id">
        <div
          class="flex items-center gap-1 rounded-button"
          :class="cat.id === seleccionadaId ? 'bg-subaction' : 'hover:bg-neutral-lightest'"
        >
          <button
            type="button"
            class="grid h-8 w-7 shrink-0 place-items-center text-neutral-medium"
            :aria-label="expandidas.has(cat.id) ? 'Contraer' : 'Expandir'"
            @click="$emit('alternar', cat.id)"
          >
            <ChevronDown v-if="expandidas.has(cat.id)" class="h-4 w-4" aria-hidden="true" />
            <ChevronRight v-else class="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="flex flex-1 items-center justify-between gap-2 py-2 pr-2 text-left text-sm font-medium"
            :class="cat.id === seleccionadaId ? 'text-corporate' : 'text-neutral-dark'"
            :aria-current="cat.id === seleccionadaId ? 'true' : undefined"
            @click="$emit('seleccionar', cat.id)"
          >
            {{ cat.nombre }}
            <span class="text-xs font-normal text-neutral-medium">{{ cat.hijos.length }}</span>
          </button>
        </div>

        <ul v-if="expandidas.has(cat.id)" class="mb-1 ml-7 border-l border-neutral-light">
          <li v-for="sub in cat.hijos" :key="sub.id">
            <button
              type="button"
              class="flex w-full items-center gap-2 rounded-button py-1.5 pl-3 pr-2 text-left text-sm text-neutral-medium hover:bg-neutral-lightest hover:text-neutral-dark"
            >
              <span class="h-1 w-1 rounded-full bg-neutral-light" aria-hidden="true" />
              {{ sub.nombre }}
            </button>
          </li>
        </ul>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { Search, ChevronDown, ChevronRight } from 'lucide-vue-next';
import type { CategoriaConHijos } from '../interfaces';

defineProps<{
  arbol: CategoriaConHijos[];
  seleccionadaId: string | null;
  expandidas: Set<string>;
  busqueda: string;
  cargando?: boolean;
}>();

defineEmits<{
  (e: 'seleccionar', id: string): void;
  (e: 'alternar', id: string): void;
  (e: 'buscar', texto: string): void;
}>();
</script>
