<template>
  <div class="bg-neutral-lightest text-neutral-dark font-sans">
    <main id="inicio">
      <!-- Hero Principal -->
      <section class="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div class="relative min-h-80 overflow-hidden rounded-card bg-corporate sm:min-h-96 lg:min-h-80">
          <img
            :src="heroStorefront"
            alt="Pinturas y herramientas para tus proyectos"
            class="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-corporate via-corporate/80 to-transparent" />
          <div class="relative z-10 flex min-h-80 max-w-xl flex-col justify-center px-7 py-10 text-white sm:min-h-96 sm:px-12 lg:min-h-80">
            <h1 class="font-title max-w-md text-3xl font-bold leading-tight sm:text-4xl">
              Todo para tu proyecto,<br />
              <span class="text-highlight">en un solo lugar</span>
            </h1>
            <p class="font-sans mt-4 max-w-md text-sm leading-6 text-white/90">
              Pinturas, herramientas y accesorios de las mejores marcas. Calidad, asesoría y envío rápido.
            </p>
            <div class="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#productos"
                class="inline-flex items-center justify-center gap-2 rounded-button bg-conversion px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-conversion-hover active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
              >
                Comprar ahora <ShoppingCart :size="16" />
              </a>
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-button border border-neutral-white px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-neutral-white hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-white"
                @click="informarPendiente('La asesoría de color se habilitará en una entrega posterior.')"
              >
                Pedir asesoría <Palette :size="16" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Beneficios / Servicios -->
      <section id="servicios" class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div class="grid grid-cols-2 divide-x divide-y divide-neutral-light rounded-card border border-neutral-light bg-neutral-white sm:grid-cols-4 sm:divide-y-0">
          <div v-for="beneficio in beneficios" :key="beneficio.titulo" class="flex items-center gap-3 px-4 py-4 sm:justify-center">
            <component :is="beneficio.icono" :size="22" class="shrink-0 text-corporate" aria-hidden="true" />
            <div>
              <p class="text-xs font-bold text-neutral-black">{{ beneficio.titulo }}</p>
              <p class="text-[10px] text-neutral-medium">{{ beneficio.detalle }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Buscador y Accesos Rápidos -->
      <section class="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <form class="grid gap-3 lg:grid-cols-[1fr_auto_auto]" role="search" @submit.prevent="ejecutarBusqueda">
          <label class="relative block">
            <span class="sr-only">Buscar productos, marcas o categorías</span>
            <input
              v-model="terminoBusqueda"
              type="search"
              maxlength="120"
              placeholder="Buscar productos, marcas, categorías..."
              class="h-11 w-full rounded-button border border-action bg-neutral-white pl-4 pr-14 text-sm text-neutral-dark outline-none transition-shadow placeholder:text-neutral-medium focus:ring-2 focus:ring-action"
            />
            <button
              type="submit"
              class="absolute right-0 top-0 grid h-11 w-12 place-items-center rounded-r-button bg-action text-white transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              :disabled="buscando"
              aria-label="Buscar"
            >
              <LoaderCircle v-if="buscando" :size="18" class="animate-spin" />
              <Search v-else :size="18" />
            </button>
          </label>
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-button bg-conversion px-7 text-sm font-semibold text-white transition-colors hover:bg-conversion-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
            @click="calculadoraAbierta = true"
          >
            Calculadora <Calculator :size="18" />
          </button>
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-button bg-action px-7 text-sm font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            @click="informarPendiente('La asesoría de color se incorporará con su diseño correspondiente.')"
          >
            Asesoría de color <Palette :size="18" />
          </button>
        </form>
      </section>

      <!-- Mensaje de estado -->
      <div v-if="mensaje" class="mx-auto max-w-7xl px-4 pb-2 sm:px-6" role="status">
        <div class="flex items-start justify-between gap-3 rounded-card bg-subaction px-4 py-3 text-sm text-corporate">
          <span>{{ mensaje }}</span>
          <button type="button" class="shrink-0 rounded p-1 hover:bg-neutral-white" aria-label="Cerrar mensaje" @click="mensaje = null">
            <X :size="16" />
          </button>
        </div>
      </div>

      <!-- Productos Destacados -->
      <section id="productos" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="font-title text-xl font-bold text-neutral-black">Productos destacados</h2>
          <router-link to="/catalogo" class="text-sm font-semibold text-action hover:text-action-hover">
            Ver todos <ChevronRight :size="15" class="inline" />
          </router-link>
        </div>

        <div v-if="cargando" class="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-5" aria-live="polite">
          <div v-for="indice in 5" :key="indice" class="h-80 animate-pulse rounded-card bg-neutral-white" />
        </div>
        <div v-else-if="error" class="rounded-card border border-neutral-light bg-neutral-white px-6 py-10 text-center">
          <CircleAlert :size="32" class="mx-auto text-highlight" />
          <p class="mt-3 text-sm text-neutral-dark">{{ error }}</p>
          <button type="button" class="mt-4 rounded-button bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover" @click="cargarInicio">
            Reintentar
          </button>
        </div>
        <div v-else-if="productos.length" class="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-5">
          <TarjetaProductoPublico
            v-for="(producto, indice) in productos"
            :key="producto.id_producto"
            :producto="producto"
            :destacado="indice === 0"
            @ver="verProducto"
            @agregar="agregarProducto"
          />
        </div>
        <p v-else class="rounded-card bg-neutral-white px-6 py-10 text-center text-sm text-neutral-medium">
          No encontramos productos para mostrar.
        </p>
      </section>

      <!-- Explorar Categorías -->
      <section id="categorias" class="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="font-title text-xl font-bold text-neutral-black">Explora nuestras categorías</h2>
          <button type="button" class="text-sm font-semibold text-action hover:text-action-hover" @click="menuCategoriasAbierto = true">
            Ver categorías <ChevronRight :size="15" class="inline" />
          </button>
        </div>
        <div v-if="categorias.length" class="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-3 lg:grid-cols-5">
          <button
            v-for="(categoria, indice) in categorias.slice(0, 5)"
            :key="categoria.id_categoria"
            type="button"
            class="group relative min-h-32 overflow-hidden rounded-card p-4 text-left text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            :class="claseCategoria(indice)"
            @click="seleccionarCategoria(categoria.subcategorias[0]?.id_subcategoria)"
          >
            <Shapes :size="72" class="absolute -bottom-3 -right-2 opacity-25 transition-transform group-hover:scale-110" />
            <strong class="font-title relative block text-base leading-tight">{{ categoria.nombre }}</strong>
            <span class="relative mt-2 inline-flex items-center gap-1 text-xs font-medium">
              Ver productos <ChevronRight :size="13" />
            </span>
          </button>
        </div>
        <div v-else-if="!cargando" class="rounded-card bg-neutral-white px-6 py-8 text-center text-sm text-neutral-medium">
          Las categorías públicas disponibles aparecerán aquí.
        </div>
      </section>
    </main>

    <!-- Modales de Negocio del Módulo M01 -->
    <MenuCategoriasPublico
      :abierto="menuCategoriasAbierto"
      :cargando="cargando"
      :categorias="categorias"
      @cerrar="menuCategoriasAbierto = false"
      @seleccionar="seleccionarSubcategoria"
    />
    <CalculadoraPinturaPublica
      :abierta="calculadoraAbierta"
      :producto="productos[0]?.detalle"
      @cerrar="calculadoraAbierta = false"
      @agregar="agregarProducto"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Calculator,
  ChevronRight,
  CircleAlert,
  CreditCard,
  LoaderCircle,
  PackageCheck,
  Palette,
  Search,
  Shapes,
  ShieldCheck,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-vue-next';
import heroStorefront from '../assets/storefront/hero-storefront.png';
import CalculadoraPinturaPublica from '../components/publicas/CalculadoraPinturaPublica.vue';
import MenuCategoriasPublico from '../components/publicas/MenuCategoriasPublico.vue';
import TarjetaProductoPublico from '../components/publicas/TarjetaProductoPublico.vue';
import { useInicioPublico } from '../composables/useInicioPublico';

const menuCategoriasAbierto = ref(false);
const calculadoraAbierta = ref(false);
const terminoBusqueda = ref('');
const mensaje = ref<string | null>(null);
const router = useRouter();

const {
  buscar,
  buscando,
  cargarInicio,
  cargando,
  categorias,
  error,
  filtrarPorSubcategoria,
  productos,
} = useInicioPublico();

const beneficios = [
  { titulo: 'Compra segura', detalle: 'Tus datos protegidos', icono: ShieldCheck },
  { titulo: 'Productos de calidad', detalle: 'Las mejores marcas', icono: PackageCheck },
  { titulo: 'Envíos rápidos', detalle: 'A toda Colombia', icono: Truck },
  { titulo: 'Pagos seguros', detalle: 'Múltiples métodos', icono: CreditCard },
] as const;

function claseCategoria(indice: number): string {
  const posicion = indice % 5;
  if (posicion === 0) return 'bg-corporate';
  if (posicion === 1) return 'bg-highlight text-corporate';
  if (posicion === 2) return 'bg-action';
  if (posicion === 3) return 'bg-conversion-hover';
  return 'bg-conversion-accent';
}

function informarPendiente(texto: string): void {
  mensaje.value = texto;
}

function ejecutarBusqueda(): void {
  void buscar(terminoBusqueda.value);
}

function seleccionarCategoria(idSubcategoria: number | undefined): void {
  if (idSubcategoria === undefined) {
    menuCategoriasAbierto.value = true;
    return;
  }
  seleccionarSubcategoria(idSubcategoria);
}

function seleccionarSubcategoria(idSubcategoria: number): void {
  menuCategoriasAbierto.value = false;
  void filtrarPorSubcategoria(idSubcategoria);
  document.querySelector('#productos')?.scrollIntoView({ behavior: 'smooth' });
}

function verProducto(idProducto: number): void {
  void router.push({ name: 'DetalleProductoPublico', params: { productoId: idProducto } });
}

function agregarProducto(): void {
  informarPendiente('Agregar al carrito requiere la integración con M07.');
}
</script>
