<template>
  <section class="space-y-5">
    <!-- Encabezado -->
    <header
      class="relative overflow-hidden rounded-2xl bg-corporate bg-cover bg-center p-5 text-white shadow-sm sm:p-7"
      :style="fondoDecorativoCalculadora"
    >
      <div
        class="absolute inset-0 bg-corporate/80"
        aria-hidden="true"
      />

      <div
        class="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
      >
        <div class="flex items-start gap-4">
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
              class="font-title mt-1 text-2xl font-extrabold sm:text-3xl"
            >
              Calculadora de pintura
            </h1>

            <p
              class="mt-2 max-w-2xl text-sm leading-6 text-neutral-white/85"
            >
              Calcula aproximadamente cuánta pintura necesitas para tu proyecto.
            </p>
          </div>
        </div>

        <button
          v-if="mostrarVolver && producto"
          type="button"
          class="inline-flex min-h-10 shrink-0 items-center justify-center rounded-button border border-neutral-white/40 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          @click="emit('verProducto')"
        >
          Volver al producto
        </button>
      </div>
    </header>

    <!-- Configuración -->
    <div class="grid gap-5 lg:grid-cols-[1fr_310px]">
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
            class="font-title mt-1 text-xl font-bold text-corporate"
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
              class="font-title text-base font-bold text-neutral-black"
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
                  class="h-12 w-full rounded-input border border-neutral-light bg-neutral-white px-3 pr-10 text-sm font-medium outline-none transition-shadow focus:border-action focus:ring-2 focus:ring-action"
                />

                <span
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-medium"
                >
                  m
                </span>
              </div>
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
                  class="h-12 w-full rounded-input border border-neutral-light bg-neutral-white px-3 pr-10 text-sm font-medium outline-none transition-shadow focus:border-action focus:ring-2 focus:ring-action"
                />

                <span
                  class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-medium"
                >
                  m
                </span>
              </div>
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

          <!-- Área calculada -->
          <div
            class="mt-4 flex items-center justify-between gap-4 rounded-card border border-action/20 bg-subaction px-4 py-3"
          >
            <div>
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
              class="font-title text-2xl font-extrabold text-action"
            >
              {{ area.toFixed(1) }} m²
            </p>
          </div>
        </div>
      </section>

      <!-- Producto -->
      <aside
        class="h-fit rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm lg:sticky lg:top-24"
      >
        <p
          class="text-xs font-semibold uppercase tracking-wide text-neutral-medium"
        >
          Producto seleccionado
        </p>

        <div class="mt-3 text-center">
          <div
            class="mx-auto grid h-28 w-full place-items-center rounded-card bg-neutral-lightest p-3"
          >
            <img
              :src="imagenProducto"
              :alt="nombreProducto"
              class="h-24 w-24 object-contain"
            />
          </div>

          <h2
            class="font-title mx-auto mt-3 line-clamp-2 max-w-60 text-sm font-bold leading-5 text-corporate"
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
                {{ rendimiento.toFixed(1) }} m²/gal
              </strong>
            </span>
          </div>
        </div>

        <button
          v-if="producto"
          type="button"
          class="mt-4 min-h-10 w-full rounded-button border border-action px-4 text-sm font-semibold text-action transition-all hover:bg-subaction focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          @click="emit('verProducto')"
        >
          Ver detalle del producto
        </button>
      </aside>
    </div>

    <!-- Resultado -->
    <section
      class="overflow-hidden rounded-card border border-neutral-light bg-neutral-white shadow-sm"
    >
      <div class="px-5 py-6 text-center sm:px-8">
        <div
          class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-subaction text-action"
        >
          <PaintBucket :size="21" />
        </div>

        <p
          class="mt-3 text-xs font-semibold uppercase tracking-wider text-neutral-medium"
        >
          Resultado estimado
        </p>

        <h2
          class="font-title mt-1 text-lg font-bold text-corporate sm:text-xl"
        >
          Necesitas aproximadamente
        </h2>

        <div class="mt-1">
          <span
            class="font-title text-5xl font-extrabold text-action sm:text-6xl"
          >
            {{ galones }}
          </span>

          <span
            class="font-title ml-2 text-2xl font-bold text-action sm:text-3xl"
          >
            {{ galones === 1 ? 'galón' : 'galones' }}
          </span>
        </div>

        <p class="mt-2 text-sm font-semibold text-corporate">
          para {{ manos }} manos
        </p>

        <!-- Resumen -->
        <div
          class="mx-auto mt-6 grid max-w-2xl grid-cols-2 divide-x divide-neutral-light rounded-card bg-neutral-lightest"
        >
          <div class="p-4">
            <p class="text-xs font-semibold text-neutral-medium">
              Área calculada
            </p>

            <p
              class="font-title mt-1 text-lg font-extrabold text-corporate"
            >
              {{ area.toFixed(1) }} m²
            </p>
          </div>

          <div class="p-4">
            <p class="text-xs font-semibold text-neutral-medium">
              Rendimiento
            </p>

            <p
              class="font-title mt-1 text-lg font-extrabold text-corporate"
            >
              {{ rendimiento.toFixed(1) }} m²/gal
            </p>
          </div>
        </div>

        <button
          type="button"
          class="mx-auto mt-6 inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-button bg-conversion px-6 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-conversion-hover hover:shadow-md active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
          @click="emit('agregar')"
        >
          <ShoppingCart :size="18" />
          Agregar al carrito
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
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, ref } from 'vue';
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
} from '../../dtos/publicas/calculadora-pintura.dto';

import type {
  FichaProductoPublico,
} from '../../interfaces/publicas/catalogo-publico.interface';

import {
  obtenerImagenPublicaRespaldo,
} from '../../assets/imagenes-catalogo';

import fondoProyectoCalculadora
  from '../../assets/storefront/fondo-proyecto-calculadora.jpeg';

const fondoDecorativoCalculadora = {
  backgroundImage: `url(${fondoProyectoCalculadora})`,
};

const props = withDefaults(
  defineProps<{
    producto?: FichaProductoPublico | null;
    mostrarVolver?: boolean;
  }>(),
  {
    producto: null,
    mostrarVolver: false,
  },
);

const emit = defineEmits<{
  agregar: [];
  verProducto: [];
}>();

const superficie =
  ref<CalculadoraPinturaDTO['superficie']>('paredes');

const ancho = ref(5);
const alto = ref(2.5);
const cantidad = ref(2);

const manos = 2;

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

const datosValidos = computed(() =>
  calculadoraPinturaSchema.safeParse({
    superficie: superficie.value,
    ancho: ancho.value,
    alto: alto.value,
    cantidad: cantidad.value,
  }).success,
);

const area = computed(() =>
  datosValidos.value
    ? ancho.value * alto.value * cantidad.value
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

const galones = computed(() =>
  Math.max(
    1,
    Math.ceil(
      (area.value * manos) / rendimiento.value,
    ),
  ),
);

const nombreProducto = computed(
  () =>
    props.producto?.nombre ??
    'Pintura recomendada Pintu Clic',
);

const imagenProducto = computed(() =>
  obtenerImagenPublicaRespaldo(
    props.producto?.id_producto ?? 1,
  ),
);

function seleccionarSuperficie(
  valor: CalculadoraPinturaDTO['superficie'],
): void {
  superficie.value = valor;
}
</script>