<template>
  <section class="space-y-5">
    <!-- Encabezado compacto (modal): título y producto en una línea, sin banner -->
    <header v-if="compacto" class="flex items-center gap-3 pr-12">
      <span class="grid h-11 w-11 shrink-0 place-items-center rounded-card bg-corporate text-white">
        <Calculator :size="22" />
      </span>
      <div class="min-w-0">
        <h1 class="font-poppins text-xl font-extrabold text-corporate sm:text-2xl">
          Calculadora de pintura
        </h1>
        <p v-if="producto" class="truncate text-sm text-neutral-medium">
          Para <strong class="font-semibold text-neutral-dark">{{ nombreProducto }}</strong>
          · {{ rendimiento.toFixed(1) }} m² por galón y mano
        </p>
      </div>
    </header>

    <!-- Encabezado -->
    <header
      v-else
      class="relative overflow-hidden rounded-card bg-corporate bg-cover bg-center p-5 text-white shadow-sm sm:p-7"
      :style="fondoDecorativoCalculadora"
    >
      <div
        class="absolute inset-0 bg-corporate/80"
        aria-hidden="true"
      />

      <div class="relative z-10 w-full">
        <div class="flex w-full items-start gap-4">
          <span
            class="grid h-12 w-12 shrink-0 place-items-center rounded-card bg-neutral-white/15 text-white"
          >
            <Calculator :size="24" />
          </span>

          <div>
            <p
              class="text-xs font-semibold uppercase tracking-wider text-subaction"
            >
              Herramienta de estimación
            </p>

            <h1
              class="font-poppins mt-1 text-2xl font-extrabold sm:text-3xl"
            >
              Calculadora de pintura
            </h1>

            <p class="mt-2 text-sm leading-6 text-neutral-white/85">
              Calcula aproximadamente cuánta pintura necesitas para tu proyecto.
            </p>
          </div>
        </div>

      </div>
    </header>

    <!-- En el modal la «X» ya cierra y vuelve a la ficha: no se repite el botón -->
    <div v-if="mostrarVolver && producto && !compacto" class="flex justify-end">
      <button
        type="button"
        class="inline-flex min-h-10 items-center justify-center rounded-button border border-action px-4 text-sm font-semibold text-action transition-colors hover:bg-subaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
        @click="emit('verProducto')"
      >
        Volver al producto
      </button>
    </div>

    <!-- Configuración; en el modal, el resultado ocupa la columna derecha para verse sin desplazarse -->
    <div
      class="grid gap-5"
      :class="compacto ? 'lg:grid-cols-[minmax(0,1fr)_320px]' : 'lg:grid-cols-[minmax(0,1fr)_310px]'"
    >
      <section
        class="rounded-card border border-neutral-light bg-neutral-white p-5 shadow-sm sm:p-6"
      >
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-wide text-action"
          >
            Configura tu proyecto
          </p>

          <h2
            class="font-poppins mt-1 text-xl font-bold text-corporate"
          >
            ¿Qué vas a pintar?
          </h2>

          <p class="mt-1 text-xs text-neutral-medium">
            Selecciona el tipo de superficie y agrega sus medidas.
          </p>
        </div>

        <!-- Superficies -->
        <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            v-for="opcion in superficies"
            :key="opcion.valor"
            type="button"
            class="relative flex min-h-20 flex-col items-center justify-center gap-2 rounded-card border px-3 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            :class="
              superficie === opcion.valor
                ? 'border-action bg-action text-white shadow-md ring-2 ring-action/20'
                : 'border-neutral-light bg-neutral-white text-neutral-dark hover:border-action hover:bg-subaction hover:text-corporate'
            "
            @click="seleccionarSuperficie(opcion.valor)"
          >
            <component
              :is="opcion.icono"
              :size="21"
            />

            <span>{{ opcion.etiqueta }}</span>

            <span
              v-if="superficie === opcion.valor"
              class="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-neutral-white text-action"
            >
              <Check :size="12" />
            </span>
          </button>
        </div>

        <!-- Medidas -->
        <div class="mt-7 border-t border-neutral-light pt-6">
          <div>
            <h3
              class="font-poppins text-base font-bold text-neutral-black"
            >
              Medidas de la superficie
            </h3>

            <p class="mt-1 text-xs text-neutral-medium">
              Ingresa las dimensiones en metros.
            </p>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <label class="text-xs font-semibold text-neutral-dark">
              Ancho <span class="font-normal text-neutral-medium">(metros)</span>

              <div class="relative mt-1">
                <input
                  v-model.number="ancho"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  :aria-invalid="errores.ancho ? true : undefined"
                  :aria-describedby="errores.ancho ? 'error-calculadora-ancho' : undefined"
                  class="h-12 w-full rounded-input border bg-neutral-white px-3 pr-10 text-sm font-medium outline-none transition-shadow focus:border-action focus:ring-2 focus:ring-action"
                  :class="errores.ancho ? 'border-danger' : 'border-neutral-light'"
                />

                <span
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-medium"
                >
                  m
                </span>
              </div>
              <p v-if="errores.ancho" id="error-calculadora-ancho" class="mt-1 text-xs font-medium text-danger" role="alert">
                {{ errores.ancho }}
              </p>
            </label>

            <label class="text-xs font-semibold text-neutral-dark">
              Alto <span class="font-normal text-neutral-medium">(metros)</span>

              <div class="relative mt-1">
                <input
                  v-model.number="alto"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  :aria-invalid="errores.alto ? true : undefined"
                  :aria-describedby="errores.alto ? 'error-calculadora-alto' : undefined"
                  class="h-12 w-full rounded-input border bg-neutral-white px-3 pr-10 text-sm font-medium outline-none transition-shadow focus:border-action focus:ring-2 focus:ring-action"
                  :class="errores.alto ? 'border-danger' : 'border-neutral-light'"
                />

                <span
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-medium"
                >
                  m
                </span>
              </div>
              <p v-if="errores.alto" id="error-calculadora-alto" class="mt-1 text-xs font-medium text-danger" role="alert">
                {{ errores.alto }}
              </p>
            </label>
          </div>

          <!-- Cantidad -->
          <div
            class="mt-5 flex flex-col gap-4 rounded-card bg-neutral-lightest p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p class="text-sm font-semibold text-neutral-dark">
                Cantidad de superficies
              </p>

              <p class="mt-1 text-xs text-neutral-medium">
                Ejemplo: si pintarás dos paredes iguales, selecciona 2.
              </p>
            </div>

            <div
              class="inline-flex min-h-11 shrink-0 items-center overflow-hidden rounded-button border border-neutral-light bg-neutral-white"
            >
              <button
                type="button"
                class="grid h-11 w-11 place-items-center text-lg text-neutral-dark transition-colors hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                aria-label="Reducir cantidad"
                @click="cantidad = Math.max(1, cantidad - 1)"
              >
                −
              </button>

              <span
                class="min-w-12 border-x border-neutral-light text-center text-sm font-bold text-corporate"
              >
                {{ cantidad }}
              </span>

              <button
                type="button"
                class="grid h-11 w-11 place-items-center text-lg text-neutral-dark transition-colors hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                aria-label="Aumentar cantidad"
                @click="cantidad = Math.min(50, cantidad + 1)"
              >
                +
              </button>
            </div>
          </div>

          <!-- Área calculada (en el modal se ve junto al resultado) -->
          <div
            v-if="!compacto"
            class="mt-4 flex items-center justify-between gap-4 rounded-card border border-action/20 bg-subaction px-4 py-3"
          >
            <div class="min-w-0">
              <p
                class="text-xs font-semibold uppercase tracking-wide text-corporate"
              >
                Área total
              </p>

              <p class="mt-0.5 text-xs text-neutral-medium">
                Se actualiza automáticamente al cambiar medidas o cantidad.
              </p>
            </div>

            <p
              class="font-poppins shrink-0 whitespace-nowrap text-2xl font-extrabold text-action"
            >
              {{ datosValidos ? `${area.toFixed(1)} m²` : '—' }}
            </p>
          </div>
        </div>
      </section>

      <!-- Producto (en el modal, su nombre y rendimiento van en el encabezado) -->
      <aside
        v-if="!compacto"
        class="h-fit rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm lg:sticky lg:top-24"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wide text-neutral-medium"
        >
          {{ producto ? 'Producto seleccionado' : 'Cálculo general' }}
        </p>

        <div v-if="producto" class="mt-3 text-center">
          <div
            class="mx-auto grid h-28 w-full place-items-center rounded-card bg-neutral-lightest p-3"
          >
            <img
              v-if="imagenProducto && !imagenConError"
              :src="imagenProducto"
              :alt="nombreProducto"
              class="h-24 w-24 object-contain"
              @error="imagenConError = true"
            />
            <span v-else class="text-xs text-neutral-medium">Imagen no disponible</span>
          </div>

          <h2
            class="font-poppins mx-auto mt-3 line-clamp-2 max-w-60 text-sm font-bold leading-5 text-corporate"
          >
            {{ nombreProducto }}
          </h2>

          <div
            class="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-lightest px-3 py-1.5 text-xs text-neutral-medium"
          >
            <Gauge :size="14" class="text-action" />

            <span>
              Rendimiento:
              <strong class="text-neutral-dark">
                {{ rendimiento.toFixed(1) }} m² por galón y mano
              </strong>
            </span>
          </div>
        </div>

        <p v-else class="mt-3 text-sm leading-6 text-neutral-dark">
          Estimación con un rendimiento de referencia de {{ rendimiento.toFixed(1) }} m² por galón y mano. Al elegir una pintura podrás calcular con el rendimiento de ese producto.
        </p>

        <button
          v-if="producto"
          type="button"
          class="mt-4 min-h-10 w-full rounded-button border border-action px-4 text-sm font-semibold text-action transition-all hover:bg-subaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          @click="emit('verProducto')"
        >
          Ver detalle del producto
        </button>
      </aside>

      <!-- Resultado -->
      <section
        class="overflow-hidden rounded-card border border-neutral-light bg-neutral-white shadow-sm"
        :class="compacto ? 'lg:sticky lg:top-0' : 'lg:col-span-2'"
      >
        <div class="text-center" :class="compacto ? 'px-5 py-5' : 'px-5 py-6 sm:px-8'">
          <div
            v-if="!compacto"
            class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-subaction text-action"
          >
            <PaintBucket :size="21" />
          </div>

          <p
            class="text-xs font-semibold uppercase tracking-wider text-neutral-medium"
            :class="{ 'mt-3': !compacto }"
          >
            Resultado estimado
          </p>

          <p
            v-if="!datosValidos"
            class="mx-auto mt-2 max-w-md text-sm font-semibold text-corporate"
            role="status"
          >
            Corrige las medidas de la superficie para ver cuánta pintura necesitas.
          </p>

          <template v-else>
          <h2
            class="font-poppins mt-1 text-lg font-bold text-corporate sm:text-xl"
          >
            Necesitas aproximadamente
          </h2>

          <!-- En la presentación elegida (p. ej. cuartos), o en galones si no hay presentación -->
          <div class="mt-1" data-testid="resultado-calculadora">
            <span
              class="font-poppins text-5xl font-extrabold text-action"
              :class="{ 'sm:text-6xl': !compacto }"
            >
              {{ resultadoEnPresentacion ? unidadesRecomendadas : galones }}
            </span>

            <span
              class="font-poppins font-bold text-action"
              :class="compacto ? 'mt-1 block text-lg leading-6' : 'ml-2 text-2xl sm:text-3xl'"
            >
              <template v-if="resultadoEnPresentacion">
                {{ unidadesRecomendadas === 1 ? 'unidad' : 'unidades' }} de {{ presentacion?.nombre }}
              </template>
              <template v-else>
                {{ galones === 1 ? 'galón' : 'galones' }}
              </template>
            </span>
          </div>

          <p class="mt-2 text-sm font-semibold text-corporate" data-testid="detalle-resultado">
            para {{ manos }} manos · aprox. {{ formatoLitros.format(litrosNecesarios) }} litros de pintura
          </p>

          <!-- Resumen -->
          <div
            class="mx-auto grid max-w-2xl divide-x divide-neutral-light rounded-card bg-neutral-lightest"
            :class="compacto ? 'mt-4 grid-cols-1' : 'mt-6 grid-cols-2'"
          >
            <div :class="compacto ? 'flex items-center justify-between gap-3 px-4 py-3' : 'p-4'">
              <p class="text-xs font-semibold text-neutral-medium">
                Área calculada
              </p>

              <p
                class="font-poppins text-lg font-extrabold text-corporate"
                :class="{ 'mt-1': !compacto }"
              >
                {{ area.toFixed(1) }} m²
              </p>
            </div>

            <!-- En el modal el rendimiento ya figura en el encabezado -->
            <div v-if="!compacto" class="p-4">
              <p class="text-xs font-semibold text-neutral-medium">
                Rendimiento por galón y mano
              </p>

              <p
                class="font-poppins mt-1 text-lg font-extrabold text-corporate"
              >
                {{ rendimiento.toFixed(1) }} m²/gal
              </p>
            </div>
          </div>
          </template>

          <p
            v-if="producto && datosValidos"
            class="mx-auto mt-5 max-w-sm text-sm text-neutral-dark"
            data-testid="unidades-recomendadas"
          >
            {{ unidadesAAgregar === 1 ? 'Se agregará' : 'Se agregarán' }}
            <strong class="text-corporate">{{ unidadesAAgregar }} {{ unidadesAAgregar === 1 ? 'unidad' : 'unidades' }}</strong>
            de {{ presentacion?.nombre ?? 'galón' }}.
          </p>
          <!-- Aviso antes de agregar: la recomendación supera las existencias de la presentación -->
          <p
            v-if="producto && datosValidos && recomendacionLimitada"
            class="mx-auto mt-2 max-w-sm rounded-card border border-highlight bg-highlight/10 px-3 py-2 text-xs leading-5 text-neutral-dark"
            role="status"
            data-testid="aviso-existencias"
          >
            Solo {{ unidadesAAgregar === 1 ? 'hay 1 unidad disponible' : `hay ${unidadesAAgregar} unidades disponibles` }}
            de {{ presentacion?.nombre ?? 'esta presentación' }}; la recomendación es de {{ unidadesRecomendadas }}.
            Puedes elegir otra presentación en la ficha.
          </p>

          <button
            v-if="producto"
            type="button"
            :disabled="!datosValidos"
            class="mx-auto mt-3 inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-button bg-conversion px-6 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-conversion-hover hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            @click="agregarRecomendacion"
          >
            <ShoppingCart :size="18" />
            Agregar al carrito
          </button>
          <button
            v-else
            type="button"
            class="mx-auto mt-6 inline-flex min-h-12 w-full max-w-sm items-center justify-center rounded-button bg-action px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-action-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            @click="emit('verProductos')"
          >
            Ver productos
          </button>
        </div>

        <!-- Nota -->
        <div
          class="flex gap-3 border-t border-neutral-light bg-neutral-lightest px-5 py-4 text-xs leading-5 text-neutral-medium sm:px-8"
        >
          <Lightbulb
            :size="17"
            class="mt-0.5 shrink-0 text-highlight"
          />

          <p>
            <strong class="text-neutral-dark">
              Ten en cuenta:
            </strong>
            esta es una estimación aproximada. El rendimiento real puede variar
            según la textura, porosidad, herramienta utilizada y color de la
            superficie.
          </p>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, watch } from 'vue';
import {
  Armchair,
  Calculator,
  Check,
  DoorOpen,
  Gauge,
  Lightbulb,
  PaintBucket,
  PanelsTopLeft,
  ShoppingCart,
  Square,
} from 'lucide-vue-next';

import {
  calculadoraPinturaSchema,
  type CalculadoraPinturaDTO,
  type ErroresCalculadoraPintura,
} from '../../dtos/publicas/calculadora-pintura.dto';
import {
  LITROS_POR_GALON,
  MANOS_RECOMENDADAS,
  esGalon,
  galonesNecesarios,
  unidadesParaGalones,
} from '../../services/publicas/calculo-pintura';

import type {
  FichaProductoPublico,
} from '../../interfaces/publicas/catalogo-publico.interface';

import fondoProyectoCalculadora
  from '../../assets/storefront/fondo-proyecto-calculadora.jpeg';

const fondoDecorativoCalculadora = {
  backgroundImage: `url(${fondoProyectoCalculadora})`,
};

const props = withDefaults(
  defineProps<{
    producto?: FichaProductoPublico | null;
    /** Presentación elegida en la ficha: define en qué unidades se agrega la recomendación. */
    presentacion?: { nombre: string; volumen: string | number | null } | null;
    /** Unidades que la ficha permite agregar de esa presentación (existencias); null = sin límite. */
    maximoUnidades?: number | null;
    mostrarVolver?: boolean;
    compacto?: boolean;
  }>(),
  {
    producto: null,
    presentacion: null,
    maximoUnidades: null,
    mostrarVolver: false,
    compacto: false,
  },
);

const emit = defineEmits<{
  /** Unidades de la presentación elegida que cubren la recomendación. */
  agregar: [unidades: number];
  verProducto: [];
  verProductos: [];
}>();

const superficie =
  ref<CalculadoraPinturaDTO['superficie']>('paredes');

const ancho = ref(5);
const alto = ref(2.5);
const cantidad = ref(2);

const manos = MANOS_RECOMENDADAS;

const superficies = [
  {
    valor: 'paredes' as const,
    etiqueta: 'Paredes',
    icono: markRaw(PanelsTopLeft),
  },
  {
    valor: 'techos' as const,
    etiqueta: 'Techos',
    icono: markRaw(Square),
  },
  {
    valor: 'puertas' as const,
    etiqueta: 'Puertas',
    icono: markRaw(DoorOpen),
  },
  {
    valor: 'muebles' as const,
    etiqueta: 'Muebles',
    icono: markRaw(Armchair),
  },
] as const;

const validacion = computed(() =>
  calculadoraPinturaSchema.safeParse({
    superficie: superficie.value,
    ancho: ancho.value,
    alto: alto.value,
    cantidad: cantidad.value,
  }),
);

const datosValidos = computed(() => validacion.value.success);

/** Se conserva el primer mensaje de Zod por campo para mostrarlo junto a la medida. */
const errores = computed<ErroresCalculadoraPintura>(() => {
  if (validacion.value.success) return {};
  const porCampo: ErroresCalculadoraPintura = {};
  for (const issue of validacion.value.error.issues) {
    const campo = issue.path[0] as keyof ErroresCalculadoraPintura;
    porCampo[campo] ??= issue.message;
  }
  return porCampo;
});

const area = computed(() =>
  validacion.value.success
    ? validacion.value.data.ancho * validacion.value.data.alto * validacion.value.data.cantidad
    : 0,
);

const rendimiento = computed(() => {
  const minimo = props.producto?.rendimiento_min;
  const maximo = props.producto?.rendimiento_max;

  return minimo !== null &&
    minimo !== undefined &&
    maximo !== null &&
    maximo !== undefined
    ? (minimo + maximo) / 2
    : 35;
});

// Sin medidas válidas no hay recomendación: el mínimo de 1 galón solo aplica a un área real.
/** Galones exactos (sin redondear): base de toda conversión. Sin medidas válidas no hay recomendación. */
const galonesExactos = computed(() =>
  datosValidos.value ? galonesNecesarios(area.value, rendimiento.value, manos) : 0,
);

/** Galones enteros a comprar si se compra por galón. */
const galones = computed(() => unidadesParaGalones(galonesExactos.value, LITROS_POR_GALON));

/** Litros que realmente se necesitan, como referencia para el cliente. */
const litrosNecesarios = computed(() => galonesExactos.value * LITROS_POR_GALON);

/**
 * Unidades de la presentación elegida (p. ej. cuartos de galón). Se calculan desde los galones
 * EXACTOS: convertir los galones ya redondeados casi duplicaba la compra.
 */
const unidadesRecomendadas = computed(() =>
  unidadesParaGalones(galonesExactos.value, props.presentacion?.volumen),
);

/** El resultado se expresa en la presentación elegida; sin presentación o si es el galón, en galones. */
const resultadoEnPresentacion = computed(() =>
  Boolean(props.presentacion) && !esGalon(props.presentacion?.volumen),
);

const formatoLitros = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/** Lo que realmente se agregará: la recomendación, limitada por las existencias de la presentación. */
const unidadesAAgregar = computed(() =>
  props.maximoUnidades == null ? unidadesRecomendadas.value : Math.min(unidadesRecomendadas.value, props.maximoUnidades),
);
const recomendacionLimitada = computed(() => unidadesAAgregar.value < unidadesRecomendadas.value);

function agregarRecomendacion(): void {
  if (!datosValidos.value || unidadesRecomendadas.value < 1) return;
  emit('agregar', unidadesRecomendadas.value);
}

const nombreProducto = computed(
  () =>
    props.producto?.nombre ??
    'Cálculo general',
);

const imagenConError = ref(false);
const imagenProducto = computed(() => {
  const imagenes = props.producto?.imagenes ?? [];
  return (imagenes.find((imagen) => imagen.es_principal) ?? imagenes[0])?.contenido_url ?? null;
});

watch(imagenProducto, () => { imagenConError.value = false; });

function seleccionarSuperficie(
  valor: CalculadoraPinturaDTO['superficie'],
): void {
  superficie.value = valor;
}
</script>
