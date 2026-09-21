<template>
  <div class="w-full" :aria-busy="loading">
    <caption v-if="caption" class="sr-only">{{ caption }}</caption>
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-corporate"></div>
    </div>

    <div v-else-if="rows.length === 0" class="py-12 text-center">
      <slot name="empty">
        <p class="text-neutral-medium">{{ emptyMessage || 'No hay datos disponibles.' }}</p>
      </slot>
    </div>

    <template v-else>
      <!-- Vista Desktop (Tabla real) -->
      <div class="hidden sm:block overflow-x-auto">
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="text-xs uppercase bg-neutral-lightest text-corporate border-b border-neutral-light">
            <tr>
              <th v-if="selectable" scope="col" class="w-10 px-4 py-4">
                <input
                  type="checkbox"
                  class="h-4 w-4 accent-action cursor-pointer"
                  :checked="allSelected"
                  :indeterminate.prop="someSelected && !allSelected"
                  aria-label="Seleccionar todos"
                  @change="toggleAll(($event.target as HTMLInputElement).checked)"
                />
              </th>
              <th
                v-for="col in columns"
                :key="col.key"
                scope="col"
                class="px-6 py-4 font-semibold"
                :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-light">
            <tr
              v-for="(row, idx) in rows"
              :key="String(keyOf(row, idx))"
              class="hover:bg-neutral-lightest/50 transition-colors"
              :class="selectable && isSelected(keyOf(row, idx)) ? 'bg-subaction/30' : ''"
            >
              <td v-if="selectable" class="w-10 px-4 py-4">
                <input
                  type="checkbox"
                  class="h-4 w-4 accent-action cursor-pointer"
                  :checked="isSelected(keyOf(row, idx))"
                  :aria-label="`Seleccionar ${labelOf(row, idx)}`"
                  @change="toggleOne(keyOf(row, idx), ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-6 py-4 text-neutral-dark"
                :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
              >
                <slot :name="`cell-${col.key}`" :row="row">
                  {{ row[col.key as keyof T] }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Vista Mobile (Tarjetas) -->
      <div v-if="mobileCards" class="sm:hidden flex flex-col gap-4 p-4">
        <div
          v-for="(row, idx) in rows"
          :key="String(keyOf(row, idx))"
          class="bg-white border border-neutral-light rounded-xl p-4 flex flex-col gap-3 shadow-sm"
        >
          <div v-for="col in columns" :key="col.key" class="flex flex-col">
            <span class="text-xs font-semibold text-corporate uppercase mb-1">{{ col.label }}</span>
            <div class="text-sm text-neutral-dark" :class="col.align === 'right' ? 'text-right' : ''">
              <slot :name="`cell-${col.key}`" :row="row">
                {{ row[col.key as keyof T] }}
              </slot>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="sm:hidden overflow-x-auto">
        <!-- Fallback si no usan mobile-cards -->
        <table class="w-full text-left text-sm whitespace-nowrap">
          <thead class="text-xs uppercase bg-neutral-lightest text-corporate border-b border-neutral-light">
            <tr>
              <th v-if="selectable" scope="col" class="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 accent-action cursor-pointer"
                  :checked="allSelected"
                  :indeterminate.prop="someSelected && !allSelected"
                  aria-label="Seleccionar todos"
                  @change="toggleAll(($event.target as HTMLInputElement).checked)"
                />
              </th>
              <th
                v-for="col in columns"
                :key="col.key"
                scope="col"
                class="px-4 py-3 font-semibold"
                :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
              >
                {{ col.label }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-light">
            <tr
              v-for="(row, idx) in rows"
              :key="String(keyOf(row, idx))"
              class="hover:bg-neutral-lightest/50 transition-colors"
              :class="selectable && isSelected(keyOf(row, idx)) ? 'bg-subaction/30' : ''"
            >
              <td v-if="selectable" class="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  class="h-4 w-4 accent-action cursor-pointer"
                  :checked="isSelected(keyOf(row, idx))"
                  :aria-label="`Seleccionar ${labelOf(row, idx)}`"
                  @change="toggleOne(keyOf(row, idx), ($event.target as HTMLInputElement).checked)"
                />
              </td>
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-3 text-neutral-dark"
                :class="col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'"
              >
                <slot :name="`cell-${col.key}`" :row="row">
                  {{ row[col.key as keyof T] }}
                </slot>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue';
import type { TableColumn } from '@/core/types/table.type';

/**
 * Selección de filas (opcional). Con `selectable = false` (por defecto) el
 * componente renderiza exactamente lo mismo que antes: ninguna columna extra,
 * ningún cambio de estilo. Con `selectable` se añade una casilla por fila y una
 * de «seleccionar todo» (solo de la página actual) en el encabezado.
 *
 * La selección vive en el padre (`v-model` = array de claves de fila), así que
 * el componente sigue siendo sin estado. No se añade a la variante de tarjetas
 * móviles: allí no hay encabezado donde colocar el «seleccionar todo» y el
 * patrón de acciones masivas es de escritorio; la tabla de escritorio y el
 * fallback móvil sí la traen.
 */
const props = withDefaults(
  defineProps<{
    columns: TableColumn[] | { key: string; label: string; align?: 'left' | 'right' | 'center' }[];
    rows: T[];
    rowKey?: keyof T | string;
    caption?: string;
    loading?: boolean;
    mobileCards?: boolean;
    emptyMessage?: string;
    /** Activa la columna de casillas de selección. */
    selectable?: boolean;
    /** Claves (según `rowKey`) de las filas seleccionadas. */
    modelValue?: (string | number)[];
    /** Campo de la fila que da el texto del `aria-label` de cada casilla. */
    selectionLabelKey?: keyof T | string;
  }>(),
  {
    rowKey: 'id',
    caption: '',
    loading: false,
    mobileCards: false,
    emptyMessage: 'No hay datos disponibles.',
    selectable: false,
    modelValue: () => [],
    selectionLabelKey: 'nombre'
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: (string | number)[]): void;
}>();

function keyOf(row: T, idx: number): string | number {
  const raw = props.rowKey ? row[props.rowKey as keyof T] : undefined;
  if (typeof raw === 'string' || typeof raw === 'number') return raw;
  return idx;
}

function labelOf(row: T, idx: number): string {
  const raw = props.selectionLabelKey ? row[props.selectionLabelKey as keyof T] : undefined;
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  return String(keyOf(row, idx));
}

const seleccion = computed(() => props.modelValue ?? []);

const clavesPagina = computed(() => props.rows.map((row, idx) => keyOf(row, idx)));

function isSelected(clave: string | number): boolean {
  return seleccion.value.includes(clave);
}

const allSelected = computed(
  () => clavesPagina.value.length > 0 && clavesPagina.value.every((c) => isSelected(c))
);

const someSelected = computed(() => clavesPagina.value.some((c) => isSelected(c)));

function toggleAll(marcado: boolean): void {
  if (marcado) {
    const union = new Set<string | number>([...seleccion.value, ...clavesPagina.value]);
    emit('update:modelValue', [...union]);
  } else {
    const pagina = new Set<string | number>(clavesPagina.value);
    emit('update:modelValue', seleccion.value.filter((c) => !pagina.has(c)));
  }
}

function toggleOne(clave: string | number, marcado: boolean): void {
  if (marcado) {
    if (isSelected(clave)) return;
    emit('update:modelValue', [...seleccion.value, clave]);
  } else {
    emit('update:modelValue', seleccion.value.filter((c) => c !== clave));
  }
}
</script>
