<template>
  <div class="bg-neutral-lightest text-neutral-dark font-sans">
    <main>
      <section class="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6">
        <nav class="text-xs text-neutral-medium" aria-label="Migas de pan">
          <router-link to="/" class="transition-colors hover:text-action">Inicio</router-link>
          <ChevronRight :size="13" class="mx-1 inline" />
          <span class="font-medium text-corporate">Productos</span>
        </nav>
        <h1 class="font-title mt-4 text-3xl font-bold text-corporate sm:text-4xl">Catálogo de productos</h1>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-neutral-medium">Explora pinturas, herramientas y accesorios publicados para completar tu proyecto.</p>
      </section>

      <section class="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <form class="grid gap-4 lg:grid-cols-[1fr_auto_auto]" role="search" @submit.prevent="buscar">
          <label class="relative block">
            <span class="sr-only">Buscar en el catálogo</span>
            <input
              v-model="termino"
              type="search"
              maxlength="120"
              placeholder="Buscar productos, marcas, categorías..."
              class="h-11 w-full rounded-input border border-neutral-light bg-neutral-white pl-4 pr-14 text-sm outline-none transition-shadow placeholder:text-neutral-medium focus:border-action focus:ring-2 focus:ring-action"
            />
            <button
              type="submit"
              class="absolute right-0 top-0 grid h-11 w-12 place-items-center rounded-r-button bg-action text-white shadow-sm transition-all hover:bg-action-hover hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              aria-label="Buscar"
            >
              <Search :size="18" />
            </button>
          </label>
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-button bg-conversion px-7 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-conversion-hover hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
            @click="calculadoraAbierta = true"
          >
            <Calculator :size="18" /> Calculadora
          </button>
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-button bg-action px-7 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-action-hover hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            @click="mostrarMensaje('La asesoría de color se incorporará en su vista pública independiente.')"
          >
            <Palette :size="18" /> Asesoría de color
          </button>
        </form>
      </section>

      <div v-if="mensaje" class="mx-auto max-w-7xl px-4 pb-4 sm:px-6" role="status">
        <div class="flex items-start justify-between gap-3 rounded-card bg-subaction px-4 py-3 text-sm text-corporate">
          <span>{{ mensaje }}</span>
          <button
            type="button"
            class="grid h-8 w-8 shrink-0 place-items-center rounded-button hover:bg-neutral-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            aria-label="Cerrar"
            @click="mensaje = null"
          >
            <X :size="16" />
          </button>
        </div>
      </div>

      <!-- Barra de Filtros y Ordenamiento -->
      <section class="sticky top-0 z-30 border-y border-neutral-light bg-neutral-white/95 shadow-sm backdrop-blur">
        <div class="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-2 rounded-button border border-action bg-neutral-white px-4 text-sm font-medium text-action transition-colors hover:bg-action hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action lg:hidden"
              @click="filtrosMovilAbiertos = true"
            >
              <SlidersHorizontal :size="17" /> Filtros
            </button>
            <p class="text-xs text-neutral-medium sm:text-sm">
              Mostrando <strong class="text-neutral-black">{{ rangoInicio }}–{{ rangoFin }}</strong> de <strong class="text-neutral-black">{{ total }}</strong>
            </p>
          </div>
          <div class="flex items-center gap-2">
            <label class="flex min-h-11 items-center gap-2 rounded-input border border-neutral-light bg-neutral-white px-3 text-xs text-neutral-medium">
              <ArrowUpDown :size="15" />
              <span class="hidden sm:inline">Ordenar:</span>
              <select v-model="orden" class="bg-transparent font-medium text-neutral-dark outline-none">
                <option value="relevancia">Relevancia</option>
                <option value="nombre">Nombre A–Z</option>
                <option value="precio_asc">Menor precio</option>
                <option value="precio_desc">Mayor precio</option>
              </select>
            </label>
            <div class="hidden rounded-button border border-neutral-light bg-neutral-white p-1 sm:flex" aria-label="Tipo de vista">
              <button
                type="button"
                class="grid h-9 w-9 place-items-center rounded-button transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                :class="vista === 'grid' ? 'bg-action text-white' : 'text-neutral-medium hover:bg-subaction hover:text-action'"
                aria-label="Vista en cuadrícula"
                @click="vista = 'grid'"
              >
                <Grid3X3 :size="17" />
              </button>
              <button
                type="button"
                class="grid h-9 w-9 place-items-center rounded-button transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                :class="vista === 'lista' ? 'bg-action text-white' : 'text-neutral-medium hover:bg-subaction hover:text-action'"
                aria-label="Vista en lista"
                @click="vista = 'lista'"
              >
                <List :size="18" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Panel Lateral de Filtros y Productos -->
      <div v-if="filtrosMovilAbiertos" class="fixed inset-0 z-40 bg-corporate/70 lg:hidden" role="presentation" @click="filtrosMovilAbiertos = false" />
      <section class="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr]">
        <aside class="bg-neutral-white p-6" :class="filtrosMovilAbiertos ? 'fixed inset-y-0 left-0 z-50 block w-[min(88vw,320px)] overflow-y-auto shadow-2xl' : 'hidden lg:sticky lg:top-24 lg:block lg:h-fit lg:rounded-card lg:border lg:border-neutral-light lg:shadow-sm'">
          <div class="flex items-center justify-between gap-2">
            <h2 class="font-title flex items-center gap-2 text-base font-semibold text-neutral-black">
              <SlidersHorizontal :size="18" class="text-action" /> Filtros
            </h2>
            <button type="button" class="min-h-11 px-2 text-xs font-medium text-action hover:text-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="limpiarFiltros">Limpiar todo</button>
            <button type="button" class="grid h-11 w-11 place-items-center rounded-button text-neutral-medium hover:bg-neutral-lightest lg:hidden" aria-label="Cerrar filtros" @click="filtrosMovilAbiertos = false">
              <X :size="18" />
            </button>
          </div>

          <fieldset class="mt-6 border-t border-neutral-light pt-5">
            <legend class="font-title text-base font-semibold text-neutral-black">Categorías</legend>
            <label class="mt-4 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-dark transition-colors hover:text-action">
              <input type="radio" name="categoria" :checked="subcategoria === undefined" class="h-4 w-4 accent-action" @change="seleccionarFiltro(undefined)" /> Todos <span class="ml-auto text-xs text-neutral-medium">({{ total }})</span>
            </label>
            <template v-for="categoria in categorias" :key="categoria.id_categoria">
              <p class="mt-4 text-xs font-semibold uppercase tracking-wide text-corporate">{{ categoria.nombre }}</p>
              <label v-for="item in categoria.subcategorias" :key="item.id_subcategoria" class="mt-1 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-dark transition-colors hover:text-action">
                <input type="radio" name="categoria" :checked="subcategoria === item.id_subcategoria" class="h-4 w-4 accent-action" @change="seleccionarFiltro(item.id_subcategoria)" /> {{ item.nombre }}
              </label>
            </template>
          </fieldset>

          <fieldset class="mt-6 border-t border-neutral-light pt-5" disabled>
            <legend class="text-sm font-semibold text-neutral-black">Marca</legend>
            <label class="relative mt-3 block">
              <span class="sr-only">Buscar marca</span>
              <Search :size="14" class="pointer-events-none absolute left-3 top-3.5 text-neutral-medium" />
              <input type="search" placeholder="Buscar marca..." class="h-10 w-full rounded-input border border-neutral-light bg-neutral-white pl-9 pr-3 text-xs placeholder:text-neutral-medium" />
            </label>
            <label class="mt-2 flex min-h-9 items-center gap-2 text-xs text-neutral-dark">
              <input type="checkbox" class="h-4 w-4 rounded accent-action" /> Marcas publicadas <span class="ml-auto text-neutral-medium">{{ cantidadMarcasDisponibles }}</span>
            </label>
          </fieldset>

          <fieldset class="mt-5 border-t border-neutral-light pt-5" disabled>
            <legend class="text-sm font-semibold text-neutral-black">Línea</legend>
            <label class="mt-2 flex min-h-9 items-center gap-2 text-xs text-neutral-medium"><input type="checkbox" class="h-4 w-4 rounded accent-action" /> Opciones al conectar M02</label>
          </fieldset>

          <fieldset class="mt-5 border-t border-neutral-light pt-5" disabled>
            <legend class="text-sm font-semibold text-neutral-black">Tipo de resina</legend>
            <label class="mt-2 flex min-h-9 items-center gap-2 text-xs text-neutral-medium"><input type="checkbox" class="h-4 w-4 rounded accent-action" /> Opciones al conectar M02</label>
          </fieldset>

          <fieldset class="mt-5 border-t border-neutral-light pt-5" disabled>
            <legend class="text-sm font-semibold text-neutral-black">Color</legend>
            <label v-for="color in muestrasColorDisponibles" :key="color.id" class="mt-2 flex min-h-9 items-center gap-2 text-xs text-neutral-dark">
              <input type="checkbox" class="h-4 w-4 rounded accent-action" />
              <span class="h-4 w-4 shrink-0 rounded-full border border-neutral-light" :style="{ backgroundColor: color.hex }" />
              {{ color.nombre }}
            </label>
            <p v-if="!muestrasColorDisponibles.length" class="mt-2 text-xs text-neutral-medium">Sin muestras en esta página.</p>
          </fieldset>

          <fieldset class="mt-5 border-t border-neutral-light pt-5" disabled>
            <legend class="text-sm font-semibold text-neutral-black">Familia cromática</legend>
            <label v-for="familia in familiasDisponibles" :key="familia" class="mt-2 flex min-h-9 items-center gap-2 text-xs text-neutral-dark">
              <input type="checkbox" class="h-4 w-4 rounded accent-action" />{{ familia }}
            </label>
            <p v-if="!familiasDisponibles.length" class="mt-2 text-xs text-neutral-medium">Sin familias en esta página.</p>
          </fieldset>

          <fieldset class="mt-5 border-t border-neutral-light pt-5" disabled>
            <legend class="text-sm font-semibold text-neutral-black">Presentación</legend>
            <label v-for="presentacion in presentacionesDisponibles" :key="presentacion" class="mt-2 flex min-h-9 items-center gap-2 text-xs text-neutral-dark">
              <input type="checkbox" class="h-4 w-4 rounded accent-action" />{{ presentacion }}
            </label>
            <p v-if="!presentacionesDisponibles.length" class="mt-2 text-xs text-neutral-medium">Sin presentaciones en esta página.</p>
          </fieldset>

          <fieldset class="mt-5 border-t border-neutral-light pt-5" disabled>
            <legend class="text-sm font-semibold text-neutral-black">Rango de precio</legend>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <label><span class="sr-only">Precio mínimo</span><input type="number" min="0" placeholder="Mínimo" class="h-10 w-full rounded-input border border-neutral-light bg-neutral-white px-3 text-xs placeholder:text-neutral-medium" /></label>
              <label><span class="sr-only">Precio máximo</span><input type="number" min="0" placeholder="Máximo" class="h-10 w-full rounded-input border border-neutral-light bg-neutral-white px-3 text-xs placeholder:text-neutral-medium" /></label>
            </div>
          </fieldset>

          <p class="mt-5 rounded-card bg-neutral-lightest p-3 text-[11px] leading-4 text-neutral-medium" role="note">
            Vista preliminar: los valores completos, conteos y aplicación simultánea se conectarán con las facetas de M02.
          </p>

          <fieldset class="mt-6 border-t border-neutral-light pt-5">
            <legend class="font-title text-base font-semibold text-neutral-black">Disponibilidad</legend>
            <label class="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-dark transition-colors hover:text-action">
              <input v-model="soloDisponibles" type="checkbox" class="h-4 w-4 rounded accent-action" /> Con existencia
            </label>
          </fieldset>

          <button
            type="button"
            class="mt-6 min-h-11 w-full rounded-button bg-action px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-action-hover hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action lg:hidden"
            @click="filtrosMovilAbiertos = false"
          >
            Aplicar filtros
          </button>
        </aside>

        <!-- Cuadrícula de Productos -->
        <div class="min-w-0">
          <div v-if="cargando" class="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 xl:grid-cols-4" aria-live="polite">
            <div v-for="n in 8" :key="n" class="h-96 animate-pulse rounded-card bg-neutral-light" />
          </div>
          <div v-else-if="error" class="rounded-card border border-neutral-light bg-neutral-white p-12 text-center shadow-sm">
            <CircleAlert :size="34" class="mx-auto text-highlight" />
            <p class="mt-3 text-sm text-neutral-dark">{{ error }}</p>
            <button type="button" class="mt-5 min-h-11 rounded-button bg-action px-5 text-sm font-medium text-white hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="cargarInicio">
              Reintentar
            </button>
          </div>
          <div v-else-if="productosVisibles.length" :class="vista === 'grid' ? 'grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 xl:grid-cols-4' : 'grid grid-cols-1 gap-6'">
            <TarjetaProductoPublico
              v-for="producto in productosVisibles"
              :key="producto.id_producto"
              :producto="producto"
              :modo="vista"
              @ver="verProducto"
              @agregar="mostrarMensaje('Agregar al carrito requiere M07.')"
            />
          </div>
          <div v-else class="rounded-card border border-neutral-light bg-neutral-white p-12 text-center shadow-sm">
            <SearchX :size="36" class="mx-auto text-neutral-medium" />
            <h2 class="font-title mt-4 text-lg font-semibold text-corporate">No encontramos productos</h2>
            <p class="mt-2 text-sm text-neutral-medium">Prueba con otra búsqueda o limpia los filtros activos.</p>
            <button type="button" class="mt-5 min-h-11 rounded-button border border-action bg-neutral-white px-5 text-sm font-medium text-action transition-colors hover:bg-action hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="limpiarFiltros">
              Limpiar filtros
            </button>
          </div>

          <!-- Paginación Core -->
          <Paginacion
            v-if="totalPaginas > 1"
            :model-value="pagina"
            :total="total"
            :page-size="8"
            class="mt-8 rounded-card border border-neutral-light"
            @update:model-value="irPagina"
          />
        </div>
      </section>

      <!-- Sección complementaria -->
      <section v-if="categorias.length" class="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div class="rounded-card bg-corporate p-6 text-white sm:p-8">
          <h2 class="font-title text-xl font-semibold">Completa tu proyecto</h2>
          <p class="mt-1 text-sm text-white/75">Explora otras categorías disponibles.</p>
          <div class="mt-5 flex flex-wrap gap-3">
            <button
              v-for="categoria in categorias.slice(0, 5)"
              :key="categoria.id_categoria"
              type="button"
              class="min-h-11 rounded-button border border-neutral-white/40 px-4 text-sm font-medium transition-all hover:-translate-y-0.5 hover:bg-neutral-white hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-white"
              @click="seleccionarFiltro(categoria.subcategorias[0]?.id_subcategoria)"
            >
              {{ categoria.nombre }}
            </button>
          </div>
        </div>
      </section>
    </main>

    <!-- Modales de Negocio del Módulo M01 -->
    <MenuCategoriasPublico
      :abierto="menuCategoriasAbierto"
      :cargando="cargando"
      :categorias="categorias"
      @cerrar="menuCategoriasAbierto = false"
      @seleccionar="seleccionarDesdeMenu"
    />
    <CalculadoraPinturaPublica
      :abierta="calculadoraAbierta"
      :producto="productos[0]?.detalle"
      @cerrar="calculadoraAbierta = false"
      @agregar="mostrarMensaje('Agregar al carrito requiere M07.')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowUpDown,
  Calculator,
  ChevronRight,
  CircleAlert,
  Grid3X3,
  List,
  Palette,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-vue-next';
import { Paginacion } from '@/core/components';
import CalculadoraPinturaPublica from '../../components/publicas/CalculadoraPinturaPublica.vue';
import MenuCategoriasPublico from '../../components/publicas/MenuCategoriasPublico.vue';
import TarjetaProductoPublico from '../../components/publicas/TarjetaProductoPublico.vue';
import { useCatalogoPublico } from '../../composables/publicas/useCatalogoPublico';
import type { ProductoDestacadoPublico } from '../../interfaces/publicas/catalogo-publico.interface';

type OrdenCatalogo = 'relevancia' | 'nombre' | 'precio_asc' | 'precio_desc';
type VistaCatalogo = 'grid' | 'lista';
const router = useRouter();
const menuCategoriasAbierto = ref(false);
const filtrosMovilAbiertos = ref(false);
const calculadoraAbierta = ref(false);
const mensaje = ref<string | null>(null);
const orden = ref<OrdenCatalogo>('relevancia');
const vista = ref<VistaCatalogo>('grid');
const soloDisponibles = ref(false);
const {
  buscar,
  cargando,
  cargarInicio,
  categorias,
  error,
  irPagina,
  limpiar,
  pagina,
  productos,
  seleccionarSubcategoria,
  subcategoria,
  termino,
  total,
  totalPaginas,
} = useCatalogoPublico();

const productosVisibles = computed(() => {
  const filtrados = soloDisponibles.value
    ? productos.value.filter((producto) =>
        producto.detalle?.variantes.some((variante) => variante.existencia_referencial > 0)
      )
    : [...productos.value];
  if (orden.value === 'nombre') return filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  if (orden.value === 'precio_asc') return filtrados.sort((a, b) => precioMinimo(a) - precioMinimo(b));
  if (orden.value === 'precio_desc') return filtrados.sort((a, b) => precioMinimo(b) - precioMinimo(a));
  return filtrados;
});

const cantidadMarcasDisponibles = computed(() => new Set(productos.value.map((producto) => producto.id_marca)).size);
const muestrasColorDisponibles = computed(() => {
  const colores = new Map<number, { id: number; nombre: string; hex: string }>();
  productos.value.forEach((producto) =>
    producto.detalle?.variantes.forEach((variante) => {
      if (variante.id_color !== null && variante.color && variante.muestra_hex && !colores.has(variante.id_color)) {
        colores.set(variante.id_color, { id: variante.id_color, nombre: variante.color, hex: variante.muestra_hex });
      }
    })
  );
  return [...colores.values()].slice(0, 5);
});

const familiasDisponibles = computed(() => [
  ...new Set(
    productos.value.flatMap(
      (producto) =>
        producto.detalle?.variantes
          .map((variante) => variante.familia_color)
          .filter((familia): familia is string => Boolean(familia)) ?? []
    )
  ),
].slice(0, 5));

const presentacionesDisponibles = computed(() => [
  ...new Set(
    productos.value.flatMap(
      (producto) => producto.detalle?.variantes.map((variante) => variante.presentacion) ?? []
    )
  ),
].slice(0, 5));

const rangoInicio = computed(() => (total.value === 0 ? 0 : (pagina.value - 1) * 8 + 1));
const rangoFin = computed(() => Math.min(pagina.value * 8, total.value));

function precioMinimo(producto: ProductoDestacadoPublico): number {
  const precios = producto.detalle?.variantes.map((variante) => variante.precio_vigente) ?? [];
  return precios.length ? Math.min(...precios) : Number.MAX_SAFE_INTEGER;
}

function mostrarMensaje(texto: string): void {
  mensaje.value = texto;
}

function limpiarFiltros(): void {
  soloDisponibles.value = false;
  orden.value = 'relevancia';
  limpiar();
}

function seleccionarFiltro(id: number | undefined): void {
  seleccionarSubcategoria(id);
  filtrosMovilAbiertos.value = false;
}

function seleccionarDesdeMenu(id: number): void {
  menuCategoriasAbierto.value = false;
  seleccionarFiltro(id);
}

function verProducto(id: number): void {
  void router.push({ name: 'DetalleProductoPublico', params: { productoId: id } });
}
</script>
