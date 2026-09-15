<template>
  <TablaBase
    etiqueta="Términos buscados sin resultado"
    :cargando="cargando"
    :vacio="!items.length"
    mensaje-vacio="No hay términos que coincidan con los filtros aplicados."
    :filas-skeleton="pagina.porPagina"
  >
    <template #encabezado>
      <div class="flex items-start justify-between gap-4">
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
      </div>
    </template>

    <table class="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr :class="CLASE_ENCABEZADO_TABLA">
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
            <td class="px-4 py-3 font-medium text-neutral-black">
              <button
                type="button"
                class="block text-left font-medium text-neutral-black hover:text-action"
                @click="$emit('accion', { id: termino.id, tipo: termino.accionSugerida })"
              >
                {{ termino.termino }}
              </button>
            </td>
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
                :aria-expanded="terminoActivo?.id === termino.id"
                aria-haspopup="menu"
                @click.stop="(e) => abrirMenu(termino, e, (t) => t.id)"
              >
                <MoreVertical class="h-4 w-4" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

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

    <template #pie>
      <PaginacionTabla
        :pagina="pagina.pagina"
        :por-pagina="pagina.porPagina"
        :total="pagina.total"
        :total-paginas="pagina.totalPaginas"
        etiqueta="resultados"
        @ir-pagina="(n) => $emit('ir-pagina', n)"
      />
    </template>
  </TablaBase>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Download, Plus, GitMerge, MoreVertical } from 'lucide-vue-next';
import TablaBase, { CLASE_ENCABEZADO_TABLA } from './TablaBase.vue';
import PaginacionTabla from './PaginacionTabla.vue';
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
