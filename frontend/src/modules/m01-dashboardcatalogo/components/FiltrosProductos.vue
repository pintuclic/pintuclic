<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm"
    aria-label="Filtros de productos"
  >
    <!-- Búsqueda + limpiar -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-medium"
          aria-hidden="true"
        />
        <input
          :value="filtros.busqueda"
          type="search"
          placeholder="Buscar por nombre, SKU o referencia…"
          class="w-full rounded-input border border-neutral-light bg-neutral-lightest py-2 pl-9 pr-3 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          aria-label="Buscar productos"
          @input="onBuscar(($event.target as HTMLInputElement).value)"
        />
      </div>
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

    <!-- Selectores -->
    <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <label class="flex flex-col gap-1 text-xs font-medium text-neutral-medium">
        Categoría
        <select
          :value="filtros.categoriaId ?? ''"
          class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          @change="emitirOpcion('categoriaId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todas las categorías</option>
          <option v-for="op in opciones.categorias" :key="op.valor" :value="op.valor">
            {{ op.etiqueta }}
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-1 text-xs font-medium text-neutral-medium">
        Marca
        <select
          :value="filtros.marcaId ?? ''"
          class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          @change="emitirOpcion('marcaId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todas las marcas</option>
          <option v-for="op in opciones.marcas" :key="op.valor" :value="op.valor">
            {{ op.etiqueta }}
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-1 text-xs font-medium text-neutral-medium">
        Línea
        <select
          :value="filtros.lineaId ?? ''"
          class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          @change="emitirOpcion('lineaId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todas las líneas</option>
          <option v-for="op in opciones.lineas" :key="op.valor" :value="op.valor">
            {{ op.etiqueta }}
          </option>
        </select>
      </label>

      <label class="flex flex-col gap-1 text-xs font-medium text-neutral-medium">
        Estado
        <select
          :value="filtros.estado ?? ''"
          class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          @change="emitirEnum('estado', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todos los estados</option>
          <option value="publicado">Publicado</option>
          <option value="borrador">Borrador</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </label>

      <label class="flex flex-col gap-1 text-xs font-medium text-neutral-medium">
        Tipo de color
        <select
          :value="filtros.claseColor ?? ''"
          class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
          @change="emitirEnum('claseColor', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todos los tipos</option>
          <option value="entonable">Entonable</option>
          <option value="colores_fijos">Colores fijos</option>
          <option value="sin_color">Sin color</option>
        </select>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { Search, FilterX } from 'lucide-vue-next';
import type {
  FiltrosProductos,
  OpcionesFiltroProductos,
  EstadoProducto,
  ClaseColorProducto,
} from '../interfaces';

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

function emitirOpcion(campo: 'categoriaId' | 'marcaId' | 'lineaId', valor: string): void {
  emit('cambiar', { [campo]: valor === '' ? null : valor });
}

function emitirEnum(campo: 'estado' | 'claseColor', valor: string): void {
  if (campo === 'estado') {
    emit('cambiar', { estado: valor === '' ? null : (valor as EstadoProducto) });
  } else {
    emit('cambiar', { claseColor: valor === '' ? null : (valor as ClaseColorProducto) });
  }
}
</script>
