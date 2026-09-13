<template>
  <section
    class="rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    aria-label="Listado de colores"
  >
    <header class="border-b border-neutral-light p-4">
      <h2 class="text-base font-semibold text-neutral-black">Listado de colores</h2>
      <p class="mt-0.5 text-sm text-neutral-medium">
        Gestiona todos los colores disponibles en tu catálogo.
      </p>
    </header>

    <div v-if="cargando" class="space-y-3 p-5">
      <div v-for="n in pagina.porPagina" :key="n" class="h-11 animate-pulse rounded-input bg-neutral-lightest" />
    </div>

    <p v-else-if="!items.length" class="p-10 text-center text-sm text-neutral-medium">
      No hay colores que coincidan con los filtros aplicados.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr class="border-b border-neutral-light text-xs uppercase tracking-wide text-neutral-medium">
            <th scope="col" class="w-16 px-4 py-3 font-semibold">Muestra</th>
            <th scope="col" class="px-3 py-3 font-semibold">Nombre del color</th>
            <th scope="col" class="px-3 py-3 font-semibold">Código</th>
            <th scope="col" class="px-3 py-3 font-semibold">Marca</th>
            <th scope="col" class="px-3 py-3 font-semibold">Familia cromática</th>
            <th scope="col" class="px-3 py-3 font-semibold">Valor cromático</th>
            <th scope="col" class="px-3 py-3 font-semibold">Estado</th>
            <th scope="col" class="px-3 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="color in items"
            :key="color.id"
            class="border-b border-neutral-light last:border-0 hover:bg-neutral-lightest"
          >
            <td class="px-4 py-3">
              <!-- Muestra derivada del valor CIELAB (dato de catálogo, no token de UI). -->
              <span
                class="block h-8 w-10 rounded-input border border-neutral-light"
                :style="{ backgroundColor: color.valorCromatico }"
                aria-hidden="true"
              />
            </td>
            <td class="px-3 py-3 font-medium text-neutral-black">{{ color.nombre }}</td>
            <td class="px-3 py-3 font-mono text-xs text-neutral-dark">{{ color.codigo ?? '—' }}</td>
            <td class="px-3 py-3 text-neutral-dark">{{ color.marca }}</td>
            <td class="px-3 py-3">
              <span class="inline-flex items-center gap-1.5 rounded-button bg-neutral-lightest px-2 py-0.5 text-xs font-medium text-neutral-dark">
                <span class="h-2 w-2 rounded-full" :style="{ backgroundColor: color.valorCromatico }" aria-hidden="true" />
                {{ color.familiaNombre }}
              </span>
            </td>
            <td class="px-3 py-3">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 rounded-button px-1.5 py-0.5 font-mono text-xs text-neutral-dark hover:bg-neutral-light"
                :aria-label="`Copiar ${color.valorCromatico}`"
                @click="copiar(color.valorCromatico)"
              >
                {{ color.valorCromatico }}
                <Check v-if="copiado === color.valorCromatico" class="h-3.5 w-3.5 text-conversion" aria-hidden="true" />
                <Copy v-else class="h-3.5 w-3.5 text-neutral-medium" aria-hidden="true" />
              </button>
            </td>
            <td class="px-3 py-3">
              <span
                class="inline-flex items-center gap-1.5 rounded-button px-2.5 py-1 text-xs font-medium"
                :class="color.estado === 'publicado' ? 'bg-conversion/10 text-conversion' : 'bg-action/10 text-action'"
              >
                <span class="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                {{ color.estado === 'publicado' ? 'Publicado' : 'Borrador' }}
              </span>
            </td>
            <td class="px-3 py-3 text-right">
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-button text-neutral-medium hover:bg-neutral-light"
                :aria-label="`Acciones de ${color.nombre}`"
                @click="$emit('menu', color.id)"
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
      etiqueta="colores"
      @ir-pagina="(n) => $emit('ir-pagina', n)"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Copy, Check, MoreVertical } from 'lucide-vue-next';
import PaginacionTabla from './PaginacionTabla.vue';
import type { PaginaColores } from '../interfaces';

const props = defineProps<{
  pagina: PaginaColores;
  cargando?: boolean;
}>();

defineEmits<{
  (e: 'menu', id: string): void;
  (e: 'ir-pagina', numero: number): void;
}>();

const items = computed(() => props.pagina.items);

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
</script>
