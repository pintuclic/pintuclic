<template>
  <div class="min-h-screen bg-neutral-white text-neutral-dark">
    <EncabezadoTiendaPublica @abrir-categorias="menuCategoriasAbierto = true" @informar="mostrarMensaje" />

    <main>
      <section class="mx-auto max-w-7xl px-4 pt-5 sm:px-6">
        <div class="relative overflow-hidden rounded-card bg-corporate px-7 py-8 text-white sm:px-10">
          <div class="relative z-10 max-w-xl">
            <p class="text-xs font-bold uppercase tracking-wider text-highlight">Oferta especial Pintu Clic</p>
            <h1 class="mt-1 text-2xl font-extrabold sm:text-3xl">Hasta 30% de descuento</h1>
            <p class="mt-2 text-sm text-white/80">Encuentra pinturas, herramientas y accesorios para transformar tus espacios.</p>
          </div>
          <img :src="heroStorefront" alt="" class="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover opacity-40 md:block" />
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <form class="grid gap-3 lg:grid-cols-[1fr_auto_auto]" role="search" @submit.prevent="buscar">
          <label class="relative block">
            <span class="sr-only">Buscar en el catálogo</span>
            <input v-model="termino" type="search" maxlength="120" placeholder="Buscar productos, marcas, categorías..." class="h-11 w-full rounded-button border border-action bg-neutral-white pl-4 pr-14 text-sm outline-none focus:ring-2 focus:ring-action" />
            <button type="submit" class="absolute right-0 top-0 grid h-11 w-12 place-items-center rounded-r-button bg-action text-white hover:bg-action-hover" aria-label="Buscar"><Search :size="18" /></button>
          </label>
          <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-button bg-conversion px-7 text-sm font-semibold text-white hover:bg-conversion-hover" @click="calculadoraAbierta = true"><Calculator :size="18" /> Calculadora</button>
          <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-button bg-action px-7 text-sm font-semibold text-white hover:bg-action-hover" @click="mostrarMensaje('La asesoría de color se incorporará posteriormente.')"><Palette :size="18" /> Asesoría de color</button>
        </form>
      </section>

      <div v-if="mensaje" class="mx-auto max-w-7xl px-4 pb-3 sm:px-6" role="status">
        <div class="flex justify-between rounded-card bg-subaction px-4 py-3 text-sm text-corporate"><span>{{ mensaje }}</span><button type="button" aria-label="Cerrar" @click="mensaje = null"><X :size="16" /></button></div>
      </div>

      <section class="mx-auto grid max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid-cols-[230px_1fr]">
        <aside class="h-fit rounded-card border border-neutral-light bg-neutral-white p-5 lg:sticky lg:top-4">
          <div class="flex items-center justify-between"><h2 class="flex items-center gap-2 font-bold text-corporate"><SlidersHorizontal :size="18" /> Filtros</h2><button type="button" class="text-xs font-semibold text-action" @click="limpiar">Limpiar</button></div>
          <fieldset class="mt-5 border-t border-neutral-light pt-4">
            <legend class="text-xs font-bold uppercase text-neutral-black">Categoría</legend>
            <label class="mt-3 flex cursor-pointer items-center gap-2 text-sm"><input type="radio" name="categoria" :checked="subcategoria === undefined" class="accent-action" @change="seleccionarSubcategoria(undefined)" /> Todos <span class="ml-auto text-xs text-neutral-medium">{{ total }}</span></label>
            <template v-for="categoria in categorias" :key="categoria.id_categoria">
              <p class="mt-4 text-xs font-bold text-corporate">{{ categoria.nombre }}</p>
              <label v-for="item in categoria.subcategorias" :key="item.id_subcategoria" class="mt-2 flex cursor-pointer items-center gap-2 text-xs text-neutral-medium">
                <input type="radio" name="categoria" :checked="subcategoria === item.id_subcategoria" class="accent-action" @change="seleccionarSubcategoria(item.id_subcategoria)" /> {{ item.nombre }}
              </label>
            </template>
          </fieldset>
          <div class="mt-6 border-t border-neutral-light pt-4">
            <h3 class="text-xs font-bold uppercase text-neutral-black">Compra por color</h3>
            <div class="mt-3 flex gap-2"><span class="h-5 w-5 rounded-full bg-corporate" /><span class="h-5 w-5 rounded-full bg-action" /><span class="h-5 w-5 rounded-full bg-conversion" /><span class="h-5 w-5 rounded-full bg-highlight" /><span class="h-5 w-5 rounded-full bg-neutral-light" /></div>
          </div>
        </aside>

        <div>
          <div id="categorias" class="mb-5 flex flex-wrap gap-2">
            <button type="button" class="rounded-full px-4 py-2 text-xs font-semibold" :class="subcategoria === undefined ? 'bg-corporate text-white' : 'bg-neutral-lightest text-neutral-dark'" @click="seleccionarSubcategoria(undefined)">Todos</button>
            <button v-for="categoria in categorias" :key="categoria.id_categoria" type="button" class="rounded-full bg-neutral-lightest px-4 py-2 text-xs font-semibold text-neutral-dark hover:bg-subaction" @click="seleccionarSubcategoria(categoria.subcategorias[0]?.id_subcategoria)">{{ categoria.nombre }}</button>
          </div>
          <div class="mb-4 flex items-center justify-between"><p class="text-sm text-neutral-medium"><strong class="text-neutral-black">{{ total }}</strong> productos encontrados</p></div>

          <div v-if="cargando" class="grid grid-cols-2 gap-4 xl:grid-cols-4"><div v-for="n in 8" :key="n" class="h-80 animate-pulse rounded-card bg-neutral-lightest" /></div>
          <div v-else-if="error" class="rounded-card border border-neutral-light p-10 text-center"><CircleAlert :size="30" class="mx-auto text-highlight" /><p class="mt-3 text-sm">{{ error }}</p><button type="button" class="mt-4 rounded-button bg-action px-4 py-2 text-sm text-white" @click="cargarInicio">Reintentar</button></div>
          <div v-else-if="productos.length" class="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <TarjetaProductoPublico v-for="producto in productos" :key="producto.id_producto" :producto="producto" @ver="verProducto" @agregar="mostrarMensaje('Agregar al carrito requiere M07.')" />
          </div>
          <p v-else class="rounded-card bg-neutral-lightest p-10 text-center text-sm text-neutral-medium">No encontramos productos con estos filtros.</p>

          <nav v-if="totalPaginas > 1" class="mt-8 flex justify-center gap-2" aria-label="Paginación">
            <button type="button" class="h-9 rounded-button border border-neutral-light px-3 disabled:opacity-40" :disabled="pagina === 1" @click="irPagina(pagina - 1)"><ChevronLeft :size="16" /></button>
            <button v-for="numero in totalPaginas" :key="numero" type="button" class="h-9 min-w-9 rounded-button border px-3 text-sm" :class="pagina === numero ? 'border-action bg-action text-white' : 'border-neutral-light'" @click="irPagina(numero)">{{ numero }}</button>
            <button type="button" class="h-9 rounded-button border border-neutral-light px-3 disabled:opacity-40" :disabled="pagina === totalPaginas" @click="irPagina(pagina + 1)"><ChevronRight :size="16" /></button>
          </nav>
        </div>
      </section>
    </main>

    <PieTiendaPublica :categorias="categorias" />
    <MenuCategoriasPublico :abierto="menuCategoriasAbierto" :cargando="cargando" :categorias="categorias" @cerrar="menuCategoriasAbierto = false" @seleccionar="seleccionarDesdeMenu" />
    <CalculadoraPinturaPublica :abierta="calculadoraAbierta" :producto="productos[0]?.detalle" @cerrar="calculadoraAbierta = false" @agregar="mostrarMensaje('Agregar al carrito requiere M07.')" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Calculator, ChevronLeft, ChevronRight, CircleAlert, Palette, Search, SlidersHorizontal, X } from 'lucide-vue-next';
import heroStorefront from '../assets/storefront/hero-storefront.png';
import CalculadoraPinturaPublica from '../components/publicas/CalculadoraPinturaPublica.vue';
import EncabezadoTiendaPublica from '../components/publicas/EncabezadoTiendaPublica.vue';
import MenuCategoriasPublico from '../components/publicas/MenuCategoriasPublico.vue';
import PieTiendaPublica from '../components/publicas/PieTiendaPublica.vue';
import TarjetaProductoPublico from '../components/publicas/TarjetaProductoPublico.vue';
import { useCatalogoPublico } from '../composables/useCatalogoPublico';

const router = useRouter();
const menuCategoriasAbierto = ref(false);
const calculadoraAbierta = ref(false);
const mensaje = ref<string | null>(null);
const { buscar, cargando, cargarInicio, categorias, error, irPagina, limpiar, pagina, productos, seleccionarSubcategoria, subcategoria, termino, total, totalPaginas } = useCatalogoPublico();

function mostrarMensaje(texto: string): void { mensaje.value = texto; }
function seleccionarDesdeMenu(id: number): void { menuCategoriasAbierto.value = false; seleccionarSubcategoria(id); }
function verProducto(id: number): void { void router.push({ name: 'DetalleProductoPublico', params: { productoId: id } }); }
</script>
