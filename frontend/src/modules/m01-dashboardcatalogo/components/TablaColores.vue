<template>
  <TablaBase
    etiqueta="Listado de colores"
    :cargando="cargando"
    :vacio="!items.length"
    mensaje-vacio="No hay colores que coincidan con los filtros aplicados."
    :filas-skeleton="pagina.porPagina"
  >
    <template #encabezado>
      <h2 class="text-base font-semibold text-neutral-black">Listado de colores</h2>
      <p class="mt-0.5 text-sm text-neutral-medium">
        Gestiona todos los colores disponibles en tu catálogo.
      </p>
    </template>

    <table class="w-full min-w-[820px] text-left text-sm">
        <thead>
          <tr :class="CLASE_ENCABEZADO_TABLA">
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
            <td class="px-3 py-3 font-medium text-neutral-black">
              <button
                type="button"
                class="block text-left font-medium text-neutral-black hover:text-action"
                @click="$emit('editar', color.id)"
              >
                {{ color.nombre }}
              </button>
            </td>
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
                :aria-expanded="colorActivo?.id === color.id"
                aria-haspopup="menu"
                @click.stop="(e) => abrirMenu(color, e, (c) => c.id)"
              >
                <MoreVertical class="h-4 w-4" aria-hidden="true" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>

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

    <template #pie>
      <PaginacionTabla
        :pagina="pagina.pagina"
        :por-pagina="pagina.porPagina"
        :total="pagina.total"
        :total-paginas="pagina.totalPaginas"
        etiqueta="colores"
        @ir-pagina="(n) => $emit('ir-pagina', n)"
      />
    </template>
  </TablaBase>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { Copy, Check, MoreVertical, Pencil } from 'lucide-vue-next';
import TablaBase, { CLASE_ENCABEZADO_TABLA } from './TablaBase.vue';
import PaginacionTabla from './PaginacionTabla.vue';
import { useMenuFlotante } from '../composables/useMenuFlotante';
import type { ColorListado, PaginaColores } from '../interfaces';

const props = defineProps<{
  pagina: PaginaColores;
  cargando?: boolean;
}>();

const emit = defineEmits<{
  (e: 'editar', id: string): void;
  (e: 'ir-pagina', numero: number): void;
}>();

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
</script>
