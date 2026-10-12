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
        <CircleAlert :size="36" class="mx-auto text-danger" />
        <h1 class="font-poppins mt-3 text-xl font-bold text-corporate">Producto no disponible</h1>
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
                  class="inline-flex items-center gap-1.5 rounded-button px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
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
                  class="inline-flex items-center gap-1.5 rounded-button px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer"
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
                <img v-if="imagenActiva && !imagenConError" :src="imagenActiva" :alt="producto.nombre" class="h-full w-full object-contain" @error="imagenConError = true" />
                <div v-else class="flex flex-col items-center justify-center text-neutral-medium">
                  <PackageOpen :size="54" class="text-neutral-light mb-2" aria-hidden="true" />
                  <span class="text-sm">Imagen no disponible</span>
                </div>
              </div>
              <div v-if="galeria.length > 1" class="mt-3 flex gap-3">
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
            <h1 class="font-poppins text-3xl font-extrabold leading-tight text-corporate">{{ producto.nombre }}</h1>
            <p class="font-poppins mt-2 text-2xl font-extrabold text-corporate">{{ precioActual }}</p>

            <div class="mt-5 rounded-card border border-neutral-light bg-neutral-white p-4">
              <button
                type="button"
                class="flex min-h-11 w-full items-center justify-between text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                :aria-expanded="descripcionAbierta"
                @click="descripcionAbierta = !descripcionAbierta"
              >
                <h2 class="font-poppins text-sm font-semibold text-corporate">Descripción</h2>
                <ChevronDown :size="17" class="text-neutral-medium transition-transform" :class="descripcionAbierta ? 'rotate-180' : ''" />
              </button>
              <p v-show="descripcionAbierta" class="mt-2 text-sm leading-6 text-neutral-medium">
                {{ producto.descripcion || 'Descripción no disponible.' }}
              </p>
            </div>

            <div v-if="todosLosColores.length" class="mt-5">
              <div class="flex items-center justify-between gap-3">
                <h2 class="font-poppins text-sm font-semibold text-corporate">Elige un color:</h2>
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
              <h2 class="font-poppins text-sm font-semibold text-corporate">Elige un tamaño:</h2>
              <div class="mt-2 grid grid-cols-2 gap-3">
                <button
                  v-for="variante in presentaciones"
                  :key="variante.id_presentacion"
                  type="button"
                  class="min-h-11 rounded-button border px-4 py-3 text-sm font-semibold transition-all active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action cursor-pointer"
                  :class="varianteSeleccionada?.id_presentacion === variante.id_presentacion
                    ? 'border-action bg-action text-white shadow-sm ring-2 ring-subaction'
                    : 'border-neutral-light bg-neutral-white text-neutral-dark hover:border-action hover:bg-subaction/30 hover:text-action'"
                  @click="seleccionarPresentacion(variante.id_presentacion)"
                >
                  {{ variante.presentacion }}
                </button>
              </div>

              <!-- Rendimiento dinámico según la presentación seleccionada (RF-CAT-10-04, M01-16) -->
              <div v-if="rendimientoEstimado" class="mt-3.5 rounded-card border border-neutral-light bg-neutral-lightest p-3 text-xs">
                <div class="flex items-center gap-2 font-semibold text-corporate">
                  <Sparkles :size="15" class="text-action shrink-0" />
                  <span>Rendimiento estimado: {{ rendimientoEstimado.min }} a {{ rendimientoEstimado.max }} m²</span>
                </div>
                <p class="mt-1 text-[11px] leading-4 text-neutral-medium">
                  Superficie que cubre 1 {{ rendimientoEstimado.presentacion }} a {{ MANOS_RECOMENDADAS }} manos. Puede variar según la porosidad y textura de la superficie.
                </p>
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
                  class="grid h-11 w-11 place-items-center transition-colors hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Aumentar cantidad"
                  :disabled="cantidad >= cantidadMaxima"
                  :title="cantidad >= cantidadMaxima ? `Máximo disponible: ${cantidadMaxima}` : undefined"
                  @click="cantidad = Math.min(cantidadMaxima, cantidad + 1)"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                class="inline-flex min-h-11 items-center justify-center gap-2 rounded-button bg-conversion text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-conversion-hover hover:shadow-md active:translate-y-0 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
                @click="agregarAlCarrito"
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

        <!-- Productos complementarios (HU-CAT-08): se oculta si el endpoint no devuelve ninguno -->
        <ProductosComplementariosPublicos
          class="mt-16"
          :productos="complementarios"
          @ver="irProducto"
          @agregar="agregarComplementarioAlCarrito"
        />
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

    <!-- Modales de Negocio (el menú de categorías vive en el encabezado de LayoutHome) -->
    <CartaColoresProductoPublica
      v-if="producto"
      :abierta="cartaColoresAbierta"
      :nombre-producto="producto.nombre"
      :variantes="producto.variantes"
      :variante-seleccionada-id="varianteSeleccionadaId"
      @cerrar="cartaColoresAbierta = false"
      @seleccionar="seleccionarDesdeCarta"
    />
    <CalculadoraPinturaPublica
      v-if="producto"
      :abierta="calculadoraAbierta"
      :producto="producto"
      :presentacion="presentacionCalculadora"
      @cerrar="calculadoraAbierta = false"
      @agregar="agregarDesdeCalculadora"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Calculator, ChevronDown, CircleAlert, MapPin, PackageOpen, Palette, ShoppingCart, Sparkles, X } from 'lucide-vue-next';
import { MuestraColor } from '@/core/components';
import CartaColoresProductoPublica from '../../components/publicas/CartaColoresProductoPublica.vue';
import CalculadoraPinturaPublica from '../../components/publicas/CalculadoraPinturaPublica.vue';
import ProductosComplementariosPublicos from '../../components/publicas/ProductosComplementariosPublicos.vue';
import VisualizadorAmbientesPublico from '../../components/publicas/VisualizadorAmbientesPublico.vue';
import { useDetalleProductoPublico } from '../../composables/publicas/useDetalleProductoPublico';
import { seleccionarVarianteCompraRapida } from '../../services/publicas/seleccion-variante';
import { LITROS_POR_GALON, MANOS_RECOMENDADAS, litrosDePresentacion } from '../../services/publicas/calculo-pintura';
import { CatalogoPublicoService } from '../../services/publicas/catalogo-publico.service';
import { useCartStore } from '@/modules/m05-carrito-compras/store/cart.store';
import { formatearCOP } from '@/core/utils/moneda';

const props = defineProps<{ productoId: string }>();
const router = useRouter();
const cartStore = useCartStore();
const route = useRoute();
const idProducto = computed(() => Number(props.productoId));
const {
  cargando,
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
const cartaColoresAbierta = ref(false);
const calculadoraAbierta = ref(false);
const descripcionAbierta = ref(true);
const mensaje = ref<string | null>(null);
const cantidad = ref(1);
/** Tope del carrito por línea (M05 rechaza más de 999) y existencias de la variante elegida. */
const CANTIDAD_MAXIMA_POR_LINEA = 999;
const cantidadMaxima = computed(() =>
  Math.max(1, Math.min(CANTIDAD_MAXIMA_POR_LINEA, varianteSeleccionada.value?.existencia_referencial ?? CANTIDAD_MAXIMA_POR_LINEA)),
);
// Al cambiar de presentación o color, la cantidad no puede quedar por encima del nuevo tope.
watch(cantidadMaxima, (maxima) => {
  if (cantidad.value > maxima) cantidad.value = maxima;
});
const indiceGaleria = ref(0);
const modoVista = ref<'ambientes' | 'envase'>('ambientes');

const esPintura = computed(() => {
  if (!producto.value) return false;
  if (!producto.value.rendimiento_min || !producto.value.rendimiento_max) return false;
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

const rendimientoEstimado = computed(() => {
  if (!esPintura.value || !producto.value?.rendimiento_min || !producto.value?.rendimiento_max) return null;
  // El rendimiento registrado es m² por galón y por mano (RF-CAT-10-02): se lleva a la
  // presentación elegida (RF-CAT-10-03) y se reparte entre las 2 manos que anuncia el texto,
  // igual que la calculadora.
  const factor = litrosDePresentacion(varianteSeleccionada.value?.volumen) / LITROS_POR_GALON / MANOS_RECOMENDADAS;
  const min = Math.round(producto.value.rendimiento_min * factor * 10) / 10;
  const max = Math.round(producto.value.rendimiento_max * factor * 10) / 10;
  return {
    min,
    max,
    presentacion: varianteSeleccionada.value?.presentacion ?? 'esta presentación',
  };
});

const imagenConError = ref(false);
const galeria = computed(() => producto.value?.imagenes.map((imagen) => imagen.contenido_url) ?? []);
const imagenActiva = computed(() => galeria.value[indiceGaleria.value] ?? galeria.value[0] ?? null);
watch(imagenActiva, () => {
  imagenConError.value = false;
});

const precioActual = computed(() =>
  varianteSeleccionada.value
    ? formatearCOP(varianteSeleccionada.value.precio_vigente)
    : 'Consultar precio'
);

function mostrarMensaje(texto: string): void {
  mensaje.value = texto;
}

async function agregarAlCarrito(): Promise<void> {
  if (!varianteSeleccionada.value) {
    mostrarMensaje('Por favor selecciona una variante del producto.');
    return;
  }
  await cartStore.addToCart(
    {
      id: varianteSeleccionada.value.id_variante,
      variantId: varianteSeleccionada.value.id_variante,
      name: producto.value?.nombre ?? 'Producto',
      price: varianteSeleccionada.value.precio_vigente,
      image: imagenActiva.value ?? '',
    },
    cantidad.value
  );
  if (cartStore.error) {
    mostrarMensaje(cartStore.error);
  } else {
    const nombre = producto.value?.nombre ?? 'el producto';
    mostrarMensaje(
      cantidad.value === 1
        ? `Se agregó "${nombre}" al carrito.`
        : `Se agregaron ${cantidad.value} unidades de "${nombre}" al carrito.`,
    );
  }
}

async function agregarComplementarioAlCarrito(idProd: number): Promise<void> {
  const prod = complementarios.value.find((p) => p.id_producto === idProd);
  let variante = seleccionarVarianteCompraRapida(prod?.detalle?.variantes ?? []);

  if (!variante) {
    try {
      const ficha = await CatalogoPublicoService.obtenerFicha(idProd);
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

/** Presentación elegida: la calculadora expresa su recomendación en estas unidades. */
const presentacionCalculadora = computed(() =>
  varianteSeleccionada.value
    ? { nombre: varianteSeleccionada.value.presentacion, volumen: varianteSeleccionada.value.volumen }
    : null,
);

/** La calculadora decide la cantidad (antes se agregaba la del selector, normalmente 1). */
async function agregarDesdeCalculadora(unidades: number): Promise<void> {
  calculadoraAbierta.value = false;
  const solicitadas = Math.max(1, Math.round(unidades));
  cantidad.value = Math.min(solicitadas, cantidadMaxima.value);
  await agregarAlCarrito();
  if (solicitadas > cantidadMaxima.value && !cartStore.error) {
    mostrarMensaje(`La calculadora recomienda ${solicitadas} unidades, pero solo hay ${cantidadMaxima.value} disponibles; se agregaron ${cantidadMaxima.value}.`);
  }
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

/**
 * «Anterior» vuelve al catálogo tal como se dejó (filtros, orden, página): si la entrada
 * previa del historial es el catálogo se retrocede; si se llegó de otra parte, se abre limpio.
 */
function volverCatalogo(): void {
  const anterior: unknown = window.history.state?.back;
  if (typeof anterior === 'string' && anterior.startsWith('/catalogo')) {
    router.back();
    return;
  }
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

function irCalculadora(): void {
  calculadoraAbierta.value = true;
}
</script>
