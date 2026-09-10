<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    aria-label="Listado de productos"
  >
    <!-- Encabezado: total + orden -->
    <header class="flex flex-col gap-3 border-b border-neutral-light p-4 sm:flex-row sm:items-center sm:justify-between">
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
    </header>

    <!-- Carga -->
    <div v-if="cargando" class="space-y-3 p-5">
      <div v-for="n in filtros.porPagina" :key="n" class="h-12 animate-pulse rounded-input bg-neutral-lightest" />
    </div>

    <!-- Vacío -->
    <p v-else-if="!items.length" class="p-10 text-center text-sm text-neutral-medium">
      No hay productos que coincidan con los filtros aplicados.
    </p>

    <!-- Tabla -->
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-light text-xs uppercase tracking-wide text-neutral-medium">
            <th scope="col" class="w-10 px-4 py-3">
              <input
                type="checkbox"
                class="accent-action"
                :checked="todosSeleccionados"
                :indeterminate.prop="algunoSeleccionado && !todosSeleccionados"
                aria-label="Seleccionar todos"
                @change="alternarTodos(($event.target as HTMLInputElement).checked)"
              />
            </th>
            <th scope="col" class="px-2 py-3 font-semibold">Imagen</th>
            <th scope="col" class="px-3 py-3 font-semibold">Producto</th>
            <th scope="col" class="px-3 py-3 font-semibold">Marca</th>
            <th scope="col" class="px-3 py-3 font-semibold">Categoría</th>
            <th scope="col" class="px-3 py-3 font-semibold">Línea</th>
            <th scope="col" class="px-3 py-3 text-center font-semibold">Variantes</th>
            <th scope="col" class="px-3 py-3 font-semibold">Estado</th>
            <th scope="col" class="px-3 py-3 font-semibold">Actualización</th>
            <th scope="col" class="px-3 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="producto in items"
            :key="producto.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                class="accent-action"
                :checked="seleccionados.has(producto.id)"
                :aria-label="`Seleccionar ${producto.nombre}`"
                @change="alternarUno(producto.id, ($event.target as HTMLInputElement).checked)"
              />
            </td>
            <td class="px-2 py-3">
              <span
                class="grid h-10 w-10 place-items-center rounded-input border border-neutral-light bg-neutral-lightest text-neutral-medium"
              >
                <img
                  v-if="producto.imagenUrl"
                  :src="producto.imagenUrl"
                  :alt="producto.nombre"
                  class="h-full w-full rounded-input object-cover"
                />
                <Package v-else class="h-4 w-4" aria-hidden="true" />
              </span>
            </td>
            <td class="px-3 py-3">
              <button
                type="button"
                class="block text-left font-medium text-neutral-black hover:text-action"
                @click="$emit('abrir', producto.id)"
              >
                {{ producto.nombre }}
              </button>
              <span class="text-xs text-neutral-medium">SKU: {{ producto.sku }}</span>
            </td>
            <td class="px-3 py-3 text-neutral-dark">{{ producto.marca }}</td>
            <td class="px-3 py-3 text-neutral-dark">{{ producto.categoria }}</td>
            <td class="px-3 py-3 text-neutral-dark">{{ producto.linea ?? '—' }}</td>
            <td class="px-3 py-3 text-center font-medium text-neutral-dark tabular-nums">
              {{ producto.totalVariantes }}
            </td>
            <td class="px-3 py-3">
              <BadgeEstadoProducto :estado="producto.estado" />
            </td>
            <td class="px-3 py-3">
              <span class="block text-neutral-dark">{{ formatearFechaHora(producto.actualizadoEn) }}</span>
              <span class="text-xs text-neutral-medium">por {{ producto.actualizadoPor }}</span>
            </td>
            <td class="px-3 py-3 text-right">
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                :aria-label="`Acciones de ${producto.nombre}`"
                :aria-expanded="menuAbierto === producto.id"
                aria-haspopup="menu"
                @click.stop="abrirMenu(producto.id, $event)"
              >
                <MoreVertical class="h-4 w-4" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PaginacionTabla
      v-if="items.length"
      :pagina="pagina.pagina"
      :por-pagina="pagina.porPagina"
      :total="pagina.total"
      :total-paginas="pagina.totalPaginas"
      etiqueta="productos"
      @ir-pagina="(n) => $emit('ir-pagina', n)"
    />

    <!-- Menú de acciones de fila (posición fija para no recortarse en la tabla con scroll) -->
    <template v-if="menuAbierto">
      <button
        type="button"
        class="fixed inset-0 z-20 cursor-default"
        aria-hidden="true"
        tabindex="-1"
        @click="menuAbierto = null"
      />
      <div
        class="fixed z-30 w-44 overflow-hidden rounded-card border border-neutral-light bg-neutral-white py-1 text-left shadow-lg"
        :style="{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }"
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
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Package, MoreVertical, Pencil, Eye, Copy } from 'lucide-vue-next';
import BadgeEstadoProducto from './BadgeEstadoProducto.vue';
import PaginacionTabla from './PaginacionTabla.vue';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type { FiltrosProductos, OrdenProductos, PaginaProductos } from '../interfaces';

const props = defineProps<{
  pagina: PaginaProductos;
  filtros: FiltrosProductos;
  cargando?: boolean;
}>();

const emit = defineEmits<{
  (e: 'ordenar', orden: OrdenProductos): void;
  (e: 'ir-pagina', numero: number): void;
  (e: 'abrir', id: string): void;
  (e: 'editar', id: string): void;
  (e: 'duplicar', id: string): void;
  (e: 'seleccion', ids: string[]): void;
}>();

// --- Menú de acciones por fila -------------------------------------------
const menuAbierto = ref<string | null>(null);
const menuPos = ref<{ top: number; left: number }>({ top: 0, left: 0 });

function abrirMenu(id: string, evento: Event): void {
  if (menuAbierto.value === id) {
    menuAbierto.value = null;
    return;
  }
  const boton = evento.currentTarget as HTMLElement;
  const r = boton.getBoundingClientRect();
  menuPos.value = { top: r.bottom + 4, left: Math.max(8, r.right - 176) };
  menuAbierto.value = id;
}

function ejecutar(accion: 'editar' | 'abrir' | 'duplicar'): void {
  const id = menuAbierto.value;
  menuAbierto.value = null;
  if (!id) return;
  if (accion === 'editar') emit('editar', id);
  else if (accion === 'duplicar') emit('duplicar', id);
  else emit('abrir', id);
}

const { formatearNumero, formatearFechaHora } = useFormatoCatalogo();

const items = computed(() => props.pagina.items);
const total = computed(() => props.pagina.total);

// Selección local (por página). Se comunica hacia arriba por si se añaden
// acciones masivas (publicar/desactivar en lote, HU-CAT-09).
const seleccionados = ref<Set<string>>(new Set());
const algunoSeleccionado = computed(() => seleccionados.value.size > 0);
const todosSeleccionados = computed(
  () => items.value.length > 0 && items.value.every((p) => seleccionados.value.has(p.id))
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
  seleccionados.value = marcado ? new Set(items.value.map((p) => p.id)) : new Set();
  notificar();
}
</script>
