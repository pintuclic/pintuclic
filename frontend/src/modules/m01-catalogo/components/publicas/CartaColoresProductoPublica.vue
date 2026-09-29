<template>
  <Teleport to="body">
    <div v-if="abierta" class="fixed inset-0 z-50 grid place-items-center bg-corporate/70 p-3 sm:p-6" role="presentation" @click.self="emit('cerrar')">
      <section class="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-neutral-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="titulo-carta">
        <!-- Franja decorativa de marca arcoíris Pintu Clic -->
        <div
          class="h-2 w-full shrink-0"
          style="background: linear-gradient(90deg, #FF4D4D 0%, #FFB703 20%, #4CAF50 40%, #00B4D8 65%, #0877E8 80%, #7B2FF7 100%);"
        />
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

        <div class="overflow-y-auto p-4 sm:p-6">
          <div class="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label class="relative block">
              <span class="sr-only">Buscar color por nombre</span>
              <Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium" />
              <input v-model="termino" type="search" maxlength="120" placeholder="Buscar por nombre, código, familia o HEX..." class="h-11 w-full rounded-input border border-neutral-light bg-neutral-lightest pl-10 pr-4 text-sm text-neutral-dark outline-none transition-shadow placeholder:text-neutral-medium focus:border-action focus:ring-2 focus:ring-action" />
            </label>
            <div class="flex items-center rounded-button bg-subaction px-4 py-2 text-xs font-semibold text-corporate"><Layers3 :size="16" class="mr-2 text-action" /> {{ colores.length }} colores disponibles</div>
          </div>

          <div class="mt-5 flex gap-5 overflow-x-auto border-b border-neutral-light text-xs font-semibold">
            <button type="button" class="border-b-2 border-action px-1 pb-3 text-action">Todos</button>
            <button v-for="familia in familiasPendientes" :key="familia" type="button" disabled class="cursor-not-allowed px-1 pb-3 text-neutral-medium opacity-50" title="Pendiente de clasificación en la API pública">{{ familia }}</button>
          </div>

          <div class="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
            <div>
              <div v-if="coloresPaginados.length" class="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                <button v-for="color in coloresPaginados" :key="color.idColor" type="button" class="group rounded-card border p-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" :class="colorBorradorId === color.idColor ? 'border-action bg-subaction shadow-sm ring-1 ring-action/30' : 'border-neutral-light bg-neutral-white'" @click="seleccionar(color.idColor)">
                  <span class="relative block h-16 w-full rounded-lg shadow-sm ring-1 ring-neutral-black/10 transition-transform group-hover:scale-[1.02]" :class="color.muestraHex ? '' : 'bg-neutral-light'" :style="estiloMuestra(color.muestraHex)">
                    <span v-if="colorBorradorId === color.idColor" class="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-action text-white shadow-sm"><CircleCheck :size="12" /></span>
                  </span>
                  <strong class="mt-1.5 block truncate text-[10px] font-bold leading-3 text-corporate">{{ color.nombre }}</strong>
                  <span class="mt-0.5 block truncate text-[8px] leading-3" :class="color.muestraHex ? 'text-neutral-medium' : 'font-semibold text-highlight'">{{ color.codigo ?? (color.muestraHex ? color.muestraHex : 'Sin HEX') }}</span>
                </button>
              </div>
              <div v-else class="rounded-card border border-neutral-light bg-neutral-lightest p-10 text-center">
                <SearchX :size="34" class="mx-auto text-neutral-medium" />
                <p class="mt-3 text-sm font-semibold text-corporate">No encontramos ese color</p>
                <p class="mt-1 text-xs text-neutral-medium">Prueba con nombre, código, familia o HEX.</p>
              </div>

              <nav v-if="totalPaginas > 1" class="mt-5 flex items-center justify-center gap-2" aria-label="Paginación de colores">
                <button type="button" class="grid h-9 w-9 place-items-center rounded-button border border-neutral-light disabled:opacity-40" :disabled="pagina === 1" aria-label="Página anterior" @click="pagina -= 1"><ChevronLeft :size="16" /></button>
                <span class="px-2 text-center text-xs text-neutral-medium">Página {{ pagina }} de {{ totalPaginas }} · Mostrando {{ rangoPagina.inicio }}-{{ rangoPagina.fin }} de {{ coloresFiltrados.length }}</span>
                <button type="button" class="grid h-9 w-9 place-items-center rounded-button border border-neutral-light disabled:opacity-40" :disabled="pagina === totalPaginas" aria-label="Página siguiente" @click="pagina += 1"><ChevronRight :size="16" /></button>
              </nav>
            </div>

            <aside class="h-fit rounded-card border border-neutral-light bg-neutral-lightest p-4 lg:sticky lg:top-0">
              <p class="text-xs font-semibold text-neutral-medium">Tu selección</p>
              <div class="mt-3 overflow-hidden rounded-xl border border-neutral-light bg-neutral-white shadow-sm">
                <span class="block h-24 w-full" :class="colorBorrador?.muestraHex ? '' : 'bg-neutral-light'" :style="estiloMuestra(colorBorrador?.muestraHex ?? null)" />
                <div class="p-3">
                  <h3 class="font-title truncate text-sm font-bold text-corporate">{{ colorBorrador?.nombre ?? 'Selecciona un color' }}</h3>
                  <p class="mt-0.5 text-[10px]" :class="colorBorrador?.muestraHex ? 'text-neutral-medium' : 'font-semibold text-highlight'">{{ colorBorrador?.codigo ?? (colorBorrador?.muestraHex ?? 'Sin muestra HEX') }}</p>
                </div>
              </div>
              <div class="mt-3 rounded-card border border-neutral-light bg-neutral-white p-3">
                <p class="flex items-start gap-2 text-[11px] leading-4 text-neutral-medium"><Info :size="14" class="mt-0.5 shrink-0 text-action" /> Al aplicar el color conservaremos la presentación elegida cuando exista una variante compatible.</p>
              </div>
              <button type="button" class="mt-4 w-full rounded-button bg-action px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-action-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-50" :disabled="colorBorradorId === null" @click="aplicar">Aplicar color</button>
              <p class="mt-2 text-center text-[9px] leading-4 text-neutral-medium">La base de entonado se determina internamente y nunca se presenta como elección de compra.</p>
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
import { normalizarBusquedaCatalogoPublico } from '../../dtos/publicas/catalogo-publico.dto';
import type { VariantePublica } from '../../interfaces/publicas/catalogo-publico.interface';

const props = defineProps<{
  abierta: boolean;
  nombreProducto: string;
  variantes: readonly VariantePublica[];
  varianteSeleccionadaId: number | null;
}>();
const emit = defineEmits<{ cerrar: []; seleccionar: [idVariante: number] }>();

const LIMITE_PAGINA = 36;
const termino = ref('');
const pagina = ref(1);
const colorBorradorId = ref<number | null>(null);
const familiasPendientes = ['Amarillos', 'Azules', 'Verdes', 'Rojos', 'Grises'] as const;

const colores = computed(() => {
  const unicos = new Map<number, { idColor: number; nombre: string; codigo: string | null; muestraHex: string | null; familia: string | null; variantes: VariantePublica[] }>();
  props.variantes.forEach((variante) => {
    if (variante.id_color === null || variante.color === null) return;
    const existente = unicos.get(variante.id_color);
    if (existente) {
      existente.variantes.push(variante);
      if (!existente.muestraHex && variante.muestra_hex) existente.muestraHex = variante.muestra_hex;
      if (!existente.codigo && variante.codigo_color) existente.codigo = variante.codigo_color;
      if (!existente.familia && variante.familia_color) existente.familia = variante.familia_color;
    } else {
      unicos.set(variante.id_color, {
        idColor: variante.id_color,
        nombre: variante.color,
        codigo: variante.codigo_color ?? null,
        muestraHex: variante.muestra_hex ?? null,
        familia: variante.familia_color ?? null,
        variantes: [variante],
      });
    }
  });
  return [...unicos.values()].sort((primero, segundo) => primero.nombre.localeCompare(segundo.nombre, 'es'));
});

const coloresFiltrados = computed(() => {
  const { q } = normalizarBusquedaCatalogoPublico(termino.value);
  const consulta = normalizarTextoBusqueda(q);
  return consulta ? colores.value.filter((color) => textoBusquedaColor(color).includes(consulta)) : colores.value;
});
const totalPaginas = computed(() => Math.max(1, Math.ceil(coloresFiltrados.value.length / LIMITE_PAGINA)));
const coloresPaginados = computed(() => coloresFiltrados.value.slice((pagina.value - 1) * LIMITE_PAGINA, pagina.value * LIMITE_PAGINA));
const rangoPagina = computed(() => {
  const total = coloresFiltrados.value.length;
  if (total === 0) return { inicio: 0, fin: 0 };
  const inicio = (pagina.value - 1) * LIMITE_PAGINA + 1;
  const fin = Math.min(pagina.value * LIMITE_PAGINA, total);
  return { inicio, fin };
});
const colorBorrador = computed(() => colores.value.find((color) => color.idColor === colorBorradorId.value) ?? null);
const varianteActual = computed(() => props.variantes.find((variante) => variante.id_variante === props.varianteSeleccionadaId) ?? null);

watch(() => props.abierta, (abierta) => {
  if (!abierta) return;
  termino.value = '';
  pagina.value = 1;
  colorBorradorId.value = varianteActual.value?.id_color ?? colores.value[0]?.idColor ?? null;
});
watch(termino, () => { pagina.value = 1; });


function normalizarTextoBusqueda(valor: string | null | undefined): string {
  return (valor ?? '').toLocaleLowerCase('es').replace(/\s+/g, ' ').trim();
}

function textoBusquedaColor(color: { nombre: string; codigo: string | null; muestraHex: string | null; familia: string | null }): string {
  return normalizarTextoBusqueda([color.nombre, color.codigo, color.familia, color.muestraHex].filter(Boolean).join(' '));
}

function estiloMuestra(hex: string | null): Record<string, string> {
  return hex ? { backgroundColor: hex } : {};
}
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
