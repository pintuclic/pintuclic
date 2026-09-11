<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    aria-label="Listado de líneas comerciales"
  >
    <!-- Encabezado: total + orden -->
    <header class="flex flex-col gap-3 border-b border-neutral-light p-4 sm:flex-row sm:items-center sm:justify-between">
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
    </header>

    <!-- Carga -->
    <div v-if="cargando" class="space-y-3 p-5">
      <div v-for="n in pagina.porPagina" :key="n" class="h-14 animate-pulse rounded-input bg-neutral-lightest" />
    </div>

    <!-- Vacío -->
    <p v-else-if="!items.length" class="p-10 text-center text-sm text-neutral-medium">
      No hay líneas comerciales que coincidan con los filtros aplicados.
    </p>

    <!-- Tabla -->
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[920px] text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-light bg-neutral-lightest text-xs uppercase tracking-wide text-neutral-medium">
            <th scope="col" class="w-10 px-4 py-3">
              <input
                type="checkbox"
                class="accent-action"
                :checked="todosSeleccionados"
                :indeterminate.prop="algunoSeleccionado && !todosSeleccionados"
                aria-label="Seleccionar todas"
                @change="alternarTodos(($event.target as HTMLInputElement).checked)"
              />
            </th>
            <th scope="col" class="px-2 py-3 font-semibold">Imagen</th>
            <th scope="col" class="px-3 py-3 font-semibold">Nombre de la línea</th>
            <th scope="col" class="px-3 py-3 font-semibold">Marca</th>
            <th scope="col" class="px-3 py-3 font-semibold">Gama comercial</th>
            <th scope="col" class="px-3 py-3 text-center font-semibold">Productos asociados</th>
            <th scope="col" class="px-3 py-3 font-semibold">Estado</th>
            <th scope="col" class="px-3 py-3 font-semibold">Actualización</th>
            <th scope="col" class="px-3 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="linea in items"
            :key="linea.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                class="accent-action"
                :checked="seleccionados.has(linea.id)"
                :aria-label="`Seleccionar ${linea.nombre}`"
                @change="alternarUno(linea.id, ($event.target as HTMLInputElement).checked)"
              />
            </td>
            <td class="px-2 py-3">
              <span class="grid h-10 w-10 place-items-center overflow-hidden rounded-input border border-neutral-light bg-neutral-lightest text-neutral-medium">
                <img
                  v-if="linea.imagenUrl"
                  :src="linea.imagenUrl"
                  :alt="linea.nombre"
                  class="h-full w-full object-cover"
                />
                <Rows3 v-else class="h-4 w-4" aria-hidden="true" />
              </span>
            </td>
            <td class="px-3 py-3">
              <button
                type="button"
                class="block text-left font-medium text-neutral-black hover:text-action"
                @click="$emit('editar', linea)"
              >
                {{ linea.nombre }}
              </button>
              <span class="text-xs text-neutral-medium">{{ linea.descripcionCorta }}</span>
            </td>
            <td class="px-3 py-3 text-neutral-dark">{{ linea.marca }}</td>
            <td class="px-3 py-3 text-neutral-dark">{{ linea.gamaComercial }}</td>
            <td class="px-3 py-3 text-center font-medium tabular-nums text-neutral-dark">
              {{ formatearNumero(linea.productosAsociados) }}
            </td>
            <td class="px-3 py-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
                :class="CLASES_ESTADO[linea.estado]"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ ETIQUETA_ESTADO[linea.estado] }}
              </span>
            </td>
            <td class="px-3 py-3">
              <span class="block text-neutral-dark">{{ formatearFechaHora(linea.actualizadoEn) }}</span>
              <span class="text-xs text-neutral-medium">por {{ linea.actualizadoPor }}</span>
            </td>
            <td class="px-3 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                  :aria-label="`Editar ${linea.nombre}`"
                  @click="$emit('editar', linea)"
                >
                  <Pencil class="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                  :aria-label="`Desactivar ${linea.nombre}`"
                  @click="$emit('desactivar', linea)"
                >
                  <MoreVertical class="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
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
      etiqueta="líneas comerciales"
      @ir-pagina="(n) => $emit('ir-pagina', n)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Rows3, Pencil, MoreVertical } from 'lucide-vue-next';
import PaginacionTabla from './PaginacionTabla.vue';
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

// Selección local (por página) para acciones masivas futuras (activar/desactivar
// en lote). Refleja la columna de checkbox de la maqueta ADMIN 15.
const seleccionados = ref<Set<string>>(new Set());
const algunoSeleccionado = computed(() => seleccionados.value.size > 0);
const todosSeleccionados = computed(
  () => items.value.length > 0 && items.value.every((l) => seleccionados.value.has(l.id))
);
function alternarUno(id: string, marcado: boolean): void {
  const copia = new Set(seleccionados.value);
  if (marcado) copia.add(id);
  else copia.delete(id);
  seleccionados.value = copia;
}
function alternarTodos(marcado: boolean): void {
  seleccionados.value = marcado ? new Set(items.value.map((l) => l.id)) : new Set();
}

// Estados con tokens oficiales del design system (sin rojo/morado arbitrarios).
const ETIQUETA_ESTADO: Record<EstadoLinea, string> = {
  activa: 'Activa',
  inactiva: 'Inactiva',
  pausada: 'Pausada',
};

const CLASES_ESTADO: Record<EstadoLinea, string> = {
  activa: 'bg-conversion/10 text-conversion',
  inactiva: 'bg-neutral-light text-neutral-medium',
  pausada: 'bg-highlight/20 text-neutral-dark',
};
</script>
