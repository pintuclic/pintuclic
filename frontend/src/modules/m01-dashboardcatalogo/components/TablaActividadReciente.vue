<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    aria-label="Actividad reciente del catálogo"
  >
    <header class="flex items-start justify-between gap-4 border-b border-neutral-light p-5">
      <div>
        <h2 class="text-lg font-semibold text-neutral-black">Actividad reciente</h2>
        <p class="mt-0.5 text-sm text-neutral-medium">
          Últimas acciones realizadas en el catálogo.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-1 rounded-button border border-neutral-light px-3 py-1.5 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
        @click="$emit('verTodo')"
      >
        Ver toda la actividad
        <ArrowRight class="h-4 w-4" aria-hidden="true" />
      </button>
    </header>

    <!-- Estado de carga -->
    <div v-if="cargando" class="space-y-3 p-5">
      <div v-for="n in 6" :key="n" class="h-10 animate-pulse rounded-input bg-neutral-lightest" />
    </div>

    <!-- Estado vacío -->
    <p v-else-if="!registros.length" class="p-8 text-center text-sm text-neutral-medium">
      Aún no hay actividad registrada en el catálogo.
    </p>

    <!-- Tabla -->
    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-light text-xs uppercase tracking-wide text-neutral-medium">
            <th scope="col" class="px-5 py-3 font-semibold">Fecha y hora</th>
            <th scope="col" class="px-5 py-3 font-semibold">Usuario</th>
            <th scope="col" class="px-5 py-3 font-semibold">Acción</th>
            <th scope="col" class="px-5 py-3 font-semibold">Elemento</th>
            <th scope="col" class="px-5 py-3 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="registro in registros"
            :key="registro.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="whitespace-nowrap px-5 py-3 text-neutral-medium">
              {{ formatearFechaHora(registro.fechaHora) }}
            </td>
            <td class="whitespace-nowrap px-5 py-3 font-medium text-neutral-dark">
              {{ registro.usuario }}
            </td>
            <td class="px-5 py-3 text-neutral-dark">{{ registro.accion }}</td>
            <td class="px-5 py-3 text-neutral-dark">{{ registro.elemento }}</td>
            <td class="px-5 py-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium whitespace-nowrap"
                :class="ESTADOS[registro.estado].clases"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ ESTADOS[registro.estado].etiqueta }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArrowRight } from 'lucide-vue-next';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type { EstadoActividad, RegistroActividad } from '../interfaces';

defineProps<{
  registros: RegistroActividad[];
  cargando?: boolean;
}>();

defineEmits<{ (e: 'verTodo'): void }>();

const { formatearFechaHora } = useFormatoCatalogo();

/**
 * Píldora de estado. La paleta oficial no define un rol "destructivo" (rojo):
 * "desactivado" y "eliminado" van en neutros; solo "publicado" y "actualizado"
 * llevan color.
 */
const ESTADOS: Record<EstadoActividad, { etiqueta: string; clases: string }> = {
  publicado: { etiqueta: 'Publicado', clases: 'bg-conversion/10 text-conversion' },
  actualizado: { etiqueta: 'Actualizado', clases: 'bg-action/10 text-action' },
  desactivado: { etiqueta: 'Desactivado', clases: 'bg-neutral-light text-neutral-medium' },
  eliminado: { etiqueta: 'Eliminado', clases: 'bg-neutral-dark/10 text-neutral-dark' },
};
</script>
