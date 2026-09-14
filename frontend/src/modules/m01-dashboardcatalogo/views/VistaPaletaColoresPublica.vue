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

        <div class="relative min-h-64 overflow-hidden rounded-card bg-corporate sm:min-h-72">
          <img :src="heroStorefront" alt="Pinturas y herramientas rodeadas de una explosión de color" class="absolute inset-0 h-full w-full object-cover object-center" />
          <div class="absolute inset-0 bg-gradient-to-r from-corporate via-corporate/85 to-transparent" />
          <div class="relative z-10 flex min-h-64 max-w-xl flex-col justify-center px-7 py-10 text-white sm:min-h-72 sm:px-12">
            <p class="text-sm font-semibold">Paleta de colores</p>
            <h1 class="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">Elige el color perfecto<br />para tu proyecto</h1>
            <p class="mt-4 max-w-md text-sm leading-6 text-white/85">Explora los colores disponibles en productos publicados y encuentra una opción para transformar tu espacio.</p>
          </div>
        </div>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <div class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="flex items-center gap-2 text-base font-bold text-corporate"><Droplets :size="19" class="text-action" /> Filtrar por familia de color</h2>
            <label class="relative block sm:w-72">
              <span class="sr-only">Buscar color por nombre</span>
              <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-medium" />
              <input v-model="termino" type="search" maxlength="120" placeholder="Buscar color..." class="h-11 w-full rounded-input border border-neutral-light bg-neutral-lightest pl-9 pr-3 text-sm outline-none transition-shadow focus:border-action focus:ring-2 focus:ring-action" />
            </label>
          </div>
          <div class="mt-4 flex gap-8 overflow-x-auto border-b border-neutral-light text-xs font-semibold">
            <button type="button" class="border-b-2 px-1 pb-3 transition-colors" :class="familiaSeleccionada === null ? 'border-action text-action' : 'border-transparent text-neutral-dark hover:text-action'" @click="seleccionarFamilia(null)">Todas</button>
            <button v-for="familia in familias" :key="familia.valor" type="button" class="border-b-2 px-1 pb-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" :class="familiaSeleccionada === familia.valor ? 'border-action text-action' : 'border-transparent text-neutral-dark hover:text-action'" @click="seleccionarFamilia(familia.valor)">{{ familia.etiqueta }}</button>
          </div>
        </div>
      </section>

      <section class="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-2">
        <article class="rounded-card border border-neutral-light bg-neutral-white p-6 shadow-sm">
          <h2 class="text-xl font-bold text-corporate">Paleta de colores</h2>
          <p class="mt-1 text-xs text-neutral-medium">Selecciona un color disponible para consultar productos compatibles.</p>

          <div v-if="cargando" class="mt-6 h-80 animate-pulse rounded-card bg-neutral-lightest" />
          <div v-else-if="error" class="mt-6 rounded-card bg-neutral-lightest p-8 text-center">
            <CircleAlert :size="30" class="mx-auto text-highlight" />
            <p class="mt-3 text-sm">{{ error }}</p>
            <button type="button" class="mt-4 min-h-11 rounded-button bg-action px-4 text-sm font-medium text-white shadow-sm transition-all hover:bg-action-hover hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="cargarPaleta">Reintentar</button>
          </div>
          <div v-else class="mt-3">
            <p v-if="!coloresFiltrados.length" class="mb-4 rounded-card bg-neutral-lightest p-5 text-center text-sm text-neutral-medium">No hay colores publicados que coincidan con la búsqueda.</p>
            <AbanicoColoresPublico :colores="coloresFiltrados" :color-seleccionado-id="colorSeleccionado?.id_color ?? null" @seleccionar="seleccionarColor" />
          </div>
        </article>

        <article class="flex flex-col rounded-card border border-neutral-light bg-neutral-white p-6 shadow-sm lg:p-8">
          <header>
            <h2 class="text-xl font-bold text-corporate">Combinador de colores</h2>
            <p class="mt-1 text-sm leading-5 text-neutral-medium">A partir del color seleccionado te sugerimos combinaciones que armonizan.</p>
          </header>

          <div class="mt-6 flex items-center gap-5 rounded-card border border-neutral-light bg-neutral-lightest p-4 shadow-sm">
            <span class="h-16 w-16 shrink-0 rounded-card border border-neutral-light bg-action shadow-inner transition-colors duration-300" :style="{ backgroundColor: colorSeleccionado?.muestra_hex ?? undefined }" />
            <div>
              <p class="text-xs text-neutral-medium">Color seleccionado</p>
              <h3 class="text-lg font-bold text-corporate">{{ colorSeleccionado?.nombre ?? 'Sin color disponible' }}</h3>
              <p class="text-xs font-semibold uppercase tracking-wide text-neutral-medium">
                {{ colorSeleccionado?.codigo ?? 'Sin código comercial' }}<template v-if="colorSeleccionado?.muestra_hex"> · {{ colorSeleccionado.muestra_hex }}</template>
              </p>
            </div>
          </div>

          <div class="mt-6 grid flex-1 gap-4 sm:grid-cols-2">
            <TarjetaCombinacionColoresPublica v-for="esquema in esquemas" :key="esquema.nombre" :esquema="esquema" :color-seleccionado-id="colorSeleccionado?.id_color ?? null" @seleccionar="seleccionarColor" />
          </div>
        </article>
      </section>

      <section class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div class="mb-5 flex items-end justify-between"><div><h2 class="text-xl font-bold text-corporate">Productos recomendados</h2><p class="mt-1 text-xs text-neutral-medium">Opciones publicadas asociadas al color seleccionado.</p></div><router-link to="/catalogo" class="inline-flex min-h-11 items-center text-xs font-medium text-action hover:text-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">Ver todos <ChevronRight :size="13" class="ml-1" /></router-link></div>
        <div v-if="productosRecomendados.length" class="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-5"><TarjetaProductoPublico v-for="producto in productosRecomendados" :key="producto.id_producto" :producto="producto" :muestra-color="colorSeleccionado?.muestra_hex ?? null" @ver="verProducto" @agregar="mostrarMensaje('Agregar al carrito requiere la integración con M07.')" /></div>
        <p v-else-if="!cargando" class="rounded-card bg-neutral-white p-8 text-center text-sm text-neutral-medium">No hay pinturas publicadas asociadas a este color.</p>
      </section>

      <section class="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
        <h2 class="text-xl font-bold text-corporate">Productos que podrían interesarte</h2>
        <p class="mt-1 text-xs text-neutral-medium">Herramientas y accesorios para completar tu proyecto.</p>
        <div v-if="productosComplementarios.length" class="mt-5 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-5"><TarjetaProductoPublico v-for="producto in productosComplementarios" :key="producto.id_producto" :producto="producto" @ver="verProducto" @agregar="mostrarMensaje('Agregar al carrito requiere la integración con M07.')" /></div>
      </section>

      <section id="servicios" class="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
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
import { BadgeCheck, ChevronRight, CircleAlert, Droplets, Headphones, Search, ShieldCheck, Truck, X } from 'lucide-vue-next';
import heroStorefront from '../assets/storefront/hero-storefront.png';
import EncabezadoTiendaPublica from '../components/publicas/EncabezadoTiendaPublica.vue';
import AbanicoColoresPublico from '../components/publicas/AbanicoColoresPublico.vue';
import MenuCategoriasPublico from '../components/publicas/MenuCategoriasPublico.vue';
import PieTiendaPublica from '../components/publicas/PieTiendaPublica.vue';
import TarjetaProductoPublico from '../components/publicas/TarjetaProductoPublico.vue';
import TarjetaCombinacionColoresPublica from '../components/publicas/TarjetaCombinacionColoresPublica.vue';
import { usePaletaColoresPublica } from '../composables/usePaletaColoresPublica';
import { useCombinacionesPaleta } from '../composables/useCombinacionesPaleta';

const router = useRouter();
const menuCategoriasAbierto = ref(false);
const mensaje = ref<string | null>(null);
const familias = [
  { valor: 'amarillos', etiqueta: 'Amarillos' },
  { valor: 'azules', etiqueta: 'Azules' },
  { valor: 'verdes', etiqueta: 'Verdes' },
  { valor: 'rojos', etiqueta: 'Rojos' },
  { valor: 'grises', etiqueta: 'Grises' },
] as const;
const beneficios = [
  { titulo: 'Asesoría experta', detalle: 'Te ayudamos a elegir', icono: Headphones },
  { titulo: 'Productos de calidad', detalle: 'Marcas seleccionadas', icono: BadgeCheck },
  { titulo: 'Envíos rápidos', detalle: 'A todo el Caquetá', icono: Truck },
  { titulo: 'Compra segura', detalle: 'Tus datos protegidos', icono: ShieldCheck },
] as const;

const { cargarPaleta, cargando, categorias, colorSeleccionado, colores, coloresFiltrados, error, familiaSeleccionada, productosComplementarios, productosRecomendados, seleccionarColor, seleccionarFamilia, termino } = usePaletaColoresPublica();
const { esquemas } = useCombinacionesPaleta(colores, colorSeleccionado);

function mostrarMensaje(texto: string): void { mensaje.value = texto; }
function verProducto(idProducto: number): void { void router.push({ name: 'DetalleProductoPublico', params: { productoId: idProducto } }); }
function seleccionarSubcategoria(idSubcategoria: number): void { menuCategoriasAbierto.value = false; void router.push({ name: 'CatalogoPublico', query: { subcategoria: idSubcategoria } }); }
</script>
