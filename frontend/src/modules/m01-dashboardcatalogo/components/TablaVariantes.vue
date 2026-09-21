<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm" aria-label="Listado de variantes">
    <header class="border-b border-neutral-light p-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-base font-semibold text-neutral-black">
          Variantes <span class="text-neutral-medium">({{ formatearNumero(pagina.total) }})</span>
        </h2>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-xs font-medium text-neutral-medium">
            Ordenar por
            <select
              :value="filtros.orden.campo"
              class="rounded-input border border-neutral-light bg-neutral-white px-2.5 py-1.5 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30"
              @change="$emit('ordenar', ($event.target as HTMLSelectElement).value as CampoOrdenVariantes)"
            >
              <option v-for="col in columnasOrdenables" :key="col.campo" :value="col.campo">{{ col.etiqueta }}</option>
            </select>
          </label>
          <Button variant="outline" size="sm" :icon="Download" @click="$emit('exportar')">
            Exportar
          </Button>
        </div>
      </div>
    </header>

    <Table
      :columns="columnas"
      :rows="items as unknown as Record<string, unknown>[]"
      row-key="id"
      :loading="cargando"
      mobile-cards
      selectable
      selection-label-key="productoNombre"
      :model-value="seleccion"
      @update:model-value="(claves) => $emit('update:seleccion', claves.map(String))"
    >
      <template #empty>
        <p class="text-sm text-neutral-medium">No hay variantes que coincidan con los filtros aplicados.</p>
      </template>

      <template #cell-producto="{ row }">
        <button
          type="button"
          class="block truncate text-left font-medium text-neutral-black hover:text-action"
          @click="$emit('editar', (row as unknown as VarianteListado).id)"
        >
          {{ (row as unknown as VarianteListado).productoNombre }}
        </button>
        <span class="block truncate text-xs text-neutral-medium">{{ (row as unknown as VarianteListado).marca }}</span>
      </template>

      <template #cell-presentacion="{ row }">{{ (row as unknown as VarianteListado).presentacion }}</template>
      <template #cell-base="{ row }">{{ (row as unknown as VarianteListado).base ?? (row as unknown as VarianteListado).color ?? 'N/A' }}</template>
      <template #cell-codigo="{ row }">
        <span class="font-mono text-xs text-neutral-dark break-all">{{ (row as unknown as VarianteListado).codigoProveedor }}</span>
      </template>

      <template #cell-precio="{ row }">
        <span class="block text-right font-medium text-neutral-dark tabular-nums">
          ${{ formatearNumero((row as unknown as VarianteListado).precio) }}
        </span>
      </template>

      <template #cell-existencia="{ row }">
        <span
          class="block text-right tabular-nums"
          :class="(row as unknown as VarianteListado).existenciaReferencial <= 0 ? 'text-neutral-medium' : 'text-neutral-dark'"
        >
          {{ formatearNumero((row as unknown as VarianteListado).existenciaReferencial) }}
        </span>
      </template>

      <template #cell-estado="{ row }">
        <Badge
          :estado="tonoEstado(row as unknown as VarianteListado)"
          :label="etiquetaEstado(row as unknown as VarianteListado)"
          table
        />
      </template>

      <template #cell-acciones="{ row }">
        <div class="flex justify-end">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
            :aria-label="`Acciones de ${(row as unknown as VarianteListado).productoNombre} ${(row as unknown as VarianteListado).presentacion}`"
            :aria-expanded="varianteActiva?.id === (row as unknown as VarianteListado).id"
            aria-haspopup="menu"
            @click.stop="(e) => abrirMenu((row as unknown as VarianteListado), e, (item) => item.id)"
          >
            <MoreVertical class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </template>
    </Table>

    <!-- Menú de acciones de fila -->
    <template v-if="varianteActiva">
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
          Editar variante
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
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest"
          @click="ejecutar('alternar')"
        >
          <Power class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          {{ varianteActiva.estado === 'inactivo' ? 'Activar' : 'Desactivar' }}
        </button>
      </div>
    </template>

    <div v-if="!cargando && items.length" class="flex flex-col gap-2 border-t border-neutral-light sm:flex-row sm:items-center sm:justify-between">
      <Paginacion
        class="flex-1"
        :model-value="pagina.pagina"
        :total="pagina.total"
        :page-size="pagina.porPagina"
        @update:model-value="(n) => $emit('ir-pagina', n)"
      />
      <label class="flex items-center gap-2 px-4 py-2 text-xs text-neutral-medium sm:px-0">
        <select
          :value="pagina.porPagina"
          class="rounded-input border border-neutral-light bg-neutral-white px-2 py-1.5 text-sm text-neutral-dark outline-none focus:border-action"
          @change="$emit('por-pagina', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="op in [10, 25, 50]" :key="op" :value="op">{{ op }} por página</option>
        </select>
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Download,
  MoreVertical,
  Pencil,
  Copy,
  Power,
} from 'lucide-vue-next';
import { Table, Badge, Button, Paginacion } from '@/core/components';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import { useMenuFlotante } from '../composables/useMenuFlotante';
import type {
  CampoOrdenVariantes,
  FiltrosVariantes,
  PaginaVariantes,
  VarianteListado,
} from '../interfaces';

const props = defineProps<{
  pagina: PaginaVariantes;
  filtros: FiltrosVariantes;
  cargando?: boolean;
  /** Ids de las filas seleccionadas (`v-model:seleccion` desde la vista). */
  seleccion?: string[];
}>();

const emit = defineEmits<{
  (e: 'update:seleccion', ids: string[]): void;
  (e: 'ordenar', campo: CampoOrdenVariantes): void;
  (e: 'ir-pagina', numero: number): void;
  (e: 'por-pagina', numero: number): void;
  (e: 'editar', id: string): void;
  (e: 'duplicar', id: string): void;
  (e: 'alternar', id: string): void;
  (e: 'exportar'): void;
}>();

const { formatearNumero } = useFormatoCatalogo();

/** Mapeo de estado de la variante -> tono de `Badge` del Core (no hay 1:1 exacto). */
function tonoEstado(v: VarianteListado): string {
  if (v.estado === 'activo' && v.existenciaReferencial <= 0) return 'warning';
  if (v.estado === 'activo') return 'success';
  if (v.estado === 'inactivo') return 'inactivo';
  return 'info';
}
function etiquetaEstado(v: VarianteListado): string {
  if (v.estado === 'activo' && v.existenciaReferencial <= 0) return 'Sin stock';
  if (v.estado === 'activo') return 'Activo';
  if (v.estado === 'inactivo') return 'Inactivo';
  return 'Borrador';
}

const columnas = [
  { key: 'producto', label: 'Producto' },
  { key: 'presentacion', label: 'Presentación' },
  { key: 'base', label: 'Base' },
  { key: 'codigo', label: 'Código' },
  { key: 'precio', label: 'Precio' },
  { key: 'existencia', label: 'Exist.' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones' },
];

const columnasOrdenables: { campo: CampoOrdenVariantes; etiqueta: string }[] = [
  { campo: 'producto', etiqueta: 'Producto' },
  { campo: 'presentacion', etiqueta: 'Presentación' },
  { campo: 'base', etiqueta: 'Base' },
  { campo: 'codigo', etiqueta: 'Código' },
  { campo: 'precio', etiqueta: 'Precio' },
  { campo: 'existencia', etiqueta: 'Existencia' },
  { campo: 'estado', etiqueta: 'Estado' },
];

const items = computed(() => props.pagina.items);

// --- Menú de acciones por fila ---
const {
  activo: varianteActiva,
  pos: posMenu,
  abrir: abrirMenu,
  cerrar: cerrarMenu,
} = useMenuFlotante<VarianteListado>();

function ejecutar(accion: 'editar' | 'duplicar' | 'alternar'): void {
  const id = varianteActiva.value?.id;
  cerrarMenu();
  if (!id) return;
  if (accion === 'editar') emit('editar', id);
  else if (accion === 'duplicar') emit('duplicar', id);
  else emit('alternar', id);
}
</script>
