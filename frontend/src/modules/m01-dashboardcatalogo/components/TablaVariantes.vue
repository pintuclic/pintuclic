<template>
  <TablaBase
    etiqueta="Listado de variantes"
    :cargando="cargando"
    :vacio="!items.length"
    mensaje-vacio="No hay variantes que coincidan con los filtros aplicados."
    :filas-skeleton="filtros.porPagina"
    alto-fila-skeleton="h-12"
  >
    <template #encabezado>
      <div class="flex items-center justify-between gap-4">
        <h2 class="text-base font-semibold text-neutral-black">
          Variantes <span class="text-neutral-medium">({{ formatearNumero(pagina.total) }})</span>
        </h2>
        <button
          type="button"
          class="inline-flex items-center gap-2 rounded-button border border-neutral-light px-3 py-1.5 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
          @click="$emit('exportar')"
        >
          <Download class="h-4 w-4" aria-hidden="true" />
          Exportar
        </button>
      </div>
    </template>

    <div class="overflow-x-auto">
      <table class="w-full table-fixed text-left text-sm">
        <colgroup>
          <col class="w-9" />
          <col />
          <col class="w-24" />
          <col class="w-20" />
          <col class="w-28" />
          <col class="w-24" />
          <col class="w-20" />
          <col class="w-24" />
          <col class="w-14" />
        </colgroup>
        <thead>
          <tr :class="CLASE_ENCABEZADO_TABLA">
            <th scope="col" class="px-3 py-3">
              <input
                type="checkbox"
                class="accent-action"
                :checked="todosSeleccionados"
                :indeterminate.prop="algunoSeleccionado && !todosSeleccionados"
                aria-label="Seleccionar todos"
                @change="alternarTodos(($event.target as HTMLInputElement).checked)"
              />
            </th>
            <th
              v-for="col in columnas"
              :key="col.campo"
              scope="col"
              class="px-2 py-3 font-semibold"
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
                  class="h-3 w-3 shrink-0"
                  aria-hidden="true"
                />
                <ArrowDown
                  v-else-if="filtros.orden.campo === col.campo"
                  class="h-3 w-3 shrink-0"
                  aria-hidden="true"
                />
                <ChevronsUpDown v-else class="h-3 w-3 shrink-0 opacity-40" aria-hidden="true" />
              </button>
            </th>
            <th scope="col" class="px-2 py-3 text-right font-semibold">Acc.</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="v in items"
            :key="v.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="px-3 py-3 align-top">
              <input
                type="checkbox"
                class="accent-action"
                :checked="seleccionados.has(v.id)"
                :aria-label="`Seleccionar ${v.productoNombre} ${v.presentacion}`"
                @change="alternarUno(v.id, ($event.target as HTMLInputElement).checked)"
              />
            </td>
            <td class="px-2 py-3">
              <button
                type="button"
                class="block truncate text-left font-medium text-neutral-black hover:text-action"
                @click="$emit('editar', v.id)"
              >
                {{ v.productoNombre }}
              </button>
              <span class="block truncate text-xs text-neutral-medium">{{ v.marca }}</span>
            </td>
            <td class="px-2 py-3 text-neutral-dark">{{ v.presentacion }}</td>
            <td class="px-2 py-3 text-neutral-dark">{{ v.base ?? v.color ?? 'N/A' }}</td>
            <td class="px-2 py-3 font-mono text-xs text-neutral-dark break-all">{{ v.codigoProveedor }}</td>
            <td class="px-2 py-3 text-right font-medium text-neutral-dark tabular-nums">
              ${{ formatearNumero(v.precio) }}
            </td>
            <td class="px-2 py-3 text-right tabular-nums" :class="v.existenciaReferencial <= 0 ? 'text-neutral-medium' : 'text-neutral-dark'">
              {{ formatearNumero(v.existenciaReferencial) }}
            </td>
            <td class="px-2 py-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-button px-2 py-1 text-xs font-medium"
                :class="estadoVariante(v).clases"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ estadoVariante(v).etiqueta }}
              </span>
            </td>
            <td class="px-2 py-3 text-right">
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                :aria-label="`Acciones de ${v.productoNombre} ${v.presentacion}`"
                :aria-expanded="varianteActiva?.id === v.id"
                aria-haspopup="menu"
                @click.stop="(e) => abrirMenu(v, e, (item) => item.id)"
              >
                <MoreVertical class="h-4 w-4" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

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
    </div>

    <template #pie>
      <PaginacionTabla
        :pagina="pagina.pagina"
        :por-pagina="pagina.porPagina"
        :total="pagina.total"
        :total-paginas="pagina.totalPaginas"
        etiqueta="variantes"
        :opciones-por-pagina="[10, 25, 50]"
        @ir-pagina="(n) => $emit('ir-pagina', n)"
        @por-pagina="(n) => $emit('por-pagina', n)"
      />
    </template>
  </TablaBase>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Download,
  MoreVertical,
  Pencil,
  Copy,
  Power,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from 'lucide-vue-next';
import TablaBase, { CLASE_ENCABEZADO_TABLA } from './TablaBase.vue';
import PaginacionTabla from './PaginacionTabla.vue';
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
}>();

const emit = defineEmits<{
  (e: 'ordenar', campo: CampoOrdenVariantes): void;
  (e: 'ir-pagina', numero: number): void;
  (e: 'por-pagina', numero: number): void;
  (e: 'editar', id: string): void;
  (e: 'duplicar', id: string): void;
  (e: 'alternar', id: string): void;
  (e: 'exportar'): void;
  (e: 'seleccion', ids: string[]): void;
}>();

const { formatearNumero } = useFormatoCatalogo();

/**
 * Píldora de estado de la variante.
 */
function estadoVariante(v: VarianteListado): { etiqueta: string; clases: string } {
  if (v.estado === 'activo' && v.existenciaReferencial <= 0) {
    return { etiqueta: 'Sin stock', clases: 'bg-highlight/15 text-neutral-dark' };
  }
  const mapa = {
    activo: { etiqueta: 'Activo', clases: 'bg-conversion/10 text-conversion' },
    borrador: { etiqueta: 'Borrador', clases: 'bg-action/10 text-action' },
    inactivo: { etiqueta: 'Inactivo', clases: 'bg-neutral-light text-neutral-medium' },
  } as const;
  return mapa[v.estado];
}

const columnas: { campo: CampoOrdenVariantes; etiqueta: string; alineado?: 'derecha' }[] = [
  { campo: 'producto', etiqueta: 'Producto' },
  { campo: 'presentacion', etiqueta: 'Presentación' },
  { campo: 'base', etiqueta: 'Base' },
  { campo: 'codigo', etiqueta: 'Código' },
  { campo: 'precio', etiqueta: 'Precio', alineado: 'derecha' },
  { campo: 'existencia', etiqueta: 'Exist.', alineado: 'derecha' },
  { campo: 'estado', etiqueta: 'Estado' },
];

const items = computed(() => props.pagina.items);

// Selección local (por página)
const seleccionados = ref<Set<string>>(new Set());
const algunoSeleccionado = computed(() => seleccionados.value.size > 0);
const todosSeleccionados = computed(
  () => items.value.length > 0 && items.value.every((v) => seleccionados.value.has(v.id))
);

function notificar(): void {
  emit('seleccion', [...seleccionados.value]);
}
function alternarUno(id: string, marcado: boolean): void {
  const copia = new Set(seleccionados.value);
  if (marcado) copia.add(id);
  else copia.delete(id);
  seleccionados.value = copia;
  notificar();
}
function alternarTodos(marcado: boolean): void {
  seleccionados.value = marcado ? new Set(items.value.map((v) => v.id)) : new Set();
  notificar();
}

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
