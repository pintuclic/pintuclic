<template>
  <section class="space-y-4" aria-label="Detalle de la categoría">
    <div
      v-if="cargando"
      class="h-40 animate-pulse rounded-card border border-neutral-light bg-neutral-white"
    />

    <template v-else-if="detalle">
      <!-- Cabecera -->
      <div class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-card bg-subaction text-corporate">
              <Layers class="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-lg font-semibold text-neutral-black">{{ detalle.categoria.nombre }}</h2>
                <span class="rounded-button bg-conversion/10 px-2 py-0.5 text-xs font-medium text-conversion">
                  {{ detalle.nivel === 1 ? 'Categoría principal' : 'Subcategoría' }}
                </span>
              </div>
              <p class="mt-1 max-w-2xl text-sm text-neutral-medium">{{ detalle.descripcion }}</p>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-button border border-neutral-light px-3 py-1.5 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
              @click="$emit('editar', detalle.categoria.id)"
            >
              <Pencil class="h-4 w-4" aria-hidden="true" />
              Editar categoría
            </button>
            <button
              type="button"
              class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
              aria-label="Más acciones"
              @click="$emit('menu', detalle.categoria.id)"
            >
              <MoreVertical class="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <!-- Indicadores -->
        <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <TarjetaEstadistica etiqueta="Productos asociados" :valor="detalle.totalProductos" :icono="Package" />
          <TarjetaEstadistica etiqueta="Subcategorías" :valor="detalle.totalSubcategorias" :icono="FolderTree" />
          <TarjetaEstadistica etiqueta="Nivel en la jerarquía" :valor="detalle.nivel" :icono="Network" />
          <TarjetaEstadistica etiqueta="Orden de visualización" :valor="detalle.ordenVisualizacion" :icono="ListOrdered" />
        </div>
      </div>

      <!-- Tabla de elementos -->
      <TablaElementosCategoria
        :elementos="elementos"
        :filtros="filtros"
        :total="totalElementos"
        @ordenar="(c) => $emit('ordenar', c)"
        @buscar="(t) => $emit('buscar', t)"
        @filtrar-tipo="(v) => $emit('filtrar-tipo', v)"
        @menu="(id) => $emit('menu-elemento', id)"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { Layers, Pencil, MoreVertical, Package, FolderTree, Network, ListOrdered } from 'lucide-vue-next';
import TarjetaEstadistica from './TarjetaEstadistica.vue';
import TablaElementosCategoria from './TablaElementosCategoria.vue';
import type {
  CampoOrdenElementoCategoria,
  DetalleCategoria,
  FiltrosElementosCategoria,
  NodoCategoria,
} from '../interfaces';

defineProps<{
  detalle: DetalleCategoria | null;
  elementos: NodoCategoria[];
  filtros: FiltrosElementosCategoria;
  totalElementos: number;
  cargando?: boolean;
}>();

defineEmits<{
  (e: 'editar', id: string): void;
  (e: 'menu', id: string): void;
  (e: 'menu-elemento', id: string): void;
  (e: 'ordenar', campo: CampoOrdenElementoCategoria): void;
  (e: 'buscar', texto: string): void;
  (e: 'filtrar-tipo', valor: string): void;
}>();
</script>
