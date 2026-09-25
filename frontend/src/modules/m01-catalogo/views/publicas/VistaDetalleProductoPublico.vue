<template>
  <div class="bg-neutral-lightest text-neutral-dark font-sans">
    <main class="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-button border border-action px-3 py-2 text-xs font-semibold text-action transition-colors hover:bg-subaction"
        @click="volverCatalogo"
      >
        <ArrowLeft :size="15" /> Anterior
      </button>

      <div v-if="cargando" class="mt-6 grid gap-8 lg:grid-cols-2">
        <div class="aspect-[4/3] animate-pulse rounded-card bg-neutral-white" />
        <div class="h-96 animate-pulse rounded-card bg-neutral-white" />
      </div>
      <div v-else-if="error || !producto" class="mt-6 rounded-card border border-neutral-light bg-neutral-white p-12 text-center shadow-sm">
        <CircleAlert :size="36" class="mx-auto text-highlight" />
        <h1 class="font-title mt-3 text-xl font-bold text-corporate">Producto no disponible</h1>
        <p class="mt-2 text-sm text-neutral-medium">{{ error }}</p>
        <router-link
          to="/catalogo"
          class="mt-5 inline-flex min-h-11 items-center rounded-button bg-action px-5 text-sm font-medium text-white shadow-sm transition-all hover:bg-action-hover hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        >
          Volver al catálogo
        </router-link>
      </div>

      <template v-else>
        <nav class="mt-5 text-xs text-neutral-medium" aria-label="Migas de pan">
          <router-link to="/" class="hover:text-action">Inicio</router-link> /
          <router-link to="/catalogo" class="hover:text-action">Productos</router-link> /
          <span class="text-neutral-dark">{{ producto.nombre }}</span>
        </nav>

        <section class="mt-4 grid items-start gap-6 rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm sm:p-5 lg:grid-cols-2">
          <div>
            <!-- Selector de Modo de Vista (solo para pinturas) -->
            <div v-if="esPintura" class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-light pb-3">
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                  :class="modoVista === 'ambientes'
                    ? 'bg-corporate text-white shadow-sm'
                    : 'bg-neutral-lightest text-neutral-dark hover:bg-neutral-light hover:text-corporate'"
                  @click="modoVista = 'ambientes'"
                >
                  <Palette :size="14" />
                  <span>Simular en Ambientes</span>
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                  :class="modoVista === 'envase'
                    ? 'bg-corporate text-white shadow-sm'
                    : 'bg-neutral-lightest text-neutral-dark hover:bg-neutral-light hover:text-corporate'"
                  @click="modoVista = 'envase'"
                >
                  <PackageOpen :size="14" />
                  <span>Ver Envase</span>
                </button>
              </div>

              <span v-if="modoVista === 'ambientes'" class="flex items-center gap-1 text-[11px] font-medium text-action">
                <Sparkles :size="13" /> 5 ambientes interactivos
              </span>
            </div>

            <!-- Vista 1: Visualizador de Ambientes Interactivos con Cambio de Color -->
            <VisualizadorAmbientesPublico
              v-if="esPintura && modoVista === 'ambientes'"
              :color-hex="varianteSeleccionada?.muestra_hex"
              :color-nombre="varianteSeleccionada?.color"
              :color-codigo="varianteSeleccionada?.codigo_color"
            />

            <!-- Vista 2: Galería Estándar de Envase / Producto -->
            <div v-else>
              <div class="grid aspect-[4/3] place-items-center overflow-hidden rounded-card bg-neutral-lightest p-5">
                <img :src="imagenActiva" :alt="producto.nombre" class="h-full w-full object-contain" />
              </div>
              <div class="mt-3 flex gap-3">
                <button
                  v-for="(imagen, indice) in galeria"
                  :key="imagen"
                  type="button"
                  class="h-16 w-20 overflow-hidden rounded-button border bg-neutral-lightest p-1 transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action cursor-pointer"
                  :class="indiceGaleria === indice ? 'border-action' : 'border-neutral-light'"
                  @click="indiceGaleria = indice"
                >
                  <img :src="imagen" alt="" class="h-full w-full object-contain" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h1 class="font-title text-3xl font-extrabold leading-tight text-corporate">{{ producto.nombre }}</h1>
            <p class="font-title mt-2 text-2xl font-extrabold text-corporate">{{ precioActual }}</p>

            <div class="mt-5 rounded-card border border-neutral-light bg-neutral-white p-4">
              <button
                type="button"
                class="flex min-h-11 w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                :aria-expanded="descripcionAbierta"
                @click="descripcionAbierta = !descripcionAbierta"
              >
                <h2 class="font-title text-sm font-semibold text-corporate">Descripción</h2>
                <ChevronDown :size="17" class="text-neutral-medium transition-transform" :class="descripcionAbierta ? 'rotate-180' : ''" />
              </button>
              <p v-show="descripcionAbierta" class="mt-2 text-sm leading-6 text-neutral-medium">
                {{ producto.descripcion || 'Producto de calidad para completar tu proyecto.' }}
              </p>
            </div>

            <div v-if="todosLosColores.length" class="mt-5">
              <div class="flex items-center justify-between gap-3">
                <h2 class="font-title text-sm font-semibold text-corporate">Elige un color:</h2>
                <button
                  type="button"
                  class="inline-flex min-h-9 items-center gap-1.5 rounded-button px-2.5 text-xs font-medium text-action transition-colors hover:bg-subaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  @click="cartaColoresAbierta = true"
                >
                  <Palette :size="15" /> Ver carta de colores
                </button>
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-3">
                <button
                  v-for="variante in colores"
                  :key="variante.id_color ?? variante.id_variante"
                  type="button"
                  class="grid h-11 w-11 place-items-center rounded-full border-2 bg-neutral-white transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action cursor-pointer"
                  :class="varianteSeleccionada?.id_color === variante.id_color ? 'border-action ring-2 ring-subaction' : 'border-neutral-light'"
                  :aria-label="`Seleccionar color ${variante.color}`"
                  :title="variante.color ?? ''"
                  @click="seleccionarColor(variante.id_color ?? variante.id_variante)"
                >
                  <MuestraColor :hex="variante.muestra_hex" :nombre="variante.color" tamano="md" />
                </button>

                <button
                  v-if="todosLosColores.length > MAX_COLORES_PREVIA"
                  type="button"
                  class="inline-flex h-9 items-center justify-center rounded-full border border-action/40 bg-neutral-white px-3 text-xs font-semibold text-action transition-all hover:border-action hover:bg-subaction hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  title="Ver todos los colores en la carta"
                  @click="cartaColoresAbierta = true"
                >
                  +{{ todosLosColores.length - MAX_COLORES_PREVIA }} más
                </button>
              </div>
              <p class="mt-2 text-xs font-medium text-neutral-medium">
                Seleccionado: <span class="font-semibold text-corporate">{{ varianteSeleccionada?.color }}</span>
              </p>
            </div>

            <div class="mt-5">
              <h2 class="font-title text-sm font-semibold text-corporate">Elige un tamaño:</h2>
              <div class="mt-2 grid grid-cols-2 gap-3">
                <button
                  v-for="variante in presentaciones"
                  :key="variante.id_presentacion"
                  type="button"
                  class="min-h-11 rounded-button border px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:bg-action hover:text-white hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  :class="varianteSeleccionada?.id_presentacion === variante.id_presentacion ? 'border-2 border-action bg-neutral-white text-action shadow-sm ring-1 ring-subaction' : 'border-neutral-light bg-neutral-white text-neutral-dark hover:border-action'"
                  @click="seleccionarPresentacion(variante.id_presentacion)"
                >
                  {{ variante.presentacion }}
                </button>
              </div>
            </div>

            <button
              v-if="esPintura"
              type="button"
              class="mt-5 flex min-h-11 w-full items-center justify-between rounded-button border border-neutral-light bg-neutral-white px-4 py-3 text-sm font-medium text-corporate transition-all hover:-translate-y-0.5 hover:border-action hover:bg-subaction hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
              @click="irCalculadora"
            >
              <span>Calcular cuánta pintura necesitas</span>
              <Calculator :size="17" />
            </button>

            <div class="mt-5 grid grid-cols-[auto_1fr] gap-3">
              <div class="flex min-h-11 items-center rounded-button border border-neutral-light bg-neutral-white">
                <button
                  type="button"
                  class="grid h-11 w-11 place-items-center transition-colors hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  aria-label="Reducir cantidad"
                  @click="cantidad = Math.max(1, cantidad - 1)"
                >
                  −
                </button>
                <span class="min-w-8 text-center text-sm font-semibold">{{ cantidad }}</span>
                <button
                  type="button"
                  class="grid h-11 w-11 place-items-center transition-colors hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  aria-label="Aumentar cantidad"
                  @click="cantidad += 1"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-button bg-conversion text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-conversion-hover hover:shadow-md active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
                @click="mostrarMensaje('Agregar al carrito requiere la integración con M07.')"
              >
                <ShoppingCart :size="17" /> Comprar
              </button>
            </div>
            <p class="mt-5 flex items-center gap-2 text-xs font-semibold text-conversion-hover">
              <MapPin :size="14" /> Retiro hoy en tienda
            </p>
            <p class="mt-2 text-[11px] leading-5 text-neutral-medium">
              *Los colores mostrados son referenciales y pueden variar según tu pantalla.
            </p>
          </div>
        </section>

        <!-- Productos complementarios -->
        <section v-if="complementarios.length" class="mt-16">
          <h2 class="font-title text-xl font-bold text-corporate">Productos que te pueden interesar</h2>
          <div class="mt-5 grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <TarjetaProductoPublico
              v-for="item in complementarios"
              :key="item.id_producto"
              :producto="item"
              @ver="irProducto"
              @agregar="mostrarMensaje('Agregar al carrito requiere M07.')"
            />
          </div>
        </section>
      </template>

      <!-- Feedback de mensaje -->
      <div
        v-if="mensaje"
        class="fixed bottom-5 left-1/2 z-40 flex w-[min(92%,520px)] -translate-x-1/2 justify-between rounded-card bg-subaction px-4 py-3 text-sm text-corporate shadow-lg"
        role="status"
      >
        <span>{{ mensaje }}</span>
        <button type="button" aria-label="Cerrar" @click="mensaje = null">
          <X :size="16" />
        </button>
      </div>
    </main>

    <!-- Modales de Negocio -->
    <MenuCategoriasPublico
      :abierto="menuCategoriasAbierto"
      :cargando="cargando"
      :categorias="categorias"
      @cerrar="menuCategoriasAbierto = false"
      @seleccionar="irSubcategoria"
    />
    <CartaColoresProductoPublica
      v-if="producto"
      :abierta="cartaColoresAbierta"
      :nombre-producto="producto.nombre"
      :variantes="producto.variantes"
      :variante-seleccionada-id="varianteSeleccionadaId"
      @cerrar="cartaColoresAbierta = false"
      @seleccionar="seleccionarDesdeCarta"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Calculator, ChevronDown, CircleAlert, MapPin, PackageOpen, Palette, ShoppingCart, Sparkles, X } from 'lucide-vue-next';
import { MuestraColor } from '@/core/components';
import { GALERIA_PRODUCTO_DEMO, obtenerImagenPublicaRespaldo } from '../../assets/imagenes-catalogo';
import CartaColoresProductoPublica from '../../components/publicas/CartaColoresProductoPublica.vue';
import MenuCategoriasPublico from '../../components/publicas/MenuCategoriasPublico.vue';
import VisualizadorAmbientesPublico from '../../components/publicas/VisualizadorAmbientesPublico.vue';
import { useDetalleProductoPublico } from '../../composables/publicas/useDetalleProductoPublico';
import { formatearCOP } from '@/core/utils/moneda';

const props = defineProps<{ productoId: string }>();
const router = useRouter();
const route = useRoute();
const idProducto = computed(() => Number(props.productoId));
const {
  cargando,
  categorias,
  complementarios,
  error,
  producto,
  varianteSeleccionada,
  varianteSeleccionadaId,
} = useDetalleProductoPublico(toRef(idProducto));

watch(
  () => [producto.value, route.query.color] as const,
  ([prod, colorParam]) => {
    if (!prod || !colorParam) return;
    const idColor = Number(colorParam);
    if (!idColor) return;
    const coincidencia = prod.variantes.find((v) => v.id_color === idColor);
    if (coincidencia) {
      varianteSeleccionadaId.value = coincidencia.id_variante;
      const idx = prod.imagenes.findIndex((img) => img.id_color === idColor);
      if (idx >= 0) indiceGaleria.value = idx;
    }
  },
  { immediate: true }
);
const menuCategoriasAbierto = ref(false);
const cartaColoresAbierta = ref(false);
const descripcionAbierta = ref(true);
const mensaje = ref<string | null>(null);
const cantidad = ref(1);
const indiceGaleria = ref(0);
const modoVista = ref<'ambientes' | 'envase'>('ambientes');

const esPintura = computed(() => {
  if (!producto.value) return false;
  // En Pintu Clic (RF-CAT-02-02, HU-CAT-10), las herramientas y accesorios tienen clase 'sin_color'
  if (producto.value.clase_color === 'sin_color') return false;
  const texto = `${producto.value.nombre} ${producto.value.descripcion ?? ''}`.toLowerCase();
  if (/(taladro|rodillo|brocha|cinta|espátula|bandeja|herramienta|accesorio)/i.test(texto)) {
    return false;
  }
  return true;
});

const MAX_COLORES_PREVIA = 6;

const todosLosColores = computed(() => {
  const unicos = new Map<number, NonNullable<typeof producto.value>['variantes'][number]>();
  for (const item of producto.value?.variantes ?? []) {
    if (item.id_color !== null && item.color && !unicos.has(item.id_color)) {
      unicos.set(item.id_color, item);
    }
  }
  return Array.from(unicos.values());
});

const colores = computed(() => {
  const lista = todosLosColores.value;
  if (lista.length <= MAX_COLORES_PREVIA) {
    return lista;
  }
  const previa = lista.slice(0, MAX_COLORES_PREVIA);
  const seleccionada = varianteSeleccionada.value;
  if (seleccionada?.id_color && !previa.some((c) => c.id_color === seleccionada.id_color)) {
    return [...previa.slice(0, MAX_COLORES_PREVIA - 1), seleccionada];
  }
  return previa;
});
const presentaciones = computed(() => {
  const unicas = new Map<number, NonNullable<typeof producto.value>['variantes'][number]>();
  for (const variante of producto.value?.variantes ?? []) {
    if (!unicas.has(variante.id_presentacion)) unicas.set(variante.id_presentacion, variante);
  }
  return Array.from(unicas.values());
});

const galeria = computed(() => {
  const remotas = producto.value?.imagenes.map((imagen) => imagen.contenido_url) ?? [];
  if (remotas.length) return remotas;
  if (producto.value?.clase_color === 'sin_color') {
    return [obtenerImagenPublicaRespaldo(idProducto.value), GALERIA_PRODUCTO_DEMO.lateral, GALERIA_PRODUCTO_DEMO.ambiente];
  }
  return [GALERIA_PRODUCTO_DEMO.ambiente, obtenerImagenPublicaRespaldo(idProducto.value), GALERIA_PRODUCTO_DEMO.lateral];
});

const imagenActiva = computed(() => galeria.value[indiceGaleria.value] ?? obtenerImagenPublicaRespaldo(idProducto.value));

const precioActual = computed(() =>
  varianteSeleccionada.value
    ? formatearCOP(varianteSeleccionada.value.precio_vigente)
    : 'Consultar precio'
);

function mostrarMensaje(texto: string): void {
  mensaje.value = texto;
}

function seleccionarPresentacion(idPresentacion: number): void {
  const colorActual = varianteSeleccionada.value?.id_color ?? null;
  const opciones = producto.value?.variantes.filter((item) => item.id_presentacion === idPresentacion) ?? [];
  varianteSeleccionadaId.value = (opciones.find((item) => item.id_color === colorActual) ?? opciones[0])?.id_variante ?? null;
}

function seleccionarColor(idColor: number): void {
  const presentacionActual = varianteSeleccionada.value?.id_presentacion;
  const opciones = producto.value?.variantes.filter((item) => item.id_color === idColor) ?? [];
  const coincidencia = opciones.find((item) => item.id_presentacion === presentacionActual) ?? opciones[0];
  if (coincidencia) {
    varianteSeleccionadaId.value = coincidencia.id_variante;
    const indiceImagen = producto.value?.imagenes.findIndex((imagen) => imagen.id_color === idColor) ?? -1;
    if (indiceImagen >= 0) indiceGaleria.value = indiceImagen;
  }
}

function seleccionarDesdeCarta(idVariante: number): void {
  varianteSeleccionadaId.value = idVariante;
  const variante = producto.value?.variantes.find(
    (item) => item.id_variante === idVariante
  );

  if (variante?.id_color) {
    const indiceImagen =
      producto.value?.imagenes.findIndex(
        (imagen) => imagen.id_color === variante.id_color
      ) ?? -1;

    if (indiceImagen >= 0) indiceGaleria.value = indiceImagen;
  }
}

function volverCatalogo(): void {
  console.log('VOLVER CATALOGO EJECUTADO');
  void router.push({ name: 'CatalogoPublico' });
}

function irProducto(id: number): void {
  indiceGaleria.value = 0;
  cantidad.value = 1;
  void router.push({
    name: 'DetalleProductoPublico',
    params: { productoId: id },
  });
}

function irSubcategoria(id: number): void {
  menuCategoriasAbierto.value = false;
  void router.push({
    name: 'CatalogoPublico',
    query: { subcategoria: id },
  });
}

function irCalculadora(): void {
  void router.push({
    name: 'CalculadoraPinturaProductoPublica',
    params: { productoId: props.productoId },
  });
}
</script>