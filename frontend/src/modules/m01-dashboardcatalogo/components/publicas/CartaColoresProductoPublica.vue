<template>
  <Teleport to="body">
    <div v-if="abierta" class="fixed inset-0 z-50 grid place-items-center bg-corporate/70 p-3 sm:p-6" role="presentation" @click.self="emit('cerrar')">
      <section class="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-modal bg-neutral-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="titulo-carta">
        <header class="flex items-start justify-between gap-4 border-b border-neutral-light px-5 py-4 sm:px-7">
          <div class="flex items-start gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-card bg-subaction text-action"><Palette :size="21" /></span>
            <div>
              <h2 id="titulo-carta" class="font-title text-lg font-bold text-corporate sm:text-xl">Carta de colores</h2>
              <p class="mt-0.5 text-xs text-neutral-medium">{{ nombreProducto }}</p>
            </div>
          </div>
          <button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-button text-neutral-medium transition-colors hover:bg-neutral-lightest hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" aria-label="Cerrar carta de colores" @click="emit('cerrar')"><X :size="19" /></button>
        </header>

        <div class="overflow-y-auto p-5 sm:p-7">
          <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label class="relative block">
              <span class="sr-only">Buscar color por nombre</span>
              <Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium" />
              <input v-model="termino" type="search" maxlength="120" placeholder="Buscar por nombre de color..." class="h-11 w-full rounded-input border border-neutral-light bg-neutral-lightest pl-10 pr-4 text-sm text-neutral-dark outline-none transition-shadow placeholder:text-neutral-medium focus:border-action focus:ring-2 focus:ring-action" />
            </label>
            <div class="flex items-center rounded-button bg-subaction px-4 py-2 text-xs font-semibold text-corporate"><Layers3 :size="16" class="mr-2 text-action" /> {{ colores.length }} colores disponibles</div>
          </div>

          <div class="mt-5 flex gap-5 overflow-x-auto border-b border-neutral-light text-xs font-semibold">
            <button type="button" class="border-b-2 border-action px-1 pb-3 text-action">Todos</button>
            <button v-for="familia in familiasPendientes" :key="familia" type="button" disabled class="cursor-not-allowed px-1 pb-3 text-neutral-medium opacity-50" title="Pendiente de clasificación en la API pública">{{ familia }}</button>
          </div>

          <div class="mt-5 grid gap-6 lg:grid-cols-[1fr_260px]">
            <div>
              <div v-if="coloresPaginados.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                <button v-for="(color, indice) in coloresPaginados" :key="color.idColor" type="button" class="group rounded-card border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" :class="colorBorradorId === color.idColor ? 'border-action bg-subaction shadow-sm' : 'border-neutral-light bg-neutral-white'" @click="seleccionar(color.idColor)">
                  <span class="grid aspect-square w-full place-items-center rounded-card bg-neutral-lightest">
                    <span class="h-14 w-14 rounded-full border-4 border-neutral-white shadow-md transition-transform group-hover:scale-105" :class="muestraClase(indice)" />
                  </span>
                  <strong class="mt-3 block truncate text-xs text-corporate">{{ color.nombre }}</strong>
                  <span class="mt-1 block text-[10px] text-neutral-medium">Código no disponible</span>
                  <span v-if="colorBorradorId === color.idColor" class="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-action"><CircleCheck :size="13" /> Seleccionado</span>
                </button>
              </div>
              <div v-else class="rounded-card border border-neutral-light bg-neutral-lightest p-10 text-center">
                <SearchX :size="34" class="mx-auto text-neutral-medium" />
                <p class="mt-3 text-sm font-semibold text-corporate">No encontramos ese color</p>
                <p class="mt-1 text-xs text-neutral-medium">Prueba con otro nombre.</p>
              </div>

              <nav v-if="totalPaginas > 1" class="mt-5 flex items-center justify-center gap-2" aria-label="Paginación de colores">
                <button type="button" class="grid h-9 w-9 place-items-center rounded-button border border-neutral-light disabled:opacity-40" :disabled="pagina === 1" aria-label="Página anterior" @click="pagina -= 1"><ChevronLeft :size="16" /></button>
                <span class="px-2 text-xs text-neutral-medium">Página {{ pagina }} de {{ totalPaginas }}</span>
                <button type="button" class="grid h-9 w-9 place-items-center rounded-button border border-neutral-light disabled:opacity-40" :disabled="pagina === totalPaginas" aria-label="Página siguiente" @click="pagina += 1"><ChevronRight :size="16" /></button>
              </nav>
            </div>

            <aside class="h-fit rounded-card border border-neutral-light bg-neutral-lightest p-5 lg:sticky lg:top-0">
              <p class="text-xs font-semibold text-neutral-medium">Tu selección</p>
              <div class="mt-3 flex items-center gap-3">
                <span class="h-14 w-14 shrink-0 rounded-full border-4 border-neutral-white bg-action shadow-md" />
                <div class="min-w-0"><h3 class="font-title truncate text-base font-bold text-corporate">{{ colorBorrador?.nombre ?? 'Selecciona un color' }}</h3><p class="text-[10px] text-neutral-medium">Muestra ilustrativa</p></div>
              </div>
              <div class="mt-5 rounded-card border border-neutral-light bg-neutral-white p-3">
                <p class="flex items-start gap-2 text-xs leading-5 text-neutral-medium"><Info :size="15" class="mt-0.5 shrink-0 text-action" /> Al aplicar el color conservaremos la presentación elegida cuando exista una variante compatible.</p>
              </div>
              <button type="button" class="mt-5 w-full rounded-button bg-action px-4 py-3 text-sm font-bold text-white transition-all hover:bg-action-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-50" :disabled="colorBorradorId === null" @click="aplicar">Aplicar color</button>
              <p class="mt-3 text-center text-[10px] text-neutral-medium">La base de entonado se determina internamente y nunca se presenta como elección de compra.</p>
            </aside>
          </div>

          <p class="mt-5 flex items-start gap-2 rounded-card bg-subaction px-4 py-3 text-xs text-corporate"><Info :size="15" class="mt-0.5 shrink-0" /> La navegación por familia, búsqueda por código y carga remota por página se activarán cuando el endpoint público de carta de colores esté disponible.</p>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, CircleCheck, Info, Layers3, Palette, Search, SearchX, X } from 'lucide-vue-next';
import { normalizarBusquedaCatalogoPublico } from '../../dtos/catalogo-publico.dto';
import type { VariantePublica } from '../../interfaces/catalogo-publico.interface';

const props = defineProps<{
  abierta: boolean;
  nombreProducto: string;
  variantes: readonly VariantePublica[];
  varianteSeleccionadaId: number | null;
}>();
const emit = defineEmits<{ cerrar: []; seleccionar: [idVariante: number] }>();

const LIMITE_PAGINA = 12;
const termino = ref('');
const pagina = ref(1);
const colorBorradorId = ref<number | null>(null);
const familiasPendientes = ['Amarillos', 'Azules', 'Verdes', 'Rojos', 'Grises'] as const;
const muestras = ['bg-action', 'bg-corporate', 'bg-conversion', 'bg-highlight', 'bg-neutral-medium', 'bg-subaction'] as const;

const colores = computed(() => {
  const unicos = new Map<number, { idColor: number; nombre: string; variantes: VariantePublica[] }>();
  props.variantes.forEach((variante) => {
    if (variante.id_color === null || variante.color === null) return;
    const existente = unicos.get(variante.id_color);
    if (existente) existente.variantes.push(variante);
    else unicos.set(variante.id_color, { idColor: variante.id_color, nombre: variante.color, variantes: [variante] });
  });
  return [...unicos.values()].sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es'));
});

const coloresFiltrados = computed(() => {
  const { q } = normalizarBusquedaCatalogoPublico(termino.value);
  const consulta = q.toLocaleLowerCase('es');
  return consulta ? colores.value.filter((color) => color.nombre.toLocaleLowerCase('es').includes(consulta)) : colores.value;
});
const totalPaginas = computed(() => Math.max(1, Math.ceil(coloresFiltrados.value.length / LIMITE_PAGINA)));
const coloresPaginados = computed(() => coloresFiltrados.value.slice((pagina.value - 1) * LIMITE_PAGINA, pagina.value * LIMITE_PAGINA));
const colorBorrador = computed(() => colores.value.find((color) => color.idColor === colorBorradorId.value) ?? null);
const varianteActual = computed(() => props.variantes.find((variante) => variante.id_variante === props.varianteSeleccionadaId) ?? null);

watch(() => props.abierta, (abierta) => {
  if (!abierta) return;
  termino.value = '';
  pagina.value = 1;
  colorBorradorId.value = varianteActual.value?.id_color ?? colores.value[0]?.idColor ?? null;
});
watch(termino, () => { pagina.value = 1; });

function muestraClase(indice: number): string { return muestras[indice % muestras.length] ?? 'bg-action'; }
function seleccionar(idColor: number): void { colorBorradorId.value = idColor; }
function aplicar(): void {
  const color = colorBorrador.value;
  if (!color) return;
  const idPresentacionActual = varianteActual.value?.id_presentacion;
  const variante = color.variantes.find((item) => item.id_presentacion === idPresentacionActual) ?? color.variantes[0];
  if (!variante) return;
  emit('seleccionar', variante.id_variante);
  emit('cerrar');
}
</script>
