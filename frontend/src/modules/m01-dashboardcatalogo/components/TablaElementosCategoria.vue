<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm" aria-label="Elementos de la categoría">
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
        <label class="flex items-center gap-2 text-xs font-medium text-neutral-medium">
          Ordenar por
          <select
            :value="filtros.orden.campo"
            class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action"
            @change="$emit('ordenar', ($event.target as HTMLSelectElement).value as CampoOrdenElementoCategoria)"
          >
            <option v-for="col in columnasOrdenables" :key="col.campo" :value="col.campo">{{ col.etiqueta }}</option>
          </select>
        </label>
      </div>
    </header>

    <Table
      :columns="columnas"
      :rows="elementosPaginados as unknown as Record<string, unknown>[]"
      row-key="id"
      mobile-cards
      selectable
      selection-label-key="nombre"
      :model-value="seleccion"
      @update:model-value="(claves) => $emit('update:seleccion', claves.map(String))"
    >
      <template #empty>
        <p class="text-sm text-neutral-medium">No hay elementos que coincidan con la búsqueda.</p>
      </template>

      <template #cell-nombre="{ row }">
        <button
          type="button"
          class="block text-left font-medium text-neutral-black hover:text-action"
          @click="$emit('editar', (row as unknown as NodoCategoria).id)"
        >
          {{ (row as unknown as NodoCategoria).nombre }}
        </button>
      </template>

      <template #cell-tipo="{ row }">
        <span
          class="inline-flex items-center rounded-button px-2 py-0.5 text-xs font-medium"
          :class="(row as unknown as NodoCategoria).tipo === 'categoria' ? 'bg-subaction text-corporate' : 'bg-action/10 text-action'"
        >
          {{ (row as unknown as NodoCategoria).tipo === 'categoria' ? 'Categoría' : 'Subcategoría' }}
        </span>
      </template>

      <template #cell-padre="{ row }">{{ (row as unknown as NodoCategoria).padreNombre ?? '—' }}</template>

      <template #cell-productos="{ row }">
        <span class="block text-right font-medium tabular-nums">
          {{ formatearNumero((row as unknown as NodoCategoria).productosAsociados) }}
        </span>
      </template>

      <template #cell-estado="{ row }">
        <Badge
          :estado="(row as unknown as NodoCategoria).estado === 'publicado' ? 'success' : 'inactivo'"
          :label="(row as unknown as NodoCategoria).estado === 'publicado' ? 'Publicado' : 'Inactivo'"
          table
        />
      </template>

      <template #cell-orden="{ row }">
        <span class="block text-right tabular-nums">{{ (row as unknown as NodoCategoria).orden }}</span>
      </template>

      <template #cell-acciones="{ row }">
        <div class="flex justify-end">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
            :aria-label="`Acciones de ${(row as unknown as NodoCategoria).nombre}`"
            :aria-expanded="elementoActivo?.id === (row as unknown as NodoCategoria).id"
            aria-haspopup="menu"
            @click.stop="(e) => abrirMenu((row as unknown as NodoCategoria), e, (item) => item.id)"
          >
            <MoreVertical class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </template>
    </Table>

    <!-- Menú de acciones de fila -->
    <template v-if="elementoActivo">
      <div
        ref="menu-flotante"
        class="fixed z-30 w-44 overflow-hidden rounded-card border border-neutral-light bg-neutral-white py-1 text-left shadow-lg"
        :style="{ top: `${posMenu.top}px`, left: `${posMenu.left}px` }"
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest"
          @click="ejecutar('editar')"
        >
          <Pencil class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          Editar
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest"
          @click="ejecutar('desactivar')"
        >
          <Power class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          Desactivar
        </button>
      </div>
    </template>

    <div v-if="elementosPaginados.length" class="flex flex-col gap-2 border-t border-neutral-light sm:flex-row sm:items-center sm:justify-between">
      <Paginacion
        class="flex-1"
        :model-value="paginaActual"
        :total="total"
        :page-size="porPagina"
        @update:model-value="(n) => (paginaActual = n)"
      />
      <label class="flex items-center gap-2 px-4 py-2 text-xs text-neutral-medium sm:px-0">
        <select
          :value="porPagina"
          class="rounded-input border border-neutral-light bg-neutral-white px-2 py-1.5 text-sm text-neutral-dark outline-none focus:border-action"
          @change="(e) => { porPagina = Number((e.target as HTMLSelectElement).value); paginaActual = 1; }"
        >
          <option v-for="op in [10, 25, 50]" :key="op" :value="op">{{ op }} por página</option>
        </select>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Search, MoreVertical, Pencil, Power } from 'lucide-vue-next';
import { Table, Badge, Paginacion } from '@/core/components';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import { useMenuFlotante } from '../composables/useMenuFlotante';
import type {
  CampoOrdenElementoCategoria,
  FiltrosElementosCategoria,
  NodoCategoria,
} from '../interfaces';

const props = defineProps<{
  elementos: NodoCategoria[];
  filtros: FiltrosElementosCategoria;
  total: number;
  /** Ids de las filas seleccionadas (`v-model:seleccion` desde la vista). */
  seleccion?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:seleccion', ids: string[]): void;
  (e: 'ordenar', campo: CampoOrdenElementoCategoria): void;
  (e: 'buscar', texto: string): void;
  (e: 'filtrar-tipo', valor: string): void;
  (e: 'editar', id: string): void;
  (e: 'menu', id: string): void;
}>();

const { formatearNumero } = useFormatoCatalogo();

const columnas = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'padre', label: 'Padre' },
  { key: 'productos', label: 'Productos asociados' },
  { key: 'estado', label: 'Estado' },
  { key: 'orden', label: 'Orden' },
  { key: 'acciones', label: 'Acciones' },
];

const columnasOrdenables: { campo: CampoOrdenElementoCategoria; etiqueta: string }[] = [
  { campo: 'nombre', etiqueta: 'Nombre' },
  { campo: 'tipo', etiqueta: 'Tipo' },
  { campo: 'padre', etiqueta: 'Padre' },
  { campo: 'productos', etiqueta: 'Productos asociados' },
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'orden', etiqueta: 'Orden' },
];

// Paginación local
const paginaActual = ref(1);
const porPagina = ref(10);

const elementosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value;
  return props.elementos.slice(inicio, inicio + porPagina.value);
});

// Menú flotante por fila
const {
  activo: elementoActivo,
  pos: posMenu,
  abrir: abrirMenu,
  cerrar: cerrarMenu,
} = useMenuFlotante<NodoCategoria>();

function ejecutar(accion: 'editar' | 'desactivar'): void {
  const item = elementoActivo.value;
  cerrarMenu();
  if (!item) return;
  if (accion === 'editar') emit('editar', item.id);
  else emit('menu', item.id);
}
</script>
