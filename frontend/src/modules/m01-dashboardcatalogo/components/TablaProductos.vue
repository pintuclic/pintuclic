<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm" aria-label="Listado de productos">
    <header class="border-b border-neutral-light p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm font-semibold text-neutral-black">
          {{ formatearNumero(total) }} productos encontrados
        </p>
        <label class="flex items-center gap-2 text-xs font-medium text-neutral-medium">
          Ordenar por
          <select
            :value="filtros.orden"
            class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-1.5 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
            @change="$emit('ordenar', ($event.target as HTMLSelectElement).value as OrdenProductos)"
          >
            <option value="recientes">Más recientes</option>
            <option value="nombre_asc">Nombre A–Z</option>
            <option value="nombre_desc">Nombre Z–A</option>
            <option value="variantes_desc">Más variantes</option>
          </select>
        </label>
      </div>
    </header>

    <Table
      :columns="columnas"
      :rows="items as unknown as Record<string, unknown>[]"
      row-key="id"
      :loading="cargando"
      mobile-cards
      selectable
      selection-label-key="nombre"
      :model-value="seleccion"
      @update:model-value="(claves) => $emit('update:seleccion', claves.map(String))"
    >
      <template #empty>
        <p class="text-sm text-neutral-medium">No hay productos que coincidan con los filtros aplicados.</p>
      </template>

      <template #cell-imagen="{ row }">
        <span
          class="grid h-10 w-10 place-items-center rounded-input border border-neutral-light bg-neutral-lightest text-neutral-medium"
        >
          <img
            v-if="(row as unknown as ProductoListado).imagenUrl"
            :src="(row as unknown as ProductoListado).imagenUrl ?? undefined"
            :alt="(row as unknown as ProductoListado).nombre"
            class="h-full w-full rounded-input object-cover"
          />
          <Package v-else class="h-4 w-4" aria-hidden="true" />
        </span>
      </template>

      <template #cell-producto="{ row }">
        <button
          type="button"
          class="block text-left font-medium text-neutral-black hover:text-action"
          @click="$emit('abrir', (row as unknown as ProductoListado).id)"
        >
          {{ (row as unknown as ProductoListado).nombre }}
        </button>
      </template>

      <template #cell-marca="{ row }">{{ (row as unknown as ProductoListado).marca }}</template>
      <template #cell-categoria="{ row }">{{ (row as unknown as ProductoListado).categoria }}</template>
      <template #cell-linea="{ row }">{{ (row as unknown as ProductoListado).linea ?? '—' }}</template>

      <template #cell-variantes="{ row }">
        <span class="block text-center tabular-nums">{{ (row as unknown as ProductoListado).totalVariantes }}</span>
      </template>

      <template #cell-estado="{ row }">
        <Badge :estado="tonoEstado((row as unknown as ProductoListado).estado)" :label="etiquetaEstado((row as unknown as ProductoListado).estado)" table />
      </template>

      <template #cell-actualizacion="{ row }">
        <span class="block text-neutral-dark">{{ formatearFechaHora((row as unknown as ProductoListado).actualizadoEn) }}</span>
        <span class="text-xs text-neutral-medium">por {{ (row as unknown as ProductoListado).actualizadoPor }}</span>
      </template>

      <template #cell-acciones="{ row }">
        <div class="flex justify-end">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
            :aria-label="`Acciones de ${(row as unknown as ProductoListado).nombre}`"
            :aria-expanded="filaMenuActiva === (row as unknown as ProductoListado).id"
            aria-haspopup="menu"
            @click.stop="(e) => abrirMenu((row as unknown as ProductoListado).id, e, (id) => id)"
          >
            <MoreVertical class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </template>
    </Table>

    <!-- Menú de acciones de fila: `position: fixed` reposicionado en cada scroll
         para quedar siempre pegado a su botón sin recortarse en la tabla. -->
    <template v-if="filaMenuActiva">
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
          Editar producto
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest"
          @click="ejecutar('abrir')"
        >
          <Eye class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          Ver detalle
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest"
          @click="ejecutar('duplicar')"
        >
          <Copy class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          Duplicar
        </button>
      </div>
    </template>

    <div v-if="!cargando && items.length" class="border-t border-neutral-light">
      <Paginacion
        :model-value="pagina.pagina"
        :total="pagina.total"
        :page-size="pagina.porPagina"
        @update:model-value="(n) => $emit('ir-pagina', n)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Package, MoreVertical, Pencil, Eye, Copy } from 'lucide-vue-next';
import { Table, Badge, Paginacion } from '@/core/components';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import { useMenuFlotante } from '../composables/useMenuFlotante';
import type { FiltrosProductos, OrdenProductos, PaginaProductos, ProductoListado, EstadoProducto } from '../interfaces';

const props = defineProps<{
  pagina: PaginaProductos;
  filtros: FiltrosProductos;
  cargando?: boolean;
  /** Ids de las filas seleccionadas (`v-model:seleccion` desde la vista). */
  seleccion?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:seleccion', ids: string[]): void;
  (e: 'ordenar', orden: OrdenProductos): void;
  (e: 'ir-pagina', numero: number): void;
  (e: 'abrir', id: string): void;
  (e: 'editar', id: string): void;
  (e: 'duplicar', id: string): void;
}>();

const columnas = [
  { key: 'imagen', label: 'Imagen' },
  { key: 'producto', label: 'Producto' },
  { key: 'marca', label: 'Marca' },
  { key: 'categoria', label: 'Categoría' },
  { key: 'linea', label: 'Línea' },
  { key: 'variantes', label: 'Variantes' },
  { key: 'estado', label: 'Estado' },
  { key: 'actualizacion', label: 'Actualización' },
  { key: 'acciones', label: 'Acciones' },
];

// --- Menú de acciones por fila (position: fixed, ver useMenuFlotante) -------
const {
  activo: filaMenuActiva,
  pos: posMenu,
  abrir: abrirMenu,
  cerrar: cerrarMenu,
} = useMenuFlotante<string>();

function ejecutar(accion: 'editar' | 'abrir' | 'duplicar'): void {
  const id = filaMenuActiva.value;
  cerrarMenu();
  if (!id) return;
  if (accion === 'editar') emit('editar', id);
  else if (accion === 'duplicar') emit('duplicar', id);
  else emit('abrir', id);
}

const { formatearNumero, formatearFechaHora } = useFormatoCatalogo();

const items = computed(() => props.pagina.items);
const total = computed(() => props.pagina.total);

/** Mapeo de estado del producto -> tono de `Badge` del Core (no hay 1:1 exacto). */
function tonoEstado(estado: EstadoProducto): string {
  if (estado === 'publicado') return 'success';
  if (estado === 'inactivo') return 'inactivo';
  return 'info';
}
function etiquetaEstado(estado: EstadoProducto): string {
  if (estado === 'publicado') return 'Publicado';
  if (estado === 'inactivo') return 'Inactivo';
  return 'Borrador';
}
</script>
