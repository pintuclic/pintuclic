<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    aria-label="Términos buscados sin resultado"
  >
    <header class="flex items-start justify-between gap-4 border-b border-neutral-light p-4">
      <div>
        <h2 class="text-base font-semibold text-neutral-black">Términos buscados sin resultado</h2>
        <p class="mt-0.5 text-sm text-neutral-medium">
          Revisa los términos que tus clientes buscaron y no encontraron en el catálogo.
        </p>
      </div>
      <button
        type="button"
        class="inline-flex shrink-0 items-center gap-2 rounded-button border border-neutral-light px-3 py-1.5 text-sm font-medium text-neutral-dark hover:bg-neutral-lightest"
        @click="$emit('exportar')"
      >
        <Download class="h-4 w-4" aria-hidden="true" />
        Exportar
      </button>
    </header>

    <div v-if="cargando" class="space-y-3 p-5">
      <div v-for="n in pagina.porPagina" :key="n" class="h-11 animate-pulse rounded-input bg-neutral-lightest" />
    </div>

    <p v-else-if="!items.length" class="p-10 text-center text-sm text-neutral-medium">
      No hay términos que coincidan con los filtros aplicados.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-light text-xs uppercase tracking-wide text-neutral-medium">
            <th scope="col" class="px-4 py-3 font-semibold">Término buscado</th>
            <th scope="col" class="px-3 py-3 text-right font-semibold">Frecuencia</th>
            <th scope="col" class="px-3 py-3 font-semibold">Última búsqueda</th>
            <th scope="col" class="px-3 py-3 font-semibold">Posible categoría</th>
            <th scope="col" class="px-3 py-3 font-semibold">Acción sugerida</th>
            <th scope="col" class="px-3 py-3 font-semibold">Estado</th>
            <th scope="col" class="px-3 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="termino in items"
            :key="termino.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="px-4 py-3 font-medium text-neutral-black">{{ termino.termino }}</td>
            <td class="px-3 py-3 text-right font-medium text-neutral-dark tabular-nums">
              {{ termino.frecuencia }}
            </td>
            <td class="px-3 py-3 whitespace-nowrap text-neutral-medium">
              {{ formatearFechaHora(termino.ultimaBusqueda) }}
            </td>
            <td class="px-3 py-3 text-neutral-dark">{{ termino.posibleCategoria }}</td>
            <td class="px-3 py-3">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
                :class="termino.accionSugerida === 'crear_producto'
                  ? 'bg-action text-neutral-white hover:bg-action-hover'
                  : 'bg-subaction text-corporate hover:bg-subaction/70'"
                @click="$emit('accion', { id: termino.id, tipo: termino.accionSugerida })"
              >
                <component
                  :is="termino.accionSugerida === 'crear_producto' ? Plus : GitMerge"
                  class="h-3.5 w-3.5"
                  aria-hidden="true"
                />
                {{ termino.accionSugerida === 'crear_producto' ? 'Crear producto' : 'Agregar sinónimo' }}
              </button>
            </td>
            <td class="px-3 py-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
                :class="ESTADOS[termino.estado]"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ ETIQUETAS[termino.estado] }}
              </span>
            </td>
            <td class="px-3 py-3 text-right">
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                :aria-label="`Acciones de ${termino.termino}`"
                @click="$emit('menu', termino.id)"
              >
                <MoreVertical class="h-4 w-4" aria-hidden="true" />
              </button>
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
      etiqueta="resultados"
      @ir-pagina="(n) => $emit('ir-pagina', n)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Download, Plus, GitMerge, MoreVertical } from 'lucide-vue-next';
import PaginacionTabla from './PaginacionTabla.vue';
import { useFormatoCatalogo } from '../composables/useFormatoCatalogo';
import type { AccionSugerida, EstadoTerminoBusqueda, PaginaBusquedas } from '../interfaces';

const props = defineProps<{
  pagina: PaginaBusquedas;
  cargando?: boolean;
}>();

defineEmits<{
  (e: 'accion', payload: { id: string; tipo: AccionSugerida }): void;
  (e: 'menu', id: string): void;
  (e: 'ir-pagina', numero: number): void;
  (e: 'exportar'): void;
}>();

const { formatearFechaHora } = useFormatoCatalogo();
const items = computed(() => props.pagina.items);

// "pendiente" pide atención → amber (highlight). La paleta no tiene rol rojo.
const ESTADOS: Record<EstadoTerminoBusqueda, string> = {
  pendiente: 'bg-highlight/15 text-neutral-dark',
  revisado: 'bg-action/10 text-action',
  atendido: 'bg-conversion/10 text-conversion',
};
const ETIQUETAS: Record<EstadoTerminoBusqueda, string> = {
  pendiente: 'Pendiente',
  revisado: 'Revisado',
  atendido: 'Atendido',
};
</script>
