<template>
  <section class="rounded-card border border-neutral-light bg-neutral-white shadow-sm" aria-label="Actividad reciente del catálogo">
    <header class="border-b border-neutral-light p-4">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-neutral-black">Actividad reciente</h2>
          <p class="mt-0.5 text-sm text-neutral-medium">
            Últimas acciones realizadas en el catálogo.
          </p>
        </div>
        <Button variant="outline" size="sm" :icon="ArrowRight" @click="$emit('verTodo')">
          Ver toda la actividad
        </Button>
      </div>
    </header>

    <Table
      :columns="columnas"
      :rows="registros as unknown as Record<string, unknown>[]"
      row-key="id"
      :loading="cargando"
    >
      <template #empty>
        <p class="text-sm text-neutral-medium">Aún no hay actividad registrada en el catálogo.</p>
      </template>

      <template #cell-fechaHora="{ row }">
        <span class="whitespace-nowrap text-neutral-medium">{{ formatearFechaHora((row as unknown as RegistroActividad).fechaHora) }}</span>
      </template>

      <template #cell-usuario="{ row }">
        <span class="whitespace-nowrap font-medium text-neutral-dark">{{ (row as unknown as RegistroActividad).usuario }}</span>
      </template>

      <template #cell-accion="{ row }">{{ (row as unknown as RegistroActividad).accion }}</template>
      <template #cell-elemento="{ row }">{{ (row as unknown as RegistroActividad).elemento }}</template>

      <template #cell-estado="{ row }">
        <Badge
          :estado="TONO_ESTADO[(row as unknown as RegistroActividad).estado]"
          :label="ESTADOS[(row as unknown as RegistroActividad).estado].etiqueta"
          table
        />
      </template>
    </Table>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import { Table, Badge, Button } from '@/core/components';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type { EstadoActividad, RegistroActividad } from '../interfaces';

defineProps<{
  registros: RegistroActividad[];
  cargando?: boolean;
}>();

defineEmits<{ (e: 'verTodo'): void }>();

const { formatearFechaHora } = useFormatoCatalogo();

const columnas = [
  { key: 'fechaHora', label: 'Fecha y hora' },
  { key: 'usuario', label: 'Usuario' },
  { key: 'accion', label: 'Acción' },
  { key: 'elemento', label: 'Elemento' },
  { key: 'estado', label: 'Estado' },
];

/**
 * Píldora de estado. La paleta oficial no define un rol "destructivo" (rojo):
 * "desactivado" y "eliminado" van en neutros; solo "publicado" y "actualizado"
 * llevan color.
 */
const ESTADOS: Record<EstadoActividad, { etiqueta: string }> = {
  publicado: { etiqueta: 'Publicado' },
  actualizado: { etiqueta: 'Actualizado' },
  desactivado: { etiqueta: 'Desactivado' },
  eliminado: { etiqueta: 'Eliminado' },
};

/** Mapeo de estado de actividad -> tono de `Badge` del Core (no hay 1:1 exacto). */
const TONO_ESTADO: Record<EstadoActividad, string> = {
  publicado: 'success',
  actualizado: 'info',
  desactivado: 'inactivo',
  eliminado: 'inactivo',
};
</script>
