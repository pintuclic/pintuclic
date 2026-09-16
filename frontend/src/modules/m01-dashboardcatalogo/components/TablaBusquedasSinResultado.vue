<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm" aria-label="Términos buscados sin resultado">
    <header class="border-b border-neutral-light p-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-semibold text-neutral-black">Términos buscados sin resultado</h2>
          <p class="mt-0.5 text-sm text-neutral-medium">
            Revisa los términos que tus clientes buscaron y no encontraron en el catálogo.
          </p>
        </div>
        <Button variant="outline" size="sm" :icon="Download" @click="$emit('exportar')">
          Exportar
        </Button>
      </div>
    </header>

    <Table
      :columns="columnas"
      :rows="items as unknown as Record<string, unknown>[]"
      row-key="id"
      :loading="cargando"
      mobile-cards
    >
      <template #empty>
        <p class="text-sm text-neutral-medium">No hay términos que coincidan con los filtros aplicados.</p>
      </template>

      <template #cell-termino="{ row }">
        <button
          type="button"
          class="block text-left font-medium text-neutral-black hover:text-action"
          @click="$emit('accion', { id: (row as unknown as TerminoBusqueda).id, tipo: (row as unknown as TerminoBusqueda).accionSugerida })"
        >
          {{ (row as unknown as TerminoBusqueda).termino }}
        </button>
      </template>

      <template #cell-frecuencia="{ row }">
        <span class="block text-right font-medium tabular-nums">{{ (row as unknown as TerminoBusqueda).frecuencia }}</span>
      </template>

      <template #cell-ultimaBusqueda="{ row }">
        <span class="whitespace-nowrap text-neutral-medium">{{ formatearFechaHora((row as unknown as TerminoBusqueda).ultimaBusqueda) }}</span>
      </template>

      <template #cell-posibleCategoria="{ row }">{{ (row as unknown as TerminoBusqueda).posibleCategoria }}</template>

      <template #cell-accionSugerida="{ row }">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
          :class="(row as unknown as TerminoBusqueda).accionSugerida === 'crear_producto'
            ? 'bg-action text-neutral-white hover:bg-action-hover'
            : 'bg-subaction text-corporate hover:bg-subaction/70'"
          @click="$emit('accion', { id: (row as unknown as TerminoBusqueda).id, tipo: (row as unknown as TerminoBusqueda).accionSugerida })"
        >
          <component
            :is="(row as unknown as TerminoBusqueda).accionSugerida === 'crear_producto' ? Plus : GitMerge"
            class="h-3.5 w-3.5"
            aria-hidden="true"
          />
          {{ (row as unknown as TerminoBusqueda).accionSugerida === 'crear_producto' ? 'Crear producto' : 'Agregar sinónimo' }}
        </button>
      </template>

      <template #cell-estado="{ row }">
        <Badge
          :estado="TONO_ESTADO[(row as unknown as TerminoBusqueda).estado]"
          :label="ETIQUETAS[(row as unknown as TerminoBusqueda).estado]"
          table
        />
      </template>

      <template #cell-acciones="{ row }">
        <div class="flex justify-end">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
            :aria-label="`Acciones de ${(row as unknown as TerminoBusqueda).termino}`"
            :aria-expanded="terminoActivo?.id === (row as unknown as TerminoBusqueda).id"
            aria-haspopup="menu"
            @click.stop="(e) => abrirMenu((row as unknown as TerminoBusqueda), e, (t) => t.id)"
          >
            <MoreVertical class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </template>
    </Table>

    <!-- Menú de acciones de fila -->
    <template v-if="terminoActivo">
      <div
        ref="menu-flotante"
        class="fixed z-30 w-48 overflow-hidden rounded-card border border-neutral-light bg-neutral-white py-1 text-left shadow-lg"
        :style="{ top: `${posMenu.top}px`, left: `${posMenu.left}px` }"
        role="menu"
      >
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest"
          @click="ejecutar('crear_producto')"
        >
          <Plus class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          Crear producto
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest"
          @click="ejecutar('agregar_sinonimo')"
        >
          <GitMerge class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          Agregar sinónimo
        </button>
      </div>
    </template>

    <div v-if="!cargando && items.length" class="border-t border-neutral-light">
      <Paginacion
        :model-value="pagina.pagina"
        :total="pagina.total"
        :page-size="pagina.porPagina"
        @update:model-value="(n) => $emit('ir-pagina', n)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Download, Plus, GitMerge, MoreVertical } from 'lucide-vue-next';
import { Table, Badge, Button, Paginacion } from '@/core/components';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import { useMenuFlotante } from '../composables/useMenuFlotante';
import type { AccionSugerida, EstadoTerminoBusqueda, PaginaBusquedas, TerminoBusqueda } from '../interfaces';

const props = defineProps<{
  pagina: PaginaBusquedas;
  cargando?: boolean;
}>();

const emit = defineEmits<{
  (e: 'accion', payload: { id: string; tipo: AccionSugerida }): void;
  (e: 'ir-pagina', numero: number): void;
  (e: 'exportar'): void;
}>();

const { formatearFechaHora } = useFormatoCatalogo();
const items = computed(() => props.pagina.items);

const columnas = [
  { key: 'termino', label: 'Término buscado' },
  { key: 'frecuencia', label: 'Frecuencia' },
  { key: 'ultimaBusqueda', label: 'Última búsqueda' },
  { key: 'posibleCategoria', label: 'Posible categoría' },
  { key: 'accionSugerida', label: 'Acción sugerida' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones' },
];

const {
  activo: terminoActivo,
  pos: posMenu,
  abrir: abrirMenu,
  cerrar: cerrarMenu,
} = useMenuFlotante<TerminoBusqueda>();

function ejecutar(tipo: AccionSugerida): void {
  const item = terminoActivo.value;
  cerrarMenu();
  if (!item) return;
  emit('accion', { id: item.id, tipo });
}

// "pendiente" pide atención → amber (highlight/warning). La paleta no tiene rol rojo.
const TONO_ESTADO: Record<EstadoTerminoBusqueda, string> = {
  pendiente: 'warning',
  revisado: 'info',
  atendido: 'success',
};
const ETIQUETAS: Record<EstadoTerminoBusqueda, string> = {
  pendiente: 'Pendiente',
  revisado: 'Revisado',
  atendido: 'Atendido',
};
</script>
