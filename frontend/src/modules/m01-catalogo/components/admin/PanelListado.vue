<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm">
    <!-- Barra de controles: siempre visible, aunque la carga falle (sin saltos de layout). -->
    <div class="flex flex-col gap-3 border-b border-neutral-light p-4 sm:flex-row sm:items-end sm:justify-between">
      <div class="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          v-if="buscable"
          :model-value="busqueda"
          :placeholder="placeholderBusqueda"
          icon="search"
          aria-label="Buscar"
          class="sm:max-w-xs"
          @update:model-value="emit('update:busqueda', String($event ?? ''))"
        />
        <slot name="filtros" />
      </div>
      <p class="text-xs font-medium text-neutral-medium tabular-nums">
        {{ cargando ? 'Cargando…' : `${total} ${total === 1 ? 'registro' : 'registros'}` }}
      </p>
    </div>

    <div v-if="error" class="p-4">
      <Alert variant="danger" title="No fue posible cargar la información">
        <p>{{ error }}</p>
        <Button variant="danger-outline" size="sm" class="mt-3" @click="emit('reintentar')">Reintentar</Button>
      </Alert>
    </div>

    <Table v-else :columns="columnas" :rows="filas" :row-key="rowKey" :loading="cargando" mobile-cards>
      <template #empty>
        <div class="p-4">
          <SinResultados
            :title="busqueda ? 'Sin coincidencias' : textoVacio"
            :description="busqueda ? 'Ningún registro coincide con la búsqueda.' : ''"
            :action-text="busqueda ? 'Limpiar búsqueda' : ''"
            compact
            @action="emit('update:busqueda', '')"
          />
        </div>
      </template>
      <template v-for="nombre in celdas" :key="nombre" #[nombre]="{ row }">
        <slot :name="nombre" :row="row as T" />
      </template>
    </Table>

    <div v-if="!error && total > porPagina" class="border-t border-neutral-light px-4 py-3">
      <Paginacion :model-value="pagina" :total="total" :page-size="porPagina" @update:model-value="emit('update:pagina', $event)" />
    </div>
  </section>
</template>

<script setup lang="ts" generic="T extends object">
import { computed, useSlots } from 'vue';
import { Alert, Button, Input, Paginacion, SinResultados, Table } from '@/core/components';
import type { TableColumn } from '@/core/types/table.type';

/**
 * M01 - Contenedor estándar de listados del panel: búsqueda, error con
 * reintento, tabla del core (con su carga y vacío) y paginación. Recibe el
 * estado de `useListado` y reenvía las ranuras `cell-*` a la tabla.
 */
withDefaults(defineProps<{
  columnas: TableColumn[];
  filas: T[];
  rowKey: string;
  cargando: boolean;
  error: string | null;
  total: number;
  pagina: number;
  porPagina: number;
  busqueda?: string;
  buscable?: boolean;
  placeholderBusqueda?: string;
  textoVacio?: string;
}>(), { busqueda: '', buscable: true, placeholderBusqueda: 'Buscar por nombre…', textoVacio: 'Aún no hay registros' });

const emit = defineEmits<{ 'update:busqueda': [valor: string]; 'update:pagina': [valor: number]; reintentar: [] }>();

defineSlots<{
  filtros?: () => unknown;
  [celda: `cell-${string}`]: (props: { row: T }) => unknown;
}>();

const slots = useSlots();
const celdas = computed(() =>
  Object.keys(slots).filter((n): n is `cell-${string}` => n.startsWith('cell-')),
);
</script>
