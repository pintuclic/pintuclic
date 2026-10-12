<template>
  <div class="bg-neutral-lightest text-neutral-dark font-sans">
    <!-- Fondo gris claro, igual que el inicio; tarjetas y panel de filtros quedan en blanco -->
    <main>
      <section class="mx-auto max-w-7xl px-4 pb-4 pt-6 sm:px-6 sm:pt-8">
        <nav class="text-xs text-neutral-medium" aria-label="Migas de pan">
          <router-link to="/" class="transition-colors hover:text-action">Inicio</router-link>
          <ChevronRight :size="13" class="mx-1 inline" />
          <span :class="seleccionActual ? 'text-neutral-medium' : 'font-medium text-corporate'">Productos</span>
          <template v-if="seleccionActual">
            <ChevronRight :size="13" class="mx-1 inline" />
            <span :class="seleccionActual.subcategoria ? 'text-neutral-medium' : 'font-medium text-corporate'">{{ seleccionActual.categoria }}</span>
            <template v-if="seleccionActual.subcategoria">
              <ChevronRight :size="13" class="mx-1 inline" />
              <span class="font-medium text-corporate">{{ seleccionActual.subcategoria }}</span>
            </template>
          </template>
        </nav>
        <h1 class="font-poppins mt-3 text-2xl font-bold text-corporate sm:text-4xl">{{ seleccionActual?.subcategoria ?? seleccionActual?.categoria ?? 'Todos los productos' }}</h1>
        <p class="mt-1.5 max-w-2xl text-sm leading-6 text-neutral-medium">{{ seleccionActual ? (seleccionActual.descripcion ?? `Productos de ${seleccionActual.categoria}`) : 'Explora pinturas, herramientas y accesorios publicados para completar tu proyecto.' }}</p>
      </section>

      <section class="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
        <form class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]" role="search" @submit.prevent="buscar">
          <label class="relative block sm:col-span-2 lg:col-span-1">
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
            class="inline-flex h-11 items-center justify-center gap-2 rounded-button bg-conversion px-6 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-conversion-hover hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
            @click="irCalculadora"
          >
            <Calculator :size="18" /> Calculadora
          </button>
          <button
            type="button"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-button bg-action px-6 text-sm font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-action-hover hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
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

      <!-- Panel de filtros (acordeones) y productos -->
      <div v-if="filtrosMovilAbiertos" class="fixed inset-0 z-40 bg-corporate/70 lg:hidden" role="presentation" @click="filtrosMovilAbiertos = false" />
      <!--
        Sin anclaje de scroll: al reemplazarse las tarjetas, Firefox «compensaba» moviendo la
        página cientos de píxeles. La posición la deciden el usuario y el catálogo.
      -->
      <section class="mx-auto grid max-w-7xl gap-6 px-4 pb-10 [overflow-anchor:none] sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        <aside
          id="panel-filtros"
          aria-label="Filtros del catálogo"
          class="bg-neutral-white"
          :class="filtrosMovilAbiertos
            ? 'fixed inset-y-0 left-0 z-50 flex w-[min(88vw,340px)] flex-col shadow-2xl'
            : 'hidden lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col lg:self-start lg:rounded-card lg:border lg:border-neutral-light'"
        >
          <div class="flex items-center justify-between gap-2 border-b border-neutral-light px-4 py-3">
            <h2 class="font-poppins flex items-center gap-2 text-base font-semibold text-neutral-black">
              <SlidersHorizontal :size="18" class="text-action" /> Filtros
            </h2>
            <div class="flex items-center gap-1">
              <button type="button" class="min-h-10 px-2 text-xs font-semibold text-action hover:text-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="limpiarFiltros">Limpiar todo</button>
              <button type="button" class="grid h-10 w-10 place-items-center rounded-button text-neutral-medium hover:bg-neutral-lightest lg:hidden" aria-label="Cerrar filtros" @click="filtrosMovilAbiertos = false">
                <X :size="18" />
              </button>
            </div>
          </div>

          <!--
            Único contenedor desplazable del panel: la rueda sobre los filtros los desplaza a
            ellos y, al llegar al final, no arrastra la página (overscroll contain). El hueco
            de la barra queda reservado para que los conteos no toquen el borde.
          -->
          <div ref="panelFiltros" data-scroll-filtros class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2 [scrollbar-gutter:stable]">
            <div
              v-if="errorFacetas"
              id="error-facetas"
              class="mt-3 flex items-center justify-between gap-2 rounded-card border border-danger/30 bg-danger-subtle px-3 py-2 text-xs text-neutral-dark"
              role="status"
            >
              <span>{{ errorFacetas }}</span>
              <button type="button" class="min-h-9 shrink-0 px-2 font-semibold text-action hover:text-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="reintentarFacetas">
                Reintentar
              </button>
            </div>
            <FiltroAcordeonPublico
              id="filtro-categorias"
              titulo="Categorías"
              :abierto="seccionAbierta === 'categorias'"
              :resumen="resumenCategorias"
              :seleccionados="categoriasSeleccionadas.length + subcategoriasSeleccionadas.length"
              @alternar="alternar('categorias')"
            >
              <OpcionFiltroPublico tipo="checkbox" nombre="Todos los productos" :seleccionado="!categoriasSeleccionadas.length && !subcategoriasSeleccionadas.length" @cambiar="seleccionarSubcategoria(undefined)" />
              <!--
                Jerarquía: categoría principal y, con sangría, «Toda la categoría» y sus subcategorías.
                Varias subcategorías o varias categorías completas (OR); ambos tipos no se mezclan
                porque la API los combina con AND.
              -->
              <div v-for="categoria in categorias" :key="categoria.id_categoria" class="pt-2">
                <p class="px-2 pb-1 pt-1 text-[11px] font-bold uppercase leading-4 tracking-wide text-corporate">{{ categoria.nombre }}</p>
                <div class="ml-2.5 space-y-0.5 border-l-2 border-neutral-light pl-1.5">
                  <OpcionFiltroPublico
                    tipo="checkbox"
                    nombre="Toda la categoría"
                    :cantidad="conteoCategoria(categoria.id_categoria)"
                    :seleccionado="categoriasSeleccionadas.includes(categoria.id_categoria)"
                    @cambiar="alternarCategoria(categoria.id_categoria)"
                  />
                  <OpcionFiltroPublico
                    v-for="item in categoria.subcategorias"
                    :key="item.id_subcategoria"
                    tipo="checkbox"
                    :nombre="item.nombre"
                    :cantidad="conteoSubcategoria(item.id_subcategoria)"
                    :seleccionado="subcategoriasSeleccionadas.includes(item.id_subcategoria)"
                    @cambiar="alternarSubcategoria(item.id_subcategoria)"
                  />
                </div>
              </div>
            </FiltroAcordeonPublico>

            <FiltroAcordeonPublico
              v-for="seccion in seccionesFaceta"
              :key="seccion.clave"
              :id="`filtro-${seccion.clave}`"
              :titulo="seccion.titulo"
              :abierto="seccionAbierta === seccion.clave"
              :resumen="resumenGrupo(seccion.grupo, seccion.seleccionados.value, seccion.todos)"
              :seleccionados="seccion.seleccionados.value.length"
              @alternar="alternar(seccion.clave)"
            >
              <p v-if="!seccion.valores.value.length" class="px-2 py-2 text-xs text-neutral-medium">Sin opciones para los filtros actuales.</p>
              <OpcionFiltroPublico
                v-for="valor in seccion.valores.value"
                :key="valor.id"
                tipo="checkbox"
                :nombre="valor.nombre"
                :cantidad="valor.cantidad"
                :seleccionado="seccion.seleccionados.value.includes(valor.id)"
                @cambiar="toggleFiltro(seccion.seleccionados, valor.id)"
              />
            </FiltroAcordeonPublico>

            <FiltroAcordeonPublico
              id="filtro-precio"
              titulo="Rango de precio"
              :abierto="seccionAbierta === 'precio'"
              :resumen="etiquetaPrecio ?? 'Cualquier precio'"
              :seleccionados="etiquetaPrecio ? 1 : 0"
              @alternar="alternar('precio')"
            >
              <form class="grid grid-cols-2 gap-2 px-2 pt-1" @submit.prevent="aplicarPrecio">
                <label class="min-w-0">
                  <span class="mb-1 block text-xs text-neutral-medium">Mínimo ($)</span>
                  <input v-model.number="inputPrecioMin" :aria-invalid="campoErrorPrecio === 'min' ? true : undefined" :aria-describedby="campoErrorPrecio === 'min' ? 'error-rango-precio' : undefined" type="number" min="0" inputmode="numeric" placeholder="0" class="h-10 w-full rounded-input border border-neutral-light bg-neutral-white px-2.5 text-sm outline-none placeholder:text-neutral-medium focus:border-action focus:ring-1 focus:ring-action" />
                </label>
                <label class="min-w-0">
                  <span class="mb-1 block text-xs text-neutral-medium">Máximo ($)</span>
                  <input v-model.number="inputPrecioMax" :aria-invalid="campoErrorPrecio === 'max' ? true : undefined" :aria-describedby="campoErrorPrecio === 'max' ? 'error-rango-precio' : undefined" type="number" min="0" inputmode="numeric" placeholder="Sin límite" class="h-10 w-full rounded-input border border-neutral-light bg-neutral-white px-2.5 text-sm outline-none placeholder:text-neutral-medium focus:border-action focus:ring-1 focus:ring-action" />
                </label>
                <p v-if="errorPrecio" id="error-rango-precio" class="col-span-2 text-xs font-medium text-danger" role="alert">{{ errorPrecio }}</p>
                <button type="submit" class="col-span-2 min-h-10 rounded-button border border-action text-xs font-semibold text-action transition-colors hover:bg-subaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action">
                  Aplicar precio
                </button>
              </form>
            </FiltroAcordeonPublico>
          </div>

          <div class="border-t border-neutral-light p-4 lg:hidden">
            <button
              type="button"
              class="min-h-11 w-full rounded-button bg-action px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              @click="filtrosMovilAbiertos = false"
            >
              <template v-if="actualizando">Actualizando…</template>
              <template v-else>Ver {{ total }} {{ total === 1 ? 'producto' : 'productos' }}</template>
            </button>
          </div>
        </aside>

        <!-- Resultados -->
        <div ref="zonaResultados" class="min-w-0 scroll-mt-28">
          <!-- Barra de resultados: único contador, filtros (móvil) y orden -->
          <div class="flex flex-wrap items-center gap-2 border-b border-neutral-light pb-3">
            <p class="mr-auto text-sm text-neutral-medium" aria-live="polite" data-contador-resultados>
              <template v-if="actualizando">Actualizando resultados…</template>
              <template v-else-if="total > 0">Mostrando <strong class="text-neutral-black">{{ rangoInicio }}–{{ rangoFin }}</strong> de <strong class="text-neutral-black">{{ total }}</strong> productos</template>
              <template v-else-if="!cargando">0 productos</template>
            </p>
            <button
              type="button"
              class="inline-flex min-h-10 items-center gap-2 rounded-button border border-action bg-neutral-white px-3 text-sm font-medium text-action transition-colors hover:bg-action hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action lg:hidden"
              aria-controls="panel-filtros"
              :aria-expanded="filtrosMovilAbiertos"
              @click="filtrosMovilAbiertos = true"
            >
              <SlidersHorizontal :size="16" /> Filtros
              <span v-if="chipsFiltros.length" class="grid h-5 min-w-5 place-items-center rounded-full bg-action px-1 text-[11px] font-semibold text-white">{{ chipsFiltros.length }}</span>
            </button>
            <label class="flex min-h-10 items-center gap-2 rounded-input border border-neutral-light bg-neutral-white px-3 text-sm text-neutral-medium focus-within:border-action focus-within:ring-1 focus-within:ring-action">
              <ArrowUpDown :size="15" class="shrink-0" aria-hidden="true" />
              <span class="hidden sm:inline">Ordenar por</span>
              <select
                :value="orden"
                aria-label="Ordenar productos"
                class="cursor-pointer bg-transparent font-medium text-neutral-dark outline-none"
                @change="cambiarOrden(($event.target as HTMLSelectElement).value as OrdenBusqueda)"
              >
                <option value="relevancia">Relevancia</option>
                <option value="precio_asc">Menor precio</option>
                <option value="precio_desc">Mayor precio</option>
                <option value="novedad">Novedades</option>
              </select>
            </label>
          </div>

          <!-- Filtros activos (chips removibles) -->
          <div v-if="chipsFiltros.length" class="flex flex-wrap items-center gap-2 pt-3" aria-label="Filtros activos">
            <button
              v-for="chip in chipsFiltros"
              :key="chip.clave"
              type="button"
              class="inline-flex max-w-full min-h-8 items-center gap-1.5 rounded-full border border-action/40 bg-subaction/50 px-3 text-xs font-medium text-corporate transition-colors hover:border-action hover:bg-subaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              :aria-label="`Quitar filtro ${chip.etiqueta}`"
              :title="chip.etiqueta"
              @click="chip.quitar()"
            >
              <span class="truncate">{{ chip.etiqueta }}</span>
              <X :size="13" class="shrink-0" aria-hidden="true" />
            </button>
            <button type="button" class="min-h-8 px-2 text-xs font-semibold text-action hover:text-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="limpiarFiltros">
              Limpiar todo
            </button>
          </div>

          <!-- Indicador discreto de actualización, solo en la zona de resultados -->
          <div class="relative h-0.5 overflow-hidden" aria-hidden="true">
            <div v-if="actualizando" class="absolute inset-0 animate-pulse bg-action motion-reduce:animate-none" />
          </div>

          <!--
            Tras la primera carga los resultados no se desmontan: mientras llega el nuevo
            filtro se atenúan y se bloquean (aria-busy) para no presentarlos como actuales.
          -->
          <div
            class="pt-5 transition-opacity duration-200 motion-reduce:transition-none"
            :class="actualizando ? 'pointer-events-none select-none opacity-40' : 'opacity-100'"
            :aria-busy="cargando"
            :inert="actualizando || undefined"
            data-resultados
          >
            <!-- 4 filas de 8 productos; cada fila es un carrusel manual (4 visibles en escritorio) -->
            <div v-if="cargando && !resultadosListos" class="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              <div v-for="n in 8" :key="n" class="h-96 animate-pulse rounded-card bg-neutral-white" />
            </div>
            <div v-else-if="error" class="rounded-card border border-neutral-light bg-neutral-white p-12 text-center">
              <CircleAlert :size="34" class="mx-auto text-danger" />
              <p class="mt-3 text-sm text-neutral-dark">{{ error }}</p>
              <button type="button" class="mt-5 min-h-11 rounded-button bg-action px-5 text-sm font-medium text-white hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="cargarInicio">
                Reintentar
              </button>
            </div>
            <div v-else-if="productos.length" class="space-y-6">
              <CarruselProductosPublico
                v-for="(fila, indiceFila) in filasProductos"
                :key="indiceFila"
                :elementos="fila"
                :etiqueta="etiquetaFila(indiceFila, fila.length)"
                :clave-de="(producto) => producto.id_producto"
                variante="catalogo"
              >
                <template #elemento="{ elemento: producto }">
                  <TarjetaProductoPublico
                    :producto="producto"
                    :muestra-color="muestrasCoincidentes.get(producto.id_producto) ?? null"
                    @ver="verProducto"
                    @agregar="agregarAlCarrito"
                  />
                </template>
              </CarruselProductosPublico>
            </div>
            <div v-else class="rounded-card border border-neutral-light bg-neutral-white p-12 text-center">
              <SearchX :size="36" class="mx-auto text-neutral-medium" />
              <h2 class="font-poppins mt-4 text-lg font-semibold text-corporate">No encontramos productos</h2>
              <p class="mt-2 text-sm text-neutral-medium">Prueba con otra búsqueda o limpia los filtros activos.</p>
              <div class="mt-5 flex flex-wrap justify-center gap-3">
                <button type="button" class="min-h-11 rounded-button border border-action bg-neutral-white px-5 text-sm font-medium text-action transition-colors hover:bg-action hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="limpiarFiltros">
                  Limpiar filtros
                </button>
              </div>
            </div>

            <PaginacionCatalogoPublico class="mt-8" :pagina="pagina" :total-paginas="totalPaginas" @cambiar="cambiarPagina" />
          </div>
        </div>
      </section>

      <!-- Sección complementaria -->
      <section v-if="categorias.length" class="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div class="relative overflow-hidden rounded-card bg-corporate bg-cover bg-center p-6 text-white sm:p-8" :style="fondoCompletaProyecto">
          <div class="absolute inset-0 bg-corporate/75" aria-hidden="true"></div>
          <div class="relative z-10">
            <h2 class="font-poppins text-xl font-semibold">Completa tu proyecto</h2>
            <p class="mt-1 text-sm text-white/75">Explora otras categorías disponibles.</p>
            <div class="mt-5 flex flex-wrap gap-3">
              <button
                v-for="categoria in categorias.slice(0, 5)"
                :key="categoria.id_categoria"
                type="button"
                class="min-h-11 rounded-button border border-neutral-white/40 px-4 text-sm font-medium transition-all hover:-translate-y-0.5 hover:bg-neutral-white hover:text-corporate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-white"
                @click="irACategoria(categoria.id_categoria)"
              >
                {{ categoria.nombre }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowUpDown,
  Calculator,
  ChevronRight,
  CircleAlert,
  Palette,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from 'lucide-vue-next';
import TarjetaProductoPublico from '../../components/publicas/TarjetaProductoPublico.vue';
import CarruselProductosPublico from '../../components/publicas/CarruselProductosPublico.vue';
import FiltroAcordeonPublico from '../../components/publicas/FiltroAcordeonPublico.vue';
import OpcionFiltroPublico from '../../components/publicas/OpcionFiltroPublico.vue';
import PaginacionCatalogoPublico from '../../components/publicas/PaginacionCatalogoPublico.vue';
import { PRODUCTOS_POR_FILA, useCatalogoPublico } from '../../composables/publicas/useCatalogoPublico';
import { rangoPrecioPublicoSchema } from '../../dtos/publicas/catalogo-publico.dto';
import { obtenerMuestraColorCoincidente } from '../../composables/publicas/useColorCoincidenteBusqueda';
import { seleccionarVarianteCompraRapida } from '../../services/publicas/seleccion-variante';
import { CatalogoPublicoService } from '../../services/publicas/catalogo-publico.service';
import { useCartStore } from '@/modules/m05-carrito-compras/store/cart.store';
import { formatearPrecio } from '@/core/utils/moneda';
import type { FacetaValorFrontend, OrdenBusqueda } from '@/modules/m02-busqueda/interfaces/busqueda.interface';
import fondoProyectoCalculadora from '../../assets/storefront/fondo-proyecto-calculadora.jpeg';

type ClaveSeccion = 'categorias' | 'marcas' | 'lineas' | 'resinas' | 'presentaciones' | 'precio';

interface ChipFiltro {
  clave: string;
  etiqueta: string;
  quitar: () => void;
}

const fondoCompletaProyecto = {
  backgroundImage: `url(${fondoProyectoCalculadora})`,
};
const router = useRouter();
const cartStore = useCartStore();
const filtrosMovilAbiertos = ref(false);
const mensaje = ref<string | null>(null);

const {
  buscar,
  cargando,
  resultadosListos,
  navegacionesExternas,
  cargarInicio,
  categorias,
  error,
  irPagina,
  limpiar,
  pagina,
  productos,
  seleccionarSubcategoria,
  seleccionarCategoria,
  alternarSubcategoria,
  alternarCategoria,
  subcategoriasSeleccionadas,
  categoriasSeleccionadas,
  termino,
  terminoAplicado,
  total,
  totalPaginas,
  limitePagina,
  facetas,
  errorFacetas,
  reintentarFacetas,
  marcasSeleccionadas,
  lineasSeleccionadas,
  resinasSeleccionadas,
  coloresSeleccionados,
  presentacionesSeleccionadas,
  precioMin,
  precioMax,
  rangoPrecioDescartado,
  orden,
  cambiarOrden,
  toggleFiltro,
  aplicarRangoPrecio,
} = useCatalogoPublico();

const inputPrecioMin = ref<number | undefined>(precioMin.value);
const inputPrecioMax = ref<number | undefined>(precioMax.value);
/** Rango inválido (mínimo > máximo): se informa junto a los campos y no se consulta (CA-BUS-02-06). */
const errorPrecio = ref<string | null>(null);
/** Campo que se marca como inválido junto al mensaje. */
const campoErrorPrecio = ref<'min' | 'max' | null>(null);
// El rango puede llegar por URL (recarga, enlace compartido): se refleja en los campos.
watch([precioMin, precioMax], ([min, max]) => {
  inputPrecioMin.value = min;
  inputPrecioMax.value = max;
  errorPrecio.value = null;
  campoErrorPrecio.value = null;
});
// Un enlace con el mínimo mayor que el máximo se ignora: se explica en lugar de fallar la carga.
watch(rangoPrecioDescartado, (descartado) => {
  if (descartado) mostrarMensaje('El rango de precio del enlace no era válido (mínimo mayor que máximo) y no se aplicó.');
}, { immediate: true });

/** Resultados atenuados mientras llega una consulta nueva (la primera usa esqueletos). */
const actualizando = computed(() => cargando.value && resultadosListos.value);

const panelFiltros = ref<HTMLElement | null>(null);
const zonaResultados = ref<HTMLElement | null>(null);

/**
 * Una sola sección abierta a la vez y todas cerradas al cargar; abrir o cerrar nunca
 * toca los filtros (los activos se ven en el resumen y el contador de cada sección).
 */
const seccionAbierta = ref<ClaveSeccion | null>(null);

async function alternar(clave: ClaveSeccion): Promise<void> {
  // Al cerrarse la sección anterior el contenido se acorta: se compensa el scroll del
  // panel para que la sección pulsada no salte de posición bajo el cursor.
  const encabezado = document.getElementById(`filtro-${clave}-encabezado`);
  const antes = encabezado?.getBoundingClientRect().top;
  seccionAbierta.value = seccionAbierta.value === clave ? null : clave;
  await nextTick();
  const panel = panelFiltros.value;
  if (antes === undefined || !encabezado || !panel) return;
  panel.scrollTop += encabezado.getBoundingClientRect().top - antes;
  // Si no había recorrido suficiente para compensar, al menos la sección queda a la vista.
  const caja = panel.getBoundingClientRect();
  const cab = encabezado.getBoundingClientRect();
  if (cab.top < caja.top || cab.bottom > caja.bottom) panel.scrollTop += cab.top - caja.top - 8;
}

/** Nombres ya vistos por grupo: un valor marcado sigue nombrado aunque salga de la faceta. */
const nombresConocidos = ref(new Map<string, string>());
watch(
  facetas,
  (f) => {
    const grupos: [string, FacetaValorFrontend[]][] = [
      ['marca', f.marcas], ['linea', f.lineas], ['resina', f.resinas], ['presentacion', f.presentaciones], ['color', f.colores],
    ];
    for (const [grupo, valores] of grupos) for (const v of valores) nombresConocidos.value.set(`${grupo}-${v.id}`, v.nombre);
  },
  { immediate: true }
);

function nombreValor(grupo: string, id: number, respaldo: string): string {
  return nombresConocidos.value.get(`${grupo}-${id}`) ?? `${respaldo} ${id}`;
}

/**
 * Valores de la faceta más los marcados que ya no tienen coincidencias con el resto de
 * filtros (cantidad 0): así siguen visibles y se pueden desmarcar desde el panel.
 */
function valoresConSeleccion(grupo: string, respaldo: string, valores: FacetaValorFrontend[], seleccion: number[]): FacetaValorFrontend[] {
  const faltantes = seleccion
    .filter((id) => !valores.some((v) => v.id === id))
    .map((id) => ({ id, nombre: nombreValor(grupo, id, respaldo), cantidad: 0 }));
  return [...valores, ...faltantes];
}

/** Texto del select cerrado: «Todas…», los nombres elegidos o «N seleccionadas». */
function resumenNombres(nombres: string[], todos: string): string {
  if (!nombres.length) return todos;
  return nombres.length <= 2 ? nombres.join(', ') : `${nombres.length} seleccionadas`;
}

function resumenGrupo(grupo: string, seleccion: number[], todos: string): string {
  return resumenNombres(seleccion.map((id) => nombreValor(grupo, id, '')), todos);
}

/** Secciones de faceta con datos reales de la API (sin listas estáticas). */
const seccionesFaceta: { clave: ClaveSeccion; grupo: string; titulo: string; todos: string; valores: Ref<FacetaValorFrontend[]>; seleccionados: Ref<number[]> }[] = [
  { clave: 'marcas', grupo: 'marca', titulo: 'Marcas', todos: 'Todas las marcas', valores: computed(() => valoresConSeleccion('marca', 'Marca', facetas.value.marcas, marcasSeleccionadas.value)), seleccionados: marcasSeleccionadas },
  { clave: 'lineas', grupo: 'linea', titulo: 'Línea comercial', todos: 'Todas las líneas', valores: computed(() => valoresConSeleccion('linea', 'Línea', facetas.value.lineas, lineasSeleccionadas.value)), seleccionados: lineasSeleccionadas },
  { clave: 'resinas', grupo: 'resina', titulo: 'Tipo de resina', todos: 'Todas las resinas', valores: computed(() => valoresConSeleccion('resina', 'Resina', facetas.value.resinas, resinasSeleccionadas.value)), seleccionados: resinasSeleccionadas },
  { clave: 'presentaciones', grupo: 'presentacion', titulo: 'Presentación', todos: 'Todas las presentaciones', valores: computed(() => valoresConSeleccion('presentacion', 'Presentación', facetas.value.presentaciones, presentacionesSeleccionadas.value)), seleccionados: presentacionesSeleccionadas },
];

/** Categorías completas y subcategorías elegidas, con los nombres de la API de categorías. */
const nombresCategorias = computed(() => {
  const mapa = { categorias: new Map<number, string>(), subcategorias: new Map<number, { nombre: string; categoria: string }>() };
  for (const c of categorias.value) {
    mapa.categorias.set(c.id_categoria, c.nombre);
    for (const s of c.subcategorias) mapa.subcategorias.set(s.id_subcategoria, { nombre: s.nombre, categoria: c.nombre });
  }
  return mapa;
});

const resumenCategorias = computed(() => {
  const { categorias: cats, subcategorias: subs } = nombresCategorias.value;
  if (subcategoriasSeleccionadas.value.length) {
    return resumenNombres(subcategoriasSeleccionadas.value.map((id) => subs.get(id)?.nombre ?? `Subcategoría ${id}`), 'Todos los productos');
  }
  return resumenNombres(categoriasSeleccionadas.value.map((id) => cats.get(id) ?? `Categoría ${id}`), 'Todos los productos');
});

const etiquetaPrecio = computed(() => {
  if (precioMin.value === undefined && precioMax.value === undefined) return null;
  const desde = precioMin.value !== undefined ? formatearPrecio(precioMin.value) : '$0';
  const hasta = precioMax.value !== undefined ? formatearPrecio(precioMax.value) : 'sin límite';
  return `${desde} – ${hasta}`;
});

function conteoCategoria(id: number): number | null {
  return facetas.value.categorias.find((c) => c.id === id)?.cantidad ?? null;
}

function conteoSubcategoria(id: number): number | null {
  return facetas.value.subcategorias.find((s) => s.id === id)?.cantidad ?? null;
}

/** HEX de la variante cuyo color coincide con la búsqueda aplicada (null = predeterminado de la tarjeta). */
/** La página se reparte en filas de 8; cada fila se muestra como un carrusel manual. */
const filasProductos = computed(() => {
  const filas: (typeof productos.value)[] = [];
  for (let inicio = 0; inicio < productos.value.length; inicio += PRODUCTOS_POR_FILA) {
    filas.push(productos.value.slice(inicio, inicio + PRODUCTOS_POR_FILA));
  }
  return filas;
});

const muestrasCoincidentes = computed(() => {
  const muestras = new Map<number, string | null>();
  for (const producto of productos.value) {
    muestras.set(
      producto.id_producto,
      obtenerMuestraColorCoincidente(producto.detalle?.variantes ?? [], terminoAplicado.value),
    );
  }
  return muestras;
});

const rangoInicio = computed(() => (total.value === 0 ? 0 : (pagina.value - 1) * limitePagina + 1));

/** Nombre accesible de cada fila con la numeración del catálogo completo (página 3: «Productos 65 a 72»). */
function etiquetaFila(indiceFila: number, cantidad: number): string {
  const primero = (pagina.value - 1) * limitePagina + indiceFila * PRODUCTOS_POR_FILA + 1;
  return `Productos ${primero} a ${primero + cantidad - 1}`;
}
const rangoFin = computed(() => Math.min(pagina.value * limitePagina, total.value));
/**
 * Encabezado y migas: con una sola categoría o subcategoría, como antes; con varias,
 * «Varias categorías/subcategorías» y la lista de nombres en el subtítulo.
 */
const seleccionActual = computed<{ categoria: string; subcategoria: string | null; descripcion?: string } | null>(() => {
  const { categorias: cats, subcategorias: subs } = nombresCategorias.value;
  const idsSub = subcategoriasSeleccionadas.value;
  const idsCat = categoriasSeleccionadas.value;
  if (idsSub.length === 1) {
    const sub = subs.get(idsSub[0]);
    return sub ? { categoria: sub.categoria, subcategoria: sub.nombre } : null;
  }
  if (idsSub.length > 1) {
    const nombres = idsSub.map((id) => subs.get(id)?.nombre).filter((n): n is string => !!n);
    return { categoria: 'Varias subcategorías', subcategoria: null, descripcion: `Productos de ${nombres.join(', ')}` };
  }
  if (idsCat.length === 1) {
    const nombre = cats.get(idsCat[0]);
    return nombre ? { categoria: nombre, subcategoria: null } : null;
  }
  if (idsCat.length > 1) {
    const nombres = idsCat.map((id) => cats.get(id)).filter((n): n is string => !!n);
    return { categoria: 'Varias categorías', subcategoria: null, descripcion: `Productos de ${nombres.join(', ')}` };
  }
  return null;
});

/**
 * Filtros activos como chips. Incluye el color si llega por URL (el panel ya no lo
 * muestra, pero sigue aplicándose y debe poder quitarse).
 */
const chipsFiltros = computed<ChipFiltro[]>(() => {
  const chips: ChipFiltro[] = [];
  if (terminoAplicado.value) {
    chips.push({ clave: 'q', etiqueta: `Búsqueda: «${terminoAplicado.value}»`, quitar: () => { termino.value = ''; buscar(); } });
  }
  const { categorias: cats, subcategorias: subs } = nombresCategorias.value;
  for (const id of categoriasSeleccionadas.value) {
    chips.push({ clave: `categoria-${id}`, etiqueta: `Categoría: ${cats.get(id) ?? id}`, quitar: () => alternarCategoria(id) });
  }
  for (const id of subcategoriasSeleccionadas.value) {
    chips.push({ clave: `subcategoria-${id}`, etiqueta: subs.get(id)?.nombre ?? `Subcategoría ${id}`, quitar: () => alternarSubcategoria(id) });
  }
  const grupos: [Ref<number[]>, string, string][] = [
    [marcasSeleccionadas, 'marca', 'Marca'],
    [lineasSeleccionadas, 'linea', 'Línea'],
    [resinasSeleccionadas, 'resina', 'Resina'],
    [presentacionesSeleccionadas, 'presentacion', 'Presentación'],
    [coloresSeleccionados, 'color', 'Color'],
  ];
  for (const [seleccion, clave, respaldo] of grupos) {
    for (const id of seleccion.value) {
      chips.push({ clave: `${clave}-${id}`, etiqueta: nombreValor(clave, id, respaldo), quitar: () => toggleFiltro(seleccion, id) });
    }
  }
  if (etiquetaPrecio.value) {
    chips.push({ clave: 'precio', etiqueta: `Precio: ${etiquetaPrecio.value}`, quitar: () => aplicarRangoPrecio(undefined, undefined) });
  }
  return chips;
});

function aplicarPrecio(): void {
  const rango = rangoPrecioPublicoSchema.safeParse({ min: inputPrecioMin.value, max: inputPrecioMax.value });
  if (!rango.success) {
    const issue = rango.error.issues[0];
    errorPrecio.value = issue?.message ?? 'Rango de precio no válido.';
    campoErrorPrecio.value = issue?.path[0] === 'max' ? 'max' : 'min';
    return;
  }
  errorPrecio.value = null;
  campoErrorPrecio.value = null;
  aplicarRangoPrecio(rango.data.min, rango.data.max);
}

function mostrarMensaje(texto: string): void {
  mensaje.value = texto;
}

async function agregarAlCarrito(idProducto: number): Promise<void> {
  const prod = productos.value.find((p) => p.id_producto === idProducto);
  let variante = seleccionarVarianteCompraRapida(prod?.detalle?.variantes ?? []);

  if (!variante) {
    try {
      const ficha = await CatalogoPublicoService.obtenerFicha(idProducto);
      variante = seleccionarVarianteCompraRapida(ficha.variantes);
    } catch {
      // ignore
    }
  }

  if (!variante) {
    mostrarMensaje('No hay variantes disponibles para este producto.');
    return;
  }

  await cartStore.addToCart({
    id: variante.id_variante,
    variantId: variante.id_variante,
    name: prod?.nombre ?? 'Producto',
    price: variante.precio_vigente,
    image: prod?.detalle?.imagenes[0]?.contenido_url ?? '',
  });

  if (cartStore.error) {
    mostrarMensaje(cartStore.error);
  } else {
    mostrarMensaje(`Se agregó "${prod?.nombre ?? 'el producto'}" al carrito.`);
  }
}

function limpiarFiltros(): void {
  orden.value = 'relevancia';
  limpiar();
}

/** Lleva la vista al inicio de los resultados solo si quedaron por encima de la pantalla. */
function mostrarResultados(): void {
  const zona = zonaResultados.value;
  if (!zona || zona.getBoundingClientRect().top >= 0) return;
  const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  zona.scrollIntoView({ block: 'start', behavior: reducido ? 'auto' : 'smooth' });
}

/**
 * El router no mueve la página cuando solo cambia la query del catálogo. Si el cambio
 * llega desde fuera (p. ej. el menú «Categorías» del header) es una búsqueda nueva y se
 * muestran los resultados desde arriba; con atrás/adelante se respeta la posición que
 * restaura el router.
 */
let navegacionPorHistorial = false;
let temporizadorHistorial: ReturnType<typeof setTimeout> | undefined;
function marcarHistorial(): void {
  // La marca solo vale para la navegación que dispara este popstate.
  navegacionPorHistorial = true;
  clearTimeout(temporizadorHistorial);
  temporizadorHistorial = setTimeout(() => { navegacionPorHistorial = false; }, 500);
}
onMounted(() => window.addEventListener('popstate', marcarHistorial));
onBeforeUnmount(() => {
  window.removeEventListener('popstate', marcarHistorial);
  clearTimeout(temporizadorHistorial);
});
watch(navegacionesExternas, () => {
  if (!navegacionPorHistorial) {
    mostrarResultados();
    return;
  }
  // Atrás/adelante: el router restaura la posición antes de que lleguen los resultados
  // (la página aún tiene el alto del filtro anterior); se repite al terminar la carga.
  const guardada = (window.history.state as { scroll?: { left: number; top: number } } | null)?.scroll;
  if (!guardada) return;
  const detener = watch(cargando, (cargandoAhora) => {
    if (cargandoAhora) return;
    detener();
    void nextTick(() => window.scrollTo(guardada.left, guardada.top));
  });
});

/** Cambiar de página (botones al pie de la lista) sí muestra la nueva página desde arriba. */
function cambiarPagina(nuevaPagina: number): void {
  irPagina(nuevaPagina);
  mostrarResultados();
}

/** «Completa tu proyecto» está bajo los resultados: tras elegir, se muestran desde arriba. */
function irACategoria(id: number): void {
  seleccionarCategoria(id);
  mostrarResultados();
}

function verProducto(id: number): void {
  void router.push({ name: 'DetalleProductoPublico', params: { productoId: id } });
}

function irCalculadora(): void {
  void router.push({ name: 'CalculadoraPinturaPublica', query: { volver: router.currentRoute.value.fullPath } });
}
</script>
