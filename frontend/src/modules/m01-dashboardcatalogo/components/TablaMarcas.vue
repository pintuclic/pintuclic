<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    aria-label="Listado de marcas"
  >
    <div v-if="cargando" class="space-y-3 p-5">
      <div v-for="n in pagina.porPagina" :key="n" class="h-14 animate-pulse rounded-input bg-neutral-lightest" />
    </div>

    <p v-else-if="!items.length" class="p-10 text-center text-sm text-neutral-medium">
      No hay marcas que coincidan con la búsqueda.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-light text-xs uppercase tracking-wide text-neutral-medium">
            <th scope="col" class="px-5 py-3 font-semibold">Marca</th>
            <th scope="col" class="px-3 py-3 text-center font-semibold">Líneas asociadas</th>
            <th scope="col" class="px-3 py-3 text-center font-semibold">Productos</th>
            <th scope="col" class="px-3 py-3 text-center font-semibold">Colores</th>
            <th scope="col" class="px-3 py-3 font-semibold">Estado</th>
            <th scope="col" class="px-3 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="marca in items"
            :key="marca.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="px-5 py-3">
              <div class="flex items-center gap-3">
                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-input border border-neutral-light bg-neutral-lightest text-xs font-semibold uppercase text-neutral-medium">
                  <img v-if="marca.logoUrl" :src="marca.logoUrl" :alt="marca.nombre" class="h-full w-full rounded-input object-contain" />
                  <template v-else>{{ marca.nombre.slice(0, 2) }}</template>
                </span>
                <div>
                  <span class="block font-medium text-neutral-black">{{ marca.nombre }}</span>
                  <span class="text-xs text-neutral-medium">{{ marca.descripcionCorta }}</span>
                </div>
              </div>
            </td>
            <td class="px-3 py-3 text-center tabular-nums text-neutral-dark">{{ marca.lineasAsociadas }}</td>
            <td class="px-3 py-3 text-center tabular-nums text-neutral-dark">{{ formatearNumero(marca.productos) }}</td>
            <td class="px-3 py-3 text-center tabular-nums text-neutral-dark">{{ marca.colores }}</td>
            <td class="px-3 py-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
                :class="marca.estado === 'activa' ? 'bg-conversion/10 text-conversion' : 'bg-neutral-light text-neutral-medium'"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ marca.estado === 'activa' ? 'Activa' : 'Inactiva' }}
              </span>
            </td>
            <td class="px-3 py-3">
              <div class="flex items-center justify-end gap-1">
                <button
                  type="button"
                  class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                  :aria-label="`Editar ${marca.nombre}`"
                  @click="$emit('editar', marca)"
                >
                  <Pencil class="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                  :aria-label="`Acciones de ${marca.nombre}`"
                  @click="$emit('menu', marca.id)"
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
      etiqueta="marcas"
      @ir-pagina="(n) => $emit('ir-pagina', n)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Pencil, MoreVertical } from 'lucide-vue-next';
import PaginacionTabla from './PaginacionTabla.vue';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type { MarcaListado, PaginaMarcas } from '../interfaces';

const props = defineProps<{
  pagina: PaginaMarcas;
  cargando?: boolean;
}>();

defineEmits<{
  (e: 'editar', marca: MarcaListado): void;
  (e: 'menu', id: string): void;
  (e: 'ir-pagina', numero: number): void;
}>();

const { formatearNumero } = useFormatoCatalogo();
const items = computed(() => props.pagina.items);
</script>
