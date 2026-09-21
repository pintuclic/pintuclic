<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm" aria-label="Listado de marcas">
    <Table
      :columns="columnas"
      :rows="items as unknown as Record<string, unknown>[]"
      row-key="id"
      :loading="cargando"
      mobile-cards
    >
      <template #empty>
        <p class="text-sm text-neutral-medium">No hay marcas que coincidan con la búsqueda.</p>
      </template>

      <template #cell-marca="{ row }">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-input border border-neutral-light bg-neutral-lightest text-xs font-semibold uppercase text-neutral-medium">
            <img
              v-if="(row as unknown as MarcaListado).logoUrl"
              :src="(row as unknown as MarcaListado).logoUrl ?? undefined"
              :alt="(row as unknown as MarcaListado).nombre"
              class="h-full w-full rounded-input object-contain"
            />
            <template v-else>{{ (row as unknown as MarcaListado).nombre.slice(0, 2) }}</template>
          </span>
          <div>
            <button
              type="button"
              class="block text-left font-medium text-neutral-black hover:text-action"
              @click="$emit('detalle', (row as unknown as MarcaListado).id)"
            >
              {{ (row as unknown as MarcaListado).nombre }}
            </button>
          </div>
        </div>
      </template>

      <template #cell-lineas="{ row }">
        <span class="block text-center tabular-nums">{{ (row as unknown as MarcaListado).lineasAsociadas }}</span>
      </template>
      <template #cell-productos="{ row }">
        <span class="block text-center tabular-nums">{{ formatearNumero((row as unknown as MarcaListado).productos) }}</span>
      </template>
      <template #cell-colores="{ row }">
        <span class="block text-center tabular-nums">{{ (row as unknown as MarcaListado).colores }}</span>
      </template>

      <template #cell-estado="{ row }">
        <Badge
          :estado="(row as unknown as MarcaListado).estado === 'activa' ? 'activo' : 'inactivo'"
          :label="(row as unknown as MarcaListado).estado === 'activa' ? 'Activa' : 'Inactiva'"
          table
        />
      </template>

      <template #cell-acciones="{ row }">
        <div class="flex justify-end">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
            :aria-label="`Acciones de ${(row as unknown as MarcaListado).nombre}`"
            :aria-expanded="marcaActiva?.id === (row as unknown as MarcaListado).id"
            aria-haspopup="menu"
            @click.stop="(e) => abrirMenu((row as unknown as MarcaListado), e, (m) => m.id)"
          >
            <MoreVertical class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </template>
    </Table>

    <!-- Menú de acciones de fila -->
    <template v-if="marcaActiva">
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
          @click="ejecutar('detalle')"
        >
          <Eye class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          Ver detalle
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest"
          @click="ejecutar('editar')"
        >
          <Pencil class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          Editar marca
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
import { Pencil, MoreVertical, Eye } from 'lucide-vue-next';
import { Table, Badge, Paginacion } from '@/core/components';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import { useMenuFlotante } from '../composables/useMenuFlotante';
import type { MarcaListado, PaginaMarcas } from '../interfaces';

const props = defineProps<{
  pagina: PaginaMarcas;
  cargando?: boolean;
}>();

const emit = defineEmits<{
  (e: 'editar', marca: MarcaListado): void;
  (e: 'detalle', id: string): void;
  (e: 'ir-pagina', numero: number): void;
}>();

const columnas = [
  { key: 'marca', label: 'Marca' },
  { key: 'lineas', label: 'Líneas asociadas' },
  { key: 'productos', label: 'Productos' },
  { key: 'colores', label: 'Colores' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones' },
];

const { formatearNumero } = useFormatoCatalogo();
const items = computed(() => props.pagina.items);

const {
  activo: marcaActiva,
  pos: posMenu,
  abrir: abrirMenu,
  cerrar: cerrarMenu,
} = useMenuFlotante<MarcaListado>();

function ejecutar(accion: 'detalle' | 'editar'): void {
  const item = marcaActiva.value;
  cerrarMenu();
  if (!item) return;
  if (accion === 'detalle') emit('detalle', item.id);
  else emit('editar', item);
}
</script>
