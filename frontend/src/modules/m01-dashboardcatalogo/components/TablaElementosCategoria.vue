<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    aria-label="Elementos de la categoría"
  >
    <header class="border-b border-neutral-light p-4">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-neutral-black">Elementos de esta categoría</h3>
          <p class="mt-0.5 text-sm text-neutral-medium">
            Visualiza y gestiona las subcategorías y productos asociados.
          </p>
        </div>
      </div>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <div class="relative min-w-[12rem] flex-1">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-medium"
            aria-hidden="true"
          />
          <input
            :value="filtros.busqueda"
            type="search"
            placeholder="Buscar por nombre…"
            class="w-full rounded-input border border-neutral-light bg-neutral-lightest py-2 pl-9 pr-3 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
            aria-label="Buscar elemento"
            @input="$emit('buscar', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <select
          :value="filtros.tipo ?? ''"
          class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action"
          aria-label="Filtrar por tipo"
          @change="$emit('filtrar-tipo', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todos los tipos</option>
          <option value="categoria">Categorías</option>
          <option value="subcategoria">Subcategorías</option>
        </select>
      </div>
    </header>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-light text-xs uppercase tracking-wide text-neutral-medium">
            <th scope="col" class="w-10 px-4 py-3">
              <input type="checkbox" class="accent-action" aria-label="Seleccionar todos" />
            </th>
            <th
              v-for="col in columnas"
              :key="col.campo"
              scope="col"
              class="px-3 py-3 font-semibold"
              :class="col.alineado === 'derecha' ? 'text-right' : ''"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1 hover:text-neutral-dark"
                @click="$emit('ordenar', col.campo)"
              >
                {{ col.etiqueta }}
                <ArrowUp
                  v-if="filtros.orden.campo === col.campo && filtros.orden.direccion === 'asc'"
                  class="h-3 w-3"
                  aria-hidden="true"
                />
                <ArrowDown
                  v-else-if="filtros.orden.campo === col.campo"
                  class="h-3 w-3"
                  aria-hidden="true"
                />
                <ChevronsUpDown v-else class="h-3 w-3 opacity-40" aria-hidden="true" />
              </button>
            </th>
            <th scope="col" class="px-3 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="el in elementos"
            :key="el.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="px-4 py-3">
              <input type="checkbox" class="accent-action" :aria-label="`Seleccionar ${el.nombre}`" />
            </td>
            <td class="px-3 py-3 font-medium text-neutral-black">{{ el.nombre }}</td>
            <td class="px-3 py-3">
              <span
                class="inline-flex items-center rounded-button px-2 py-0.5 text-xs font-medium"
                :class="el.tipo === 'categoria' ? 'bg-subaction text-corporate' : 'bg-action/10 text-action'"
              >
                {{ el.tipo === 'categoria' ? 'Categoría' : 'Subcategoría' }}
              </span>
            </td>
            <td class="px-3 py-3 text-neutral-dark">{{ el.padreNombre ?? '—' }}</td>
            <td class="px-3 py-3 text-right font-medium text-neutral-dark tabular-nums">
              {{ formatearNumero(el.productosAsociados) }}
            </td>
            <td class="px-3 py-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                :class="el.estado === 'publicado' ? 'bg-conversion/10 text-conversion' : 'bg-neutral-light text-neutral-medium'"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ el.estado === 'publicado' ? 'Publicado' : 'Inactivo' }}
              </span>
            </td>
            <td class="px-3 py-3 text-right tabular-nums text-neutral-dark">{{ el.orden }}</td>
            <td class="px-3 py-3 text-right">
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                :aria-label="`Acciones de ${el.nombre}`"
                @click="$emit('menu', el.id)"
              >
                <MoreVertical class="h-4 w-4" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="flex items-center justify-between gap-3 border-t border-neutral-light px-5 py-3 text-sm text-neutral-medium">
      <span>Mostrando {{ elementos.length }} de {{ total }} elementos</span>
      <span class="text-xs">10 por página</span>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { Search, ArrowUp, ArrowDown, ChevronsUpDown, MoreVertical } from 'lucide-vue-next';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type {
  CampoOrdenElementoCategoria,
  FiltrosElementosCategoria,
  NodoCategoria,
} from '../interfaces';

defineProps<{
  elementos: NodoCategoria[];
  filtros: FiltrosElementosCategoria;
  total: number;
}>();

defineEmits<{
  (e: 'ordenar', campo: CampoOrdenElementoCategoria): void;
  (e: 'buscar', texto: string): void;
  (e: 'filtrar-tipo', valor: string): void;
  (e: 'menu', id: string): void;
}>();

const { formatearNumero } = useFormatoCatalogo();

const columnas: { campo: CampoOrdenElementoCategoria; etiqueta: string; alineado?: 'derecha' }[] = [
  { campo: 'nombre', etiqueta: 'Nombre' },
  { campo: 'tipo', etiqueta: 'Tipo' },
  { campo: 'padre', etiqueta: 'Padre' },
  { campo: 'productos', etiqueta: 'Productos asociados', alineado: 'derecha' },
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'orden', etiqueta: 'Orden', alineado: 'derecha' },
];
</script>
