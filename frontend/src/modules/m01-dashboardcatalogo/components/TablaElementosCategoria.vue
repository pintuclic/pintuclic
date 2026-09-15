<template>
  <TablaBase
    etiqueta="Elementos de la categoría"
    :vacio="!elementos.length"
    mensaje-vacio="No hay elementos que coincidan con la búsqueda."
  >
    <template #encabezado>
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
    </template>

    <table class="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr :class="CLASE_ENCABEZADO_TABLA">
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
            v-for="el in elementosPaginados"
            :key="el.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="px-4 py-3">
              <input
                type="checkbox"
                class="accent-action"
                :checked="seleccionados.has(el.id)"
                :aria-label="`Seleccionar ${el.nombre}`"
                @change="alternarUno(el.id, ($event.target as HTMLInputElement).checked)"
              />
            </td>
            <td class="px-3 py-3 font-medium text-neutral-black">
              <button
                type="button"
                class="block text-left font-medium text-neutral-black hover:text-action"
                @click="$emit('editar', el.id)"
              >
                {{ el.nombre }}
              </button>
            </td>
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
                :aria-expanded="elementoActivo?.id === el.id"
                aria-haspopup="menu"
                @click.stop="(e) => abrirMenu(el, e, (item) => item.id)"
              >
                <MoreVertical class="h-4 w-4" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

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

    <template #pie>
      <PaginacionTabla
        :pagina="paginaActual"
        :por-pagina="porPagina"
        :total="total"
        :total-paginas="totalPaginas"
        etiqueta="elementos"
        :opciones-por-pagina="[10, 25, 50]"
        @ir-pagina="(n) => (paginaActual = n)"
        @por-pagina="(n) => { porPagina = n; paginaActual = 1; }"
      />
    </template>
  </TablaBase>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Search, ArrowUp, ArrowDown, ChevronsUpDown, MoreVertical, Pencil, Power } from 'lucide-vue-next';
import TablaBase, { CLASE_ENCABEZADO_TABLA } from './TablaBase.vue';
import PaginacionTabla from './PaginacionTabla.vue';
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
}>();

const emit = defineEmits<{
  (e: 'ordenar', campo: CampoOrdenElementoCategoria): void;
  (e: 'buscar', texto: string): void;
  (e: 'filtrar-tipo', valor: string): void;
  (e: 'editar', id: string): void;
  (e: 'menu', id: string): void;
  (e: 'seleccion', ids: string[]): void;
}>();

const { formatearNumero } = useFormatoCatalogo();

// Paginación local
const paginaActual = ref(1);
const porPagina = ref(10);
const totalPaginas = computed(() => Math.max(1, Math.ceil(props.elementos.length / porPagina.value)));

const elementosPaginados = computed(() => {
  const inicio = (paginaActual.value - 1) * porPagina.value;
  return props.elementos.slice(inicio, inicio + porPagina.value);
});

// Selección local
const seleccionados = ref<Set<string>>(new Set());
const algunoSeleccionado = computed(() => seleccionados.value.size > 0);
const todosSeleccionados = computed(
  () => elementosPaginados.value.length > 0 && elementosPaginados.value.every((el) => seleccionados.value.has(el.id))
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
  seleccionados.value = marcado ? new Set(elementosPaginados.value.map((el) => el.id)) : new Set();
  notificar();
}

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

const columnas: { campo: CampoOrdenElementoCategoria; etiqueta: string; alineado?: 'derecha' }[] = [
  { campo: 'nombre', etiqueta: 'Nombre' },
  { campo: 'tipo', etiqueta: 'Tipo' },
  { campo: 'padre', etiqueta: 'Padre' },
  { campo: 'productos', etiqueta: 'Productos asociados', alineado: 'derecha' },
  { campo: 'estado', etiqueta: 'Estado' },
  { campo: 'orden', etiqueta: 'Orden', alineado: 'derecha' },
];
</script>
