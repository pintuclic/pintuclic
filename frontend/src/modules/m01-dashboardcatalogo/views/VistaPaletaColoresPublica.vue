<template>
  <div class="min-h-screen bg-neutral-lightest text-neutral-dark">
    <EncabezadoTiendaPublica @abrir-categorias="menuCategoriasAbierto = true" @informar="mostrarMensaje" />

    <main>
      <section class="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <nav class="mb-4 text-xs text-neutral-medium" aria-label="Migas de pan">
          <router-link to="/" class="hover:text-action">Inicio</router-link>
          <ChevronRight :size="13" class="mx-1 inline" aria-hidden="true" />
          <span class="font-semibold text-corporate">Paleta de colores</span>
        </nav>

        <div class="relative min-h-72 overflow-hidden rounded-card bg-corporate sm:min-h-80">
          <img :src="heroStorefront" alt="Pinturas y herramientas rodeadas de una explosión de color" class="absolute inset-0 h-full w-full object-cover object-center" />
          <div class="absolute inset-0 bg-gradient-to-r from-corporate via-corporate/85 to-transparent" />
          <div class="relative z-10 flex min-h-72 max-w-xl flex-col justify-center px-7 py-10 text-white sm:min-h-80 sm:px-12">
            <p class="text-sm font-semibold">Paleta de colores</p>
            <h1 class="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">Elige el color perfecto<br />para tu proyecto</h1>
            <p class="mt-4 max-w-md text-sm leading-6 text-white/85">Explora los colores disponibles en productos publicados y encuentra una opción para transformar tu espacio.</p>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="flex items-center gap-2 text-base font-bold text-corporate"><Droplets :size="19" class="text-action" /> Filtrar por familia de color</h2>
            <label class="relative block sm:w-72">
              <span class="sr-only">Buscar color por nombre</span>
              <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium" />
              <input v-model="termino" type="search" maxlength="120" placeholder="Buscar color..." class="h-10 w-full rounded-input border border-neutral-light bg-neutral-lightest pl-9 pr-3 text-sm outline-none focus:border-action focus:ring-2 focus:ring-action" />
            </label>
          </div>
          <div class="mt-4 flex gap-6 overflow-x-auto border-b border-neutral-light text-xs font-semibold">
            <button type="button" class="border-b-2 border-action px-1 pb-3 text-action">Todas</button>
            <button v-for="familia in familiasPendientes" :key="familia" type="button" disabled class="cursor-not-allowed px-1 pb-3 text-neutral-medium opacity-60" title="La familia cromática aún no está disponible en la API pública">{{ familia }}</button>
          </div>
          <p class="mt-3 flex items-start gap-2 text-xs text-neutral-medium"><Info :size="15" class="mt-0.5 shrink-0 text-action" /> Las familias se habilitarán cuando el catálogo público entregue esta clasificación. Por ahora puedes buscar y elegir los colores reales de las variantes publicadas.</p>
        </div>
      </section>

      <section class="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.05fr]">
        <article class="rounded-card border border-neutral-light bg-neutral-white p-6 shadow-sm">
          <h2 class="text-xl font-bold text-corporate">Paleta de colores</h2>
          <p class="mt-1 text-xs text-neutral-medium">Selecciona un color disponible para consultar productos compatibles.</p>

          <div v-if="cargando" class="mt-6 h-80 animate-pulse rounded-card bg-neutral-lightest" />
          <div v-else-if="error" class="mt-6 rounded-card bg-neutral-lightest p-8 text-center">
            <CircleAlert :size="30" class="mx-auto text-highlight" />
            <p class="mt-3 text-sm">{{ error }}</p>
            <button type="button" class="mt-4 rounded-button bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover" @click="cargarPaleta">Reintentar</button>
          </div>
          <div v-else class="mt-6 grid gap-6 sm:grid-cols-[180px_1fr] sm:items-center">
            <div class="relative mx-auto h-72 w-44" aria-hidden="true">
              <span v-for="(clase, indice) in abanicoClases" :key="clase" class="absolute bottom-5 left-1/2 h-60 w-16 origin-bottom -translate-x-1/2 rounded-card border-4 border-neutral-white shadow-md" :class="[clase, abanicoRotaciones[indice]]"><span class="absolute bottom-3 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-neutral-white/70" /></span>
              <span class="absolute bottom-2 left-1/2 z-20 h-8 w-8 -translate-x-1/2 rounded-full border-4 border-neutral-white bg-corporate shadow-md" />
            </div>

            <div>
              <p v-if="!coloresFiltrados.length" class="rounded-card bg-neutral-lightest p-5 text-center text-sm text-neutral-medium">No hay colores publicados que coincidan con la búsqueda.</p>
              <div v-else class="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                <button v-for="(color, indice) in coloresFiltrados" :key="color.id_color" type="button" class="flex items-center gap-3 rounded-button border p-3 text-left transition-colors hover:bg-subaction" :class="colorSeleccionado?.id_color === color.id_color ? 'border-action bg-subaction' : 'border-neutral-light bg-neutral-white'" @click="seleccionarColor(color.id_color)">
                  <span class="h-9 w-9 shrink-0 rounded-full border-2 border-neutral-white shadow" :class="muestraClase(indice)" aria-hidden="true" />
                  <span class="min-w-0"><strong class="block truncate text-sm text-corporate">{{ color.nombre }}</strong><small class="text-neutral-medium">{{ color.productos.length }} producto{{ color.productos.length === 1 ? '' : 's' }}</small></span>
                </button>
              </div>
            </div>
          </div>
        </article>

        <article class="rounded-card border border-neutral-light bg-neutral-white p-6 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div><h2 class="text-xl font-bold text-corporate">Combinador de colores</h2><p class="mt-1 text-xs text-neutral-medium">Inspiración visual basada en el color seleccionado.</p></div>
            <button type="button" class="rounded-button bg-neutral-lightest px-3 py-2 text-xs font-semibold text-corporate hover:bg-subaction" @click="mostrarMensaje('Los ambientes fotográficos se incorporarán con la fuente pública de imágenes de color.')">Cambiar ambiente</button>
          </div>

          <div class="mt-6 flex items-center gap-4 rounded-card border border-neutral-light bg-neutral-lightest p-4">
            <span class="h-16 w-16 shrink-0 rounded-card bg-action shadow-sm" />
            <div><p class="text-xs text-neutral-medium">Color seleccionado</p><h3 class="text-lg font-bold text-corporate">{{ colorSeleccionado?.nombre ?? 'Sin color disponible' }}</h3><p class="text-xs text-neutral-medium">Código y muestra exacta pendientes de la API pública</p></div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div v-for="esquema in esquemas" :key="esquema.nombre" class="rounded-card border border-neutral-light p-4">
              <h3 class="text-sm font-bold text-corporate">{{ esquema.nombre }}</h3>
              <p class="mt-1 min-h-8 text-xs text-neutral-medium">{{ esquema.descripcion }}</p>
              <div class="mt-4 flex h-7 overflow-hidden rounded-button"><span v-for="clase in esquema.clases" :key="clase" class="flex-1" :class="clase" /></div>
            </div>
          </div>
        </article>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div class="mb-5 flex items-end justify-between"><div><h2 class="text-xl font-bold text-corporate">Productos recomendados</h2><p class="mt-1 text-xs text-neutral-medium">Opciones publicadas asociadas al color seleccionado.</p></div><router-link to="/catalogo" class="text-xs font-semibold text-action hover:text-action-hover">Ver todos <ChevronRight :size="13" class="inline" /></router-link></div>
        <div v-if="productosRecomendados.length" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"><TarjetaProductoPublico v-for="producto in productosRecomendados" :key="producto.id_producto" :producto="producto" @ver="verProducto" @agregar="mostrarMensaje('Agregar al carrito requiere la integración con M07.')" /></div>
        <p v-else-if="!cargando" class="rounded-card bg-neutral-white p-8 text-center text-sm text-neutral-medium">No hay pinturas publicadas asociadas a este color.</p>
      </section>

      <section class="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <h2 class="text-xl font-bold text-corporate">Productos que podrían interesarte</h2>
        <p class="mt-1 text-xs text-neutral-medium">Herramientas y accesorios para completar tu proyecto.</p>
        <div v-if="productosComplementarios.length" class="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5"><TarjetaProductoPublico v-for="producto in productosComplementarios" :key="producto.id_producto" :producto="producto" @ver="verProducto" @agregar="mostrarMensaje('Agregar al carrito requiere la integración con M07.')" /></div>
      </section>

      <section id="servicios" class="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div class="grid grid-cols-2 divide-x divide-y divide-neutral-light rounded-card border border-neutral-light bg-neutral-white sm:grid-cols-4 sm:divide-y-0">
          <div v-for="beneficio in beneficios" :key="beneficio.titulo" class="flex items-center gap-3 px-4 py-5 sm:justify-center"><component :is="beneficio.icono" :size="25" class="shrink-0 text-conversion" /><div><p class="text-xs font-bold text-corporate">{{ beneficio.titulo }}</p><p class="text-[10px] text-neutral-medium">{{ beneficio.detalle }}</p></div></div>
        </div>
      </section>
    </main>

    <div v-if="mensaje" class="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-card bg-corporate px-4 py-3 text-sm text-white shadow-lg" role="status"><div class="flex items-start justify-between gap-3"><span>{{ mensaje }}</span><button type="button" aria-label="Cerrar mensaje" @click="mensaje = null"><X :size="16" /></button></div></div>
    <PieTiendaPublica :categorias="categorias" />
    <MenuCategoriasPublico :abierto="menuCategoriasAbierto" :cargando="cargando" :categorias="categorias" @cerrar="menuCategoriasAbierto = false" @seleccionar="seleccionarSubcategoria" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { BadgeCheck, ChevronRight, CircleAlert, Droplets, Headphones, Info, Search, ShieldCheck, Truck, X } from 'lucide-vue-next';
import heroStorefront from '../assets/storefront/hero-storefront.png';
import EncabezadoTiendaPublica from '../components/publicas/EncabezadoTiendaPublica.vue';
import MenuCategoriasPublico from '../components/publicas/MenuCategoriasPublico.vue';
import PieTiendaPublica from '../components/publicas/PieTiendaPublica.vue';
import TarjetaProductoPublico from '../components/publicas/TarjetaProductoPublico.vue';
import { usePaletaColoresPublica } from '../composables/usePaletaColoresPublica';

const router = useRouter();
const menuCategoriasAbierto = ref(false);
const mensaje = ref<string | null>(null);
const familiasPendientes = ['Amarillos', 'Azules', 'Verdes', 'Rojos', 'Grises'] as const;
const abanicoClases = ['bg-corporate', 'bg-neutral-dark', 'bg-neutral-light', 'bg-subaction', 'bg-action', 'bg-conversion', 'bg-highlight'] as const;
const abanicoRotaciones = ['-rotate-[42deg]', '-rotate-[28deg]', '-rotate-[14deg]', 'rotate-0', 'rotate-[14deg]', 'rotate-[28deg]', 'rotate-[42deg]'] as const;
const muestras = ['bg-action', 'bg-corporate', 'bg-conversion', 'bg-highlight', 'bg-neutral-medium'] as const;
const esquemas = [
  { nombre: 'Complementario', descripcion: 'Contraste claro para destacar elementos del espacio.', clases: ['bg-action', 'bg-highlight'] },
  { nombre: 'Análogos', descripcion: 'Combinación suave con tonos cercanos.', clases: ['bg-conversion', 'bg-action', 'bg-corporate'] },
  { nombre: 'Triádico', descripcion: 'Tres acentos equilibrados para un ambiente dinámico.', clases: ['bg-action', 'bg-highlight', 'bg-conversion'] },
  { nombre: 'Monocromático', descripcion: 'Variaciones de claridad dentro de una misma identidad.', clases: ['bg-corporate', 'bg-action-hover', 'bg-action', 'bg-subaction'] },
] as const;
const beneficios = [
  { titulo: 'Asesoría experta', detalle: 'Te ayudamos a elegir', icono: Headphones },
  { titulo: 'Productos de calidad', detalle: 'Marcas seleccionadas', icono: BadgeCheck },
  { titulo: 'Envíos rápidos', detalle: 'A todo el Caquetá', icono: Truck },
  { titulo: 'Compra segura', detalle: 'Tus datos protegidos', icono: ShieldCheck },
] as const;

const { cargarPaleta, cargando, categorias, colorSeleccionado, coloresFiltrados, error, productosComplementarios, productosRecomendados, seleccionarColor, termino } = usePaletaColoresPublica();

function muestraClase(indice: number): string { return muestras[indice % muestras.length] ?? 'bg-action'; }
function mostrarMensaje(texto: string): void { mensaje.value = texto; }
function verProducto(idProducto: number): void { void router.push({ name: 'DetalleProductoPublico', params: { productoId: idProducto } }); }
function seleccionarSubcategoria(idSubcategoria: number): void { menuCategoriasAbierto.value = false; void router.push({ name: 'CatalogoPublico', query: { subcategoria: idSubcategoria } }); }
</script>
