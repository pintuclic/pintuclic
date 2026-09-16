<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm" aria-label="Listado de líneas comerciales">
    <header class="border-b border-neutral-light p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm font-semibold text-neutral-black">
          {{ formatearNumero(pagina.total) }} líneas comerciales encontradas
        </p>
        <label class="flex items-center gap-2 text-xs font-medium text-neutral-medium">
          Ordenar por
          <select
            :value="orden"
            class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-1.5 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
            @change="$emit('ordenar', ($event.target as HTMLSelectElement).value as OrdenLineas)"
          >
            <option value="recientes">Más recientes</option>
            <option value="nombre_asc">Nombre A–Z</option>
            <option value="nombre_desc">Nombre Z–A</option>
            <option value="productos_desc">Más productos</option>
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
    >
      <template #empty>
        <p class="text-sm text-neutral-medium">No hay líneas comerciales que coincidan con los filtros aplicados.</p>
      </template>

      <template #cell-imagen="{ row }">
        <span class="grid h-10 w-10 place-items-center overflow-hidden rounded-input border border-neutral-light bg-neutral-lightest text-neutral-medium">
          <img
            v-if="(row as unknown as LineaListado).imagenUrl"
            :src="(row as unknown as LineaListado).imagenUrl ?? undefined"
            :alt="(row as unknown as LineaListado).nombre"
            class="h-full w-full object-cover"
          />
          <Rows3 v-else class="h-4 w-4" aria-hidden="true" />
        </span>
      </template>

      <template #cell-nombre="{ row }">
        <button
          type="button"
          class="block text-left font-medium text-neutral-black hover:text-action"
          @click="$emit('editar', (row as unknown as LineaListado))"
        >
          {{ (row as unknown as LineaListado).nombre }}
        </button>
        <span class="text-xs text-neutral-medium">{{ (row as unknown as LineaListado).descripcionCorta }}</span>
      </template>

      <template #cell-marca="{ row }">{{ (row as unknown as LineaListado).marca }}</template>
      <template #cell-gama="{ row }">{{ (row as unknown as LineaListado).gamaComercial }}</template>

      <template #cell-productos="{ row }">
        <span class="block text-center font-medium tabular-nums">
          {{ formatearNumero((row as unknown as LineaListado).productosAsociados) }}
        </span>
      </template>

      <template #cell-estado="{ row }">
        <Badge
          :estado="tonoEstado((row as unknown as LineaListado).estado)"
          :label="ETIQUETA_ESTADO[(row as unknown as LineaListado).estado]"
          table
        />
      </template>

      <template #cell-actualizacion="{ row }">
        <span class="block text-neutral-dark">{{ formatearFechaHora((row as unknown as LineaListado).actualizadoEn) }}</span>
        <span class="text-xs text-neutral-medium">por {{ (row as unknown as LineaListado).actualizadoPor }}</span>
      </template>

      <template #cell-acciones="{ row }">
        <div class="flex items-center justify-end gap-1">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
            :aria-label="`Editar ${(row as unknown as LineaListado).nombre}`"
            @click="$emit('editar', (row as unknown as LineaListado))"
          >
            <Pencil class="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
            :aria-label="`Desactivar ${(row as unknown as LineaListado).nombre}`"
            @click="$emit('desactivar', (row as unknown as LineaListado))"
          >
            <MoreVertical class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </template>
    </Table>

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
import { Rows3, Pencil, MoreVertical } from 'lucide-vue-next';
import { Table, Badge, Paginacion } from '@/core/components';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type { EstadoLinea, LineaListado, OrdenLineas, PaginaLineas } from '../interfaces';

const props = defineProps<{
  pagina: PaginaLineas;
  orden: OrdenLineas;
  cargando?: boolean;
}>();

defineEmits<{
  (e: 'editar', linea: LineaListado): void;
  (e: 'desactivar', linea: LineaListado): void;
  (e: 'ordenar', orden: OrdenLineas): void;
  (e: 'ir-pagina', numero: number): void;
}>();

const { formatearNumero, formatearFechaHora } = useFormatoCatalogo();
const items = computed(() => props.pagina.items);

const columnas = [
  { key: 'imagen', label: 'Imagen' },
  { key: 'nombre', label: 'Nombre de la línea' },
  { key: 'marca', label: 'Marca' },
  { key: 'gama', label: 'Gama comercial' },
  { key: 'productos', label: 'Productos asociados' },
  { key: 'estado', label: 'Estado' },
  { key: 'actualizacion', label: 'Actualización' },
  { key: 'acciones', label: 'Acciones' },
];

// Estados con tokens oficiales del design system (sin rojo/morado arbitrarios).
const ETIQUETA_ESTADO: Record<EstadoLinea, string> = {
  activa: 'Activa',
  inactiva: 'Inactiva',
  pausada: 'Pausada',
};

/** Mapeo de estado de la línea -> tono de `Badge` del Core (no hay 1:1 exacto). */
function tonoEstado(estado: EstadoLinea): string {
  if (estado === 'activa') return 'success';
  if (estado === 'inactiva') return 'inactivo';
  return 'warning';
}
</script>
