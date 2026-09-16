<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm" aria-label="Listado de colores">
    <header class="border-b border-neutral-light p-4">
      <h2 class="text-base font-semibold text-neutral-black">Listado de colores</h2>
      <p class="mt-0.5 text-sm text-neutral-medium">
        Gestiona todos los colores disponibles en tu catálogo.
      </p>
    </header>

    <Table
      :columns="columnas"
      :rows="items as unknown as Record<string, unknown>[]"
      row-key="id"
      :loading="cargando"
      mobile-cards
    >
      <template #empty>
        <p class="text-sm text-neutral-medium">No hay colores que coincidan con los filtros aplicados.</p>
      </template>

      <template #cell-muestra="{ row }">
        <span
          class="block h-8 w-10 rounded-input border border-neutral-light"
          :style="{ backgroundColor: (row as unknown as ColorListado).valorCromatico }"
          aria-hidden="true"
        />
      </template>

      <template #cell-nombre="{ row }">
        <button
          type="button"
          class="block text-left font-medium text-neutral-black hover:text-action"
          @click="$emit('editar', (row as unknown as ColorListado).id)"
        >
          {{ (row as unknown as ColorListado).nombre }}
        </button>
      </template>

      <template #cell-codigo="{ row }">
        <span class="font-mono text-xs text-neutral-dark">{{ (row as unknown as ColorListado).codigo ?? '—' }}</span>
      </template>

      <template #cell-marca="{ row }">{{ (row as unknown as ColorListado).marca }}</template>

      <template #cell-familia="{ row }">
        <span class="inline-flex items-center gap-1.5 rounded-button bg-neutral-lightest px-2 py-0.5 text-xs font-medium text-neutral-dark">
          <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: (row as unknown as ColorListado).valorCromatico }" aria-hidden="true" />
          {{ (row as unknown as ColorListado).familiaNombre }}
        </span>
      </template>

      <template #cell-valor="{ row }">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded-button px-1.5 py-0.5 font-mono text-xs text-neutral-dark hover:bg-neutral-light"
          :aria-label="`Copiar ${(row as unknown as ColorListado).valorCromatico}`"
          @click="copiar((row as unknown as ColorListado).valorCromatico)"
        >
          {{ (row as unknown as ColorListado).valorCromatico }}
          <Check v-if="copiado === (row as unknown as ColorListado).valorCromatico" class="h-3.5 w-3.5 text-conversion" aria-hidden="true" />
          <Copy v-else class="h-3.5 w-3.5 text-neutral-medium" aria-hidden="true" />
        </button>
      </template>

      <template #cell-estado="{ row }">
        <Badge :estado="tonoEstado((row as unknown as ColorListado).estado)" :label="etiquetaEstado((row as unknown as ColorListado).estado)" table />
      </template>

      <template #cell-acciones="{ row }">
        <div class="flex justify-end">
          <button
            type="button"
            class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
            :aria-label="`Acciones de ${(row as unknown as ColorListado).nombre}`"
            :aria-expanded="colorActivo?.id === (row as unknown as ColorListado).id"
            aria-haspopup="menu"
            @click.stop="(e) => abrirMenu((row as unknown as ColorListado), e, (c) => c.id)"
          >
            <MoreVertical class="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </template>
    </Table>

    <!-- Menú de acciones de fila con position: fixed -->
    <template v-if="colorActivo">
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
          Editar color
        </button>
        <button
          type="button"
          role="menuitem"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-dark hover:bg-neutral-lightest"
          @click="ejecutar('copiar')"
        >
          <Copy class="h-4 w-4 text-neutral-medium" aria-hidden="true" />
          Copiar valor
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
import { computed, ref } from 'vue';
import { Copy, Check, MoreVertical, Pencil } from 'lucide-vue-next';
import { Table, Badge, Paginacion } from '@/core/components';
import { useMenuFlotante } from '../composables/useMenuFlotante';
import type { ColorListado, EstadoColor, PaginaColores } from '../interfaces';

const props = defineProps<{
  pagina: PaginaColores;
  cargando?: boolean;
}>();

const emit = defineEmits<{
  (e: 'editar', id: string): void;
  (e: 'ir-pagina', numero: number): void;
}>();

const columnas = [
  { key: 'muestra', label: 'Muestra' },
  { key: 'nombre', label: 'Nombre del color' },
  { key: 'codigo', label: 'Código' },
  { key: 'marca', label: 'Marca' },
  { key: 'familia', label: 'Familia cromática' },
  { key: 'valor', label: 'Valor cromático' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones' },
];

const items = computed(() => props.pagina.items);

const {
  activo: colorActivo,
  pos: posMenu,
  abrir: abrirMenu,
  cerrar: cerrarMenu,
} = useMenuFlotante<ColorListado>();

function ejecutar(accion: 'editar' | 'copiar'): void {
  const item = colorActivo.value;
  cerrarMenu();
  if (!item) return;
  if (accion === 'editar') {
    emit('editar', item.id);
  } else if (accion === 'copiar') {
    void copiar(item.valorCromatico);
  }
}

const copiado = ref<string | null>(null);
async function copiar(hex: string): Promise<void> {
  try {
    await globalThis.navigator?.clipboard?.writeText(hex);
    copiado.value = hex;
    setTimeout(() => {
      if (copiado.value === hex) copiado.value = null;
    }, 1500);
  } catch {
    // Sin permiso de portapapeles: no bloquea la vista.
  }
}

/** Mapeo de estado del color -> tono de `Badge` del Core (no hay 1:1 exacto). */
function tonoEstado(estado: EstadoColor): string {
  if (estado === 'publicado') return 'success';
  return 'info';
}
function etiquetaEstado(estado: EstadoColor): string {
  if (estado === 'publicado') return 'Publicado';
  return 'Borrador';
}
</script>
