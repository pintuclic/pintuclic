<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm"
    aria-label="Filtros de productos"
  >
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-medium"
          aria-hidden="true"
        />
        <input
          :value="filtros.busqueda"
          type="search"
          placeholder="Buscar por nombre…"
          class="w-full rounded-input border border-neutral-light bg-neutral-lightest py-2 pl-9 pr-3 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          aria-label="Buscar productos"
          @input="onBuscar(($event.target as HTMLInputElement).value)"
        />
      </div>

      <label class="flex flex-col gap-1 text-xs font-medium text-neutral-medium sm:w-56">
        Marca
        <select
          :value="filtros.marcaId ?? ''"
          class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          @change="emit('cambiar', { marcaId: ($event.target as HTMLSelectElement).value || null })"
        >
          <option value="">Todas las marcas</option>
          <option v-for="op in opciones.marcas" :key="op.valor" :value="op.valor">
            {{ op.etiqueta }}
          </option>
        </select>
      </label>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 self-start rounded-button px-3 py-2 text-sm font-medium text-action hover:bg-subaction disabled:cursor-not-allowed disabled:text-neutral-medium disabled:hover:bg-transparent sm:self-auto"
        :disabled="!hayFiltrosActivos"
        @click="$emit('limpiar')"
      >
        <FilterX class="h-4 w-4" aria-hidden="true" />
        Limpiar filtros
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { Search, FilterX } from 'lucide-vue-next';
import type { FiltrosProductos, OpcionesFiltroProductos } from '../interfaces';

/**
 * El backend real de catálogo (`GET /catalogo/productos`) solo acepta `q`
 * (búsqueda) e `idMarca` como filtros de servidor — por eso el resto de
 * selects (categoría, línea, estado, tipo de color) se retiraron de aquí.
 */
defineProps<{
  filtros: FiltrosProductos;
  opciones: OpcionesFiltroProductos;
  hayFiltrosActivos: boolean;
}>();

const emit = defineEmits<{
  (e: 'cambiar', parcial: Partial<FiltrosProductos>): void;
  (e: 'limpiar'): void;
}>();

// Búsqueda con rebote para no lanzar una petición por tecla.
let temporizador: ReturnType<typeof setTimeout> | undefined;
function onBuscar(valor: string): void {
  clearTimeout(temporizador);
  temporizador = setTimeout(() => emit('cambiar', { busqueda: valor }), 300);
}
onBeforeUnmount(() => clearTimeout(temporizador));
</script>
