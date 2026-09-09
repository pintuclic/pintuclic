<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    aria-label="Listado de variantes"
  >
    <header class="flex items-center justify-between gap-4 border-b border-neutral-light p-4">
      <h2 class="text-base font-semibold text-neutral-black">
        Variantes <span class="text-neutral-medium">({{ formatearNumero(total) }})</span>
      </h2>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-button border border-neutral-light px-3 py-1.5 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
        @click="$emit('exportar')"
      >
        <Download class="h-4 w-4" aria-hidden="true" />
        Exportar
      </button>
    </header>

    <div v-if="cargando" class="space-y-3 p-5">
      <div v-for="n in filtros.porPagina" :key="n" class="h-12 animate-pulse rounded-input bg-neutral-lightest" />
    </div>

    <p v-else-if="!items.length" class="p-10 text-center text-sm text-neutral-medium">
      No hay variantes que coincidan con los filtros aplicados.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[920px] text-left text-sm">
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
            v-for="v in items"
            :key="v.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="px-4 py-3">
              <input type="checkbox" class="accent-action" :aria-label="`Seleccionar ${v.productoNombre} ${v.presentacion}`" />
            </td>
            <td class="px-3 py-3">
              <span class="block font-medium text-neutral-black">{{ v.productoNombre }}</span>
              <span class="text-xs text-neutral-medium">{{ v.marca }}</span>
            </td>
            <td class="px-3 py-3 text-neutral-dark">{{ v.presentacion }}</td>
            <td class="px-3 py-3 text-neutral-dark">{{ v.base ?? v.color ?? 'N/A' }}</td>
            <td class="px-3 py-3 font-mono text-xs text-neutral-dark">{{ v.codigoProveedor }}</td>
            <td class="px-3 py-3 text-right font-medium text-neutral-dark tabular-nums">
              ${{ formatearNumero(v.precio) }}
            </td>
            <td class="px-3 py-3 text-right tabular-nums" :class="v.existenciaReferencial <= 0 ? 'text-neutral-medium' : 'text-neutral-dark'">
              {{ formatearNumero(v.existenciaReferencial) }}
            </td>
            <td class="px-3 py-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                :class="estadoVariante(v).clases"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ estadoVariante(v).etiqueta }}
              </span>
            </td>
            <td class="px-3 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                  :aria-label="`Editar ${v.productoNombre} ${v.presentacion}`"
                  @click="$emit('editar', v.id)"
                >
                  <Pencil class="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                  :aria-label="`Duplicar ${v.productoNombre} ${v.presentacion}`"
                  @click="$emit('duplicar', v.id)"
                >
                  <Copy class="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                  :aria-label="`${v.estado === 'inactivo' ? 'Activar' : 'Desactivar'} ${v.productoNombre} ${v.presentacion}`"
                  @click="$emit('alternar', v.id)"
                >
                  <Power class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer
      v-if="items.length"
      class="flex flex-col items-center justify-between gap-3 border-t border-neutral-light px-5 py-4 text-sm sm:flex-row"
    >
      <p class="text-neutral-medium">
        Mostrando <span class="font-medium text-neutral-dark">{{ desde }}</span> a
        <span class="font-medium text-neutral-dark">{{ hasta }}</span> de
        <span class="font-medium text-neutral-dark">{{ formatearNumero(total) }}</span> variantes
      </p>

      <div class="flex items-center gap-1">
        <button
          type="button"
          class="grid h-8 w-8 place-items-center rounded-button border border-neutral-light text-neutral-dark hover:bg-neutral-lightest disabled:opacity-40"
          :disabled="pagina.pagina <= 1"
          aria-label="Página anterior"
          @click="$emit('ir-pagina', pagina.pagina - 1)"
        >
          <ChevronLeft class="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          v-for="n in paginasVisibles"
          :key="n"
          type="button"
          class="h-8 min-w-8 rounded-button border px-2 text-sm font-medium"
          :class="
            n === pagina.pagina
              ? 'border-action bg-action text-neutral-white'
              : 'border-neutral-light text-neutral-dark hover:bg-neutral-lightest'
          "
          :aria-current="n === pagina.pagina ? 'page' : undefined"
          @click="$emit('ir-pagina', n)"
        >
          {{ n }}
        </button>
        <button
          type="button"
          class="grid h-8 w-8 place-items-center rounded-button border border-neutral-light text-neutral-dark hover:bg-neutral-lightest disabled:opacity-40"
          :disabled="pagina.pagina >= pagina.totalPaginas"
          aria-label="Página siguiente"
          @click="$emit('ir-pagina', pagina.pagina + 1)"
        >
          <ChevronRight class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <label class="flex items-center gap-2 text-xs text-neutral-medium">
        <select
          :value="filtros.porPagina"
          class="rounded-input border border-neutral-light bg-neutral-white px-2 py-1.5 text-sm text-neutral-dark outline-none focus:border-action"
          @change="$emit('por-pagina', Number(($event.target as HTMLSelectElement).value))"
        >
          <option :value="10">10 por página</option>
          <option :value="25">25 por página</option>
          <option :value="50">50 por página</option>
        </select>
      </label>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  Download,
  Pencil,
  Copy,
  Power,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
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

defineEmits<{
  (e: 'ordenar', campo: CampoOrdenVariantes): void;
  (e: 'ir-pagina', numero: number): void;
  (e: 'por-pagina', numero: number): void;
  (e: 'editar', id: string): void;
  (e: 'duplicar', id: string): void;
  (e: 'alternar', id: string): void;
  (e: 'exportar'): void;
}>();

const { formatearNumero } = useFormatoCatalogo();

/**
 * Píldora de estado de la variante. "Sin stock" se deriva de una variante
 * activa con existencia referencial en cero (no es un estado propio). La paleta
 * no tiene rol "destructivo": inactivo / sin stock usan neutros.
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
  { campo: 'codigo', etiqueta: 'Código proveedor' },
  { campo: 'precio', etiqueta: 'Precio', alineado: 'derecha' },
  { campo: 'existencia', etiqueta: 'Existencia referencial', alineado: 'derecha' },
  { campo: 'estado', etiqueta: 'Estado' },
];

const items = computed(() => props.pagina.items);
const total = computed(() => props.pagina.total);
const desde = computed(() =>
  total.value === 0 ? 0 : (props.pagina.pagina - 1) * props.pagina.porPagina + 1
);
const hasta = computed(() => Math.min(props.pagina.pagina * props.pagina.porPagina, total.value));

const paginasVisibles = computed(() =>
  Array.from({ length: props.pagina.totalPaginas }, (_, i) => i + 1)
);
</script>
