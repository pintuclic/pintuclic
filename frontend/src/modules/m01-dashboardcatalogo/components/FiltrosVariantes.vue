<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm"
    aria-label="Filtros de variantes"
  >
    <div class="flex flex-wrap items-end gap-3">
      <label class="flex min-w-[9rem] flex-1 flex-col gap-1 text-xs font-medium text-neutral-medium">
        Producto
        <select
          :value="filtros.productoId ?? ''"
          :class="claseSelect"
          @change="emitir('productoId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todos los productos</option>
          <option v-for="op in opciones.productos" :key="op.valor" :value="op.valor">
            {{ op.etiqueta }}
          </option>
        </select>
      </label>

      <label class="flex min-w-[9rem] flex-1 flex-col gap-1 text-xs font-medium text-neutral-medium">
        Presentación
        <select
          :value="filtros.presentacion ?? ''"
          :class="claseSelect"
          @change="emitir('presentacion', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todas las presentaciones</option>
          <option v-for="op in opciones.presentaciones" :key="op.valor" :value="op.etiqueta">
            {{ op.etiqueta }}
          </option>
        </select>
      </label>

      <label class="flex min-w-[9rem] flex-1 flex-col gap-1 text-xs font-medium text-neutral-medium">
        Estado
        <select
          :value="filtros.estado ?? ''"
          :class="claseSelect"
          @change="emitirEstado(($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="borrador">Borrador</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </label>

      <label class="flex min-w-[9rem] flex-1 flex-col gap-1 text-xs font-medium text-neutral-medium">
        Marca
        <select
          :value="filtros.marcaId ?? ''"
          :class="claseSelect"
          @change="emitir('marcaId', ($event.target as HTMLSelectElement).value)"
        >
          <option value="">Todas las marcas</option>
          <option v-for="op in opciones.marcas" :key="op.valor" :value="op.valor">
            {{ op.etiqueta }}
          </option>
        </select>
      </label>

      <Button variant="text" :disabled="!hayFiltrosActivos" @click="$emit('limpiar')">
        Limpiar filtros
      </Button>

      <Button variant="action" :icon="Plus" @click="$emit('nueva')">
        Nueva variante
      </Button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Plus } from 'lucide-vue-next';
import { Button } from '@/core/components';
import type { FiltrosVariantes, OpcionesFiltroVariantes, EstadoVariante } from '../interfaces';

defineProps<{
  filtros: FiltrosVariantes;
  opciones: OpcionesFiltroVariantes;
  hayFiltrosActivos: boolean;
}>();

const emit = defineEmits<{
  (e: 'cambiar', parcial: Partial<FiltrosVariantes>): void;
  (e: 'limpiar'): void;
  (e: 'nueva'): void;
}>();

const claseSelect =
  'rounded-input border border-neutral-light bg-neutral-white px-2.5 py-2 text-sm text-neutral-dark outline-none focus:border-action focus:ring-2 focus:ring-action/30';

function emitir(campo: 'productoId' | 'presentacion' | 'marcaId', valor: string): void {
  emit('cambiar', { [campo]: valor === '' ? null : valor });
}

function emitirEstado(valor: string): void {
  emit('cambiar', { estado: valor === '' ? null : (valor as EstadoVariante) });
}
</script>
