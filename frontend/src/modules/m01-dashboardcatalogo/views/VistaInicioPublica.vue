<template>
  <div class="min-h-screen bg-neutral-white text-neutral-dark">
    <header>
      <div class="hidden bg-corporate text-white lg:block">
        <div class="mx-auto flex max-w-7xl items-center justify-center gap-8 px-6 py-1.5 text-[11px]">
          <span class="flex items-center gap-1.5"><MapPin :size="12" /> Envíos a todo el Caquetá</span>
          <span class="flex items-center gap-1.5"><BadgeCheck :size="12" /> Productos de calidad</span>
          <span class="flex items-center gap-1.5"><Headphones :size="12" /> Asesoría experta</span>
          <span class="flex items-center gap-1.5"><CircleHelp :size="12" /> ¿Necesitas ayuda?</span>
          <span class="flex items-center gap-1.5"><Phone :size="12" /> 322 123 4567</span>
        </div>
      </div>

      <div class="border-b border-neutral-light bg-neutral-white">
        <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <router-link to="/" class="shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">
            <img :src="logo" alt="Pintu Clic" class="h-11 w-auto object-contain" />
          </router-link>

          <button
            type="button"
            class="flex items-center gap-2 rounded-button bg-action px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action sm:px-5"
            @click="menuCategoriasAbierto = true"
          >
            <Menu :size="18" aria-hidden="true" />
            <span class="hidden sm:inline">Categorías</span>
            <ChevronDown :size="14" aria-hidden="true" />
          </button>

          <nav class="hidden flex-1 items-center justify-center gap-6 text-xs font-medium lg:flex" aria-label="Navegación principal">
            <a href="#inicio" class="border-b-2 border-action py-5 text-action">Inicio</a>
            <a href="#productos" class="py-5 text-neutral-dark transition-colors hover:text-action">Productos</a>
            <a href="#productos" class="rounded-full bg-highlight px-2.5 py-1 font-bold text-corporate">OFERTAS</a>
            <a href="#servicios" class="py-5 text-neutral-dark transition-colors hover:text-action">Servicios</a>
            <a href="#categorias" class="py-5 text-neutral-dark transition-colors hover:text-action">Paleta de Color</a>
            <a href="#contacto" class="py-5 text-neutral-dark transition-colors hover:text-action">Sobre Nosotros</a>
          </nav>

          <div class="ml-auto flex items-center gap-2 sm:gap-5">
            <button
              type="button"
              class="flex items-center gap-2 rounded-button p-2 text-corporate transition-colors hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              @click="informarPendiente('La conexión con Mi cuenta pertenece a M04 y se incorporará en su integración.')"
            >
              <UserRound :size="20" aria-hidden="true" />
              <span class="hidden text-left text-[11px] leading-tight md:block">
                <strong class="block">Mi cuenta</strong>
                Iniciar sesión
              </span>
            </button>
            <button
              type="button"
              class="relative flex items-center gap-2 rounded-button p-2 text-corporate transition-colors hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              aria-label="Ver carrito"
              @click="informarPendiente('El carrito pertenece a M07 y se conectará cuando ese módulo esté disponible.')"
            >
              <ShoppingCart :size="21" aria-hidden="true" />
              <span class="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-highlight px-1 text-[9px] font-bold text-corporate">0</span>
              <span class="hidden text-left text-[11px] leading-tight xl:block">
                <strong class="block">Carrito</strong>
                $0
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main id="inicio">
      <section class="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div class="relative min-h-80 overflow-hidden rounded-card bg-corporate sm:min-h-96 lg:min-h-80">
          <img
            :src="heroStorefront"
            alt="Pinturas y herramientas para tus proyectos"
            class="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-corporate via-corporate/80 to-transparent" />
          <div class="relative z-10 flex min-h-80 max-w-xl flex-col justify-center px-7 py-10 text-white sm:min-h-96 sm:px-12 lg:min-h-80">
            <h1 class="max-w-md text-3xl font-bold leading-tight sm:text-4xl">
              Todo para tu proyecto,<br />
              <span class="text-highlight">en un solo lugar</span>
            </h1>
            <p class="mt-4 max-w-md text-sm leading-6 text-white/90">
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

      <section id="servicios" class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div class="grid grid-cols-2 divide-x divide-y divide-neutral-light rounded-card border border-neutral-light bg-neutral-lightest sm:grid-cols-4 sm:divide-y-0">
          <div v-for="beneficio in beneficios" :key="beneficio.titulo" class="flex items-center gap-3 px-4 py-4 sm:justify-center">
            <component :is="beneficio.icono" :size="22" class="shrink-0 text-corporate" aria-hidden="true" />
            <div>
              <p class="text-xs font-bold text-neutral-black">{{ beneficio.titulo }}</p>
              <p class="text-[10px] text-neutral-medium">{{ beneficio.detalle }}</p>
            </div>
          </div>
        </div>
      </section>

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
            @click="informarPendiente('La calculadora de pintura se incorporará con su diseño correspondiente.')"
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

      <div v-if="mensaje" class="mx-auto max-w-7xl px-4 pb-2 sm:px-6" role="status">
        <div class="flex items-start justify-between gap-3 rounded-card bg-subaction px-4 py-3 text-sm text-corporate">
          <span>{{ mensaje }}</span>
          <button type="button" class="shrink-0 rounded p-1 hover:bg-neutral-white" aria-label="Cerrar mensaje" @click="mensaje = null">
            <X :size="16" />
          </button>
        </div>
      </div>

      <section id="productos" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-xl font-bold text-neutral-black">Productos destacados</h2>
          <button type="button" class="text-sm font-semibold text-conversion-hover hover:text-conversion" @click="informarPendiente('La vista completa del catálogo será la siguiente pantalla de HU-CAT-06.')">
            Ver todos <ChevronRight :size="15" class="inline" />
          </button>
        </div>

        <div v-if="cargando" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5" aria-live="polite">
          <div v-for="indice in 5" :key="indice" class="h-80 animate-pulse rounded-card bg-neutral-lightest" />
        </div>
        <div v-else-if="error" class="rounded-card border border-neutral-light bg-neutral-lightest px-6 py-10 text-center">
          <CircleAlert :size="32" class="mx-auto text-highlight" />
          <p class="mt-3 text-sm text-neutral-dark">{{ error }}</p>
          <button type="button" class="mt-4 rounded-button bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-hover" @click="cargarInicio">
            Reintentar
          </button>
        </div>
        <div v-else-if="productos.length" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <TarjetaProductoPublico
            v-for="(producto, indice) in productos"
            :key="producto.id_producto"
            :producto="producto"
            :destacado="indice === 0"
            @ver="verProducto"
            @agregar="agregarProducto"
          />
        </div>
        <p v-else class="rounded-card bg-neutral-lightest px-6 py-10 text-center text-sm text-neutral-medium">
          No encontramos productos para mostrar.
        </p>
      </section>

      <section id="categorias" class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-xl font-bold text-neutral-black">Explora nuestras categorías</h2>
          <button type="button" class="text-sm font-semibold text-action hover:text-action-hover" @click="menuCategoriasAbierto = true">
            Ver categorías <ChevronRight :size="15" class="inline" />
          </button>
        </div>
        <div v-if="categorias.length" class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <button
            v-for="(categoria, indice) in categorias.slice(0, 5)"
            :key="categoria.id_categoria"
            type="button"
            class="group relative min-h-32 overflow-hidden rounded-card p-4 text-left text-white transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            :class="claseCategoria(indice)"
            @click="seleccionarCategoria(categoria.subcategorias[0]?.id_subcategoria)"
          >
            <Shapes :size="72" class="absolute -bottom-3 -right-2 opacity-25 transition-transform group-hover:scale-110" />
            <strong class="relative block text-base leading-tight">{{ categoria.nombre }}</strong>
            <span class="relative mt-2 inline-flex items-center gap-1 text-xs font-medium">
              Ver productos <ChevronRight :size="13" />
            </span>
          </button>
        </div>
        <div v-else-if="!cargando" class="rounded-card bg-neutral-lightest px-6 py-8 text-center text-sm text-neutral-medium">
          Las categorías públicas disponibles aparecerán aquí.
        </div>
      </section>
    </main>

    <footer id="contacto" class="mt-8 bg-corporate text-white">
      <div class="mx-auto grid max-w-7xl gap-9 px-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img :src="logo" alt="Pintu Clic" class="h-14 rounded-card bg-neutral-white p-1 object-contain" />
          <p class="mt-4 max-w-xs text-xs leading-5 text-white/75">
            Todo para tu proyecto en un solo lugar. Calidad, asesoría y envío rápido a todo Colombia.
          </p>
        </div>
        <div>
          <h2 class="text-base font-bold">Categorías</h2>
          <ul class="mt-4 space-y-2 text-xs text-white/75">
            <li v-for="categoria in categorias.slice(0, 4)" :key="categoria.id_categoria">{{ categoria.nombre }}</li>
          </ul>
        </div>
        <div>
          <h2 class="text-base font-bold">Servicios</h2>
          <ul class="mt-4 space-y-2 text-xs text-white/75">
            <li>Asesoría de color</li>
            <li>Calculadora de pintura</li>
            <li>Directorio de pintores</li>
            <li>Centro de ayuda</li>
          </ul>
        </div>
        <div>
          <h2 class="text-base font-bold">Contacto</h2>
          <ul class="mt-4 space-y-2 text-xs text-white/75">
            <li class="flex items-center gap-2"><MapPin :size="14" /> Bogotá, Colombia</li>
            <li class="flex items-center gap-2"><Phone :size="14" /> 322 123 4567</li>
            <li class="flex items-center gap-2"><Mail :size="14" /> contacto@pintuclic.com</li>
          </ul>
        </div>
      </div>
      <div class="mx-auto flex max-w-7xl flex-col gap-3 border-t border-neutral-white/20 px-6 py-5 text-[11px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Pintu Clic. Todos los derechos reservados.</p>
        <p>Términos y condiciones · Política de privacidad · Políticas de envío</p>
      </div>
    </footer>

    <MenuCategoriasPublico
      :abierto="menuCategoriasAbierto"
      :cargando="cargando"
      :categorias="categorias"
      @cerrar="menuCategoriasAbierto = false"
      @seleccionar="seleccionarSubcategoria"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  BadgeCheck,
  Calculator,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  CreditCard,
  Headphones,
  LoaderCircle,
  Mail,
  MapPin,
  Menu,
  PackageCheck,
  Palette,
  Phone,
  Search,
  Shapes,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  X,
} from 'lucide-vue-next';
import logo from '@/assets/logo.png';
import heroStorefront from '../assets/storefront/hero-storefront.png';
import MenuCategoriasPublico from '../components/publicas/MenuCategoriasPublico.vue';
import TarjetaProductoPublico from '../components/publicas/TarjetaProductoPublico.vue';
import { useInicioPublico } from '../composables/useInicioPublico';

const menuCategoriasAbierto = ref(false);
const terminoBusqueda = ref('');
const mensaje = ref<string | null>(null);

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

function verProducto(): void {
  informarPendiente('La ficha pública del producto será incorporada cuando compartas su diseño.');
}

function agregarProducto(): void {
  informarPendiente('Agregar al carrito requiere la integración con M07.');
}
</script>
