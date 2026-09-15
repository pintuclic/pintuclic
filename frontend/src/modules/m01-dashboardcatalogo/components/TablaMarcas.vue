<template>
  <TablaBase
    etiqueta="Listado de marcas"
    :cargando="cargando"
    :vacio="!items.length"
    mensaje-vacio="No hay marcas que coincidan con la búsqueda."
    :filas-skeleton="pagina.porPagina"
    alto-fila-skeleton="h-14"
  >
    <table class="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr :class="CLASE_ENCABEZADO_TABLA">
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
                  <button
                    type="button"
                    class="block text-left font-medium text-neutral-black hover:text-action"
                    @click="$emit('detalle', marca.id)"
                  >
                    {{ marca.nombre }}
                  </button>
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
            <td class="px-3 py-3 text-right">
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                :aria-label="`Acciones de ${marca.nombre}`"
                :aria-expanded="marcaActiva?.id === marca.id"
                aria-haspopup="menu"
                @click.stop="(e) => abrirMenu(marca, e, (m) => m.id)"
              >
                <MoreVertical class="h-4 w-4" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

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

    <template #pie>
      <PaginacionTabla
        :pagina="pagina.pagina"
        :por-pagina="pagina.porPagina"
        :total="pagina.total"
        :total-paginas="pagina.totalPaginas"
        etiqueta="marcas"
        @ir-pagina="(n) => $emit('ir-pagina', n)"
      />
    </template>
  </TablaBase>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Pencil, MoreVertical, Eye } from 'lucide-vue-next';
import TablaBase, { CLASE_ENCABEZADO_TABLA } from './TablaBase.vue';
import PaginacionTabla from './PaginacionTabla.vue';
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
