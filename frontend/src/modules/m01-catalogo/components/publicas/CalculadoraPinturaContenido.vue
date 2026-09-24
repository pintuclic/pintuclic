<template>
  <section class="space-y-6">
    <header class="relative overflow-hidden rounded-2xl bg-corporate bg-cover bg-center p-5 text-white shadow-sm sm:p-6" :style="fondoDecorativoCalculadora">
      <div class="absolute inset-0 bg-corporate/75" aria-hidden="true"></div>
      <div class="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div class="flex items-start gap-3">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-card bg-neutral-white/15 text-white">
            <Calculator :size="22" />
          </span>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-subaction">Herramienta de estimación</p>
            <h1 class="font-title text-2xl font-extrabold sm:text-3xl">Calculadora de pintura</h1>
            <p class="mt-1 max-w-2xl text-sm leading-6 text-neutral-white/85">Calcula la cantidad aproximada de pintura que necesitas según las medidas de tu proyecto y el rendimiento del producto seleccionado.</p>
          </div>
        </div>
        <button
          v-if="mostrarVolver && producto"
          type="button"
          class="inline-flex min-h-10 items-center justify-center rounded-button border border-neutral-white/40 px-4 text-sm font-semibold text-white transition-colors hover:bg-neutral-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          @click="emit('verProducto')"
        >
          Volver al producto
        </button>
      </div>
    </header>

    <div class="grid gap-5 lg:grid-cols-[1fr_340px]">
      <div class="space-y-5">
        <section class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm sm:p-5">
          <div class="grid grid-cols-3 border-b border-neutral-light text-center text-xs font-semibold">
            <div class="border-b-2 pb-2" :class="paso === 1 ? 'border-action text-action' : 'border-transparent text-neutral-medium'">1. Superficie</div>
            <div class="border-b-2 pb-2" :class="paso === 2 ? 'border-action text-action' : 'border-transparent text-neutral-medium'">2. Medidas</div>
            <div class="border-b-2 pb-2" :class="paso === 3 ? 'border-action text-action' : 'border-transparent text-neutral-medium'">3. Resultado</div>
          </div>

          <div class="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <h2 class="font-title text-base font-bold text-neutral-black">¿Qué vas a pintar?</h2>
              <div class="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
                <button
                  v-for="opcion in superficies"
                  :key="opcion.valor"
                  type="button"
                  class="flex min-h-11 w-full items-center gap-2 rounded-button border px-3 text-left text-sm transition-all hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                  :class="superficie === opcion.valor ? 'border-action bg-subaction text-corporate' : 'border-neutral-light bg-neutral-white hover:border-action hover:text-action'"
                  @click="seleccionarSuperficie(opcion.valor)"
                >
                  <component :is="opcion.icono" :size="17" />
                  {{ opcion.etiqueta }}
                  <Check v-if="superficie === opcion.valor" :size="15" class="ml-auto" />
                </button>
              </div>
            </div>

            <div>
              <h2 class="font-title text-base font-bold text-neutral-black">Ingresa las medidas</h2>
              <div class="mt-3 grid grid-cols-2 gap-3">
                <label class="text-xs font-semibold text-neutral-dark">
                  Ancho (m)
                  <input v-model.number="ancho" type="number" min="0.1" max="100" step="0.1" class="mt-1 h-11 w-full rounded-input border border-neutral-light px-3 text-sm outline-none focus:border-action focus:ring-2 focus:ring-action" @focus="paso = 2" />
                </label>
                <label class="text-xs font-semibold text-neutral-dark">
                  Alto (m)
                  <input v-model.number="alto" type="number" min="0.1" max="100" step="0.1" class="mt-1 h-11 w-full rounded-input border border-neutral-light px-3 text-sm outline-none focus:border-action focus:ring-2 focus:ring-action" @focus="paso = 2" />
                </label>
              </div>

              <div class="mt-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold text-neutral-dark">Cantidad de superficies</p>
                  <div class="mt-2 inline-flex min-h-11 items-center rounded-button border border-neutral-light bg-neutral-white">
                    <button type="button" class="grid h-11 w-11 place-items-center hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" aria-label="Reducir cantidad" @click="cantidad = Math.max(1, cantidad - 1)">−</button>
                    <span class="min-w-8 text-center text-sm font-semibold">{{ cantidad }}</span>
                    <button type="button" class="grid h-11 w-11 place-items-center hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" aria-label="Aumentar cantidad" @click="cantidad = Math.min(50, cantidad + 1)">+</button>
                  </div>
                </div>
                <div class="rounded-card bg-subaction px-4 py-3 text-center">
                  <p class="text-xs font-semibold text-corporate">Área total</p>
                  <p class="font-title mt-1 text-2xl font-extrabold text-action">{{ area.toFixed(1) }} m²</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm sm:p-5">
          <h2 class="font-title text-base font-bold text-neutral-black">Resultado y recomendación</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div class="rounded-card bg-neutral-lightest p-4">
              <p class="text-xs font-semibold text-neutral-medium">Área calculada</p>
              <p class="font-title mt-1 text-xl font-extrabold text-corporate">{{ area.toFixed(1) }} m²</p>
            </div>
            <div class="rounded-card bg-neutral-lightest p-4">
              <p class="text-xs font-semibold text-neutral-medium">Rendimiento</p>
              <p class="font-title mt-1 text-xl font-extrabold text-corporate">{{ rendimiento.toFixed(1) }} m²/gal</p>
            </div>
            <div class="rounded-card bg-subaction p-4">
              <p class="text-xs font-semibold text-corporate">Cantidad estimada</p>
              <p class="font-title mt-1 text-2xl font-extrabold text-action">{{ galones }} {{ galones === 1 ? 'galón' : 'galones' }}</p>
              <p class="text-[11px] text-neutral-medium">para {{ manos }} manos</p>
            </div>
          </div>
          <div class="mt-4 flex gap-2 rounded-card bg-neutral-lightest p-3 text-[11px] leading-5 text-neutral-medium">
            <Lightbulb :size="16" class="shrink-0 text-highlight" />
            <p><strong class="text-neutral-dark">Nota:</strong> El cálculo es aproximado. El rendimiento puede variar según textura, porosidad, herramienta y color.</p>
          </div>
        </section>
      </div>

      <aside class="h-fit rounded-card border border-neutral-light bg-neutral-white p-4 shadow-sm lg:sticky lg:top-24">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-medium">Producto seleccionado</p>
        <div class="mt-3 rounded-card border border-neutral-light bg-neutral-lightest p-4 text-center">
          <img :src="imagenProducto" :alt="nombreProducto" class="mx-auto h-28 w-28 object-contain" />
          <h2 class="font-title mt-3 line-clamp-2 text-base font-bold text-corporate">{{ nombreProducto }}</h2>
          <p class="mt-1 text-xs text-neutral-medium">Rendimiento: {{ rendimiento.toFixed(1) }} m²/gal</p>
        </div>
        <button type="button" class="mt-4 min-h-11 w-full rounded-button bg-action px-4 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-action-hover active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="calcular">
          Actualizar resultado
        </button>
        <button v-if="producto" type="button" class="mt-2 min-h-11 w-full rounded-button border border-action px-4 text-sm font-semibold text-action transition-all hover:-translate-y-0.5 hover:bg-subaction active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action" @click="emit('verProducto')">
          Ver producto recomendado
        </button>
        <button type="button" class="mt-2 min-h-11 w-full rounded-button bg-conversion px-4 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-conversion-hover active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion" @click="emit('agregar')">
          Agregar al carrito
        </button>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, markRaw, ref } from 'vue';
import { Armchair, Calculator, Check, DoorOpen, Lightbulb, PanelsTopLeft, Square } from 'lucide-vue-next';
import { calculadoraPinturaSchema, type CalculadoraPinturaDTO } from '../../dtos/publicas/calculadora-pintura.dto';
import type { FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';
import { obtenerImagenPublicaRespaldo } from '../../assets/imagenes-catalogo';
import fondoProyectoCalculadora from '../../assets/storefront/fondo-proyecto-calculadora.jpeg';

const fondoDecorativoCalculadora = {
  backgroundImage: `url(${fondoProyectoCalculadora})`,
};

const props = withDefaults(defineProps<{ producto?: FichaProductoPublico | null; mostrarVolver?: boolean }>(), { producto: null, mostrarVolver: false });
const emit = defineEmits<{ agregar: []; verProducto: [] }>();
const superficie = ref<CalculadoraPinturaDTO['superficie']>('paredes');
const ancho = ref(5);
const alto = ref(2.5);
const cantidad = ref(2);
const manos = 2;
const paso = ref(1);

const superficies = [
  { valor: 'paredes' as const, etiqueta: 'Paredes', icono: markRaw(PanelsTopLeft) },
  { valor: 'techos' as const, etiqueta: 'Techos', icono: markRaw(Square) },
  { valor: 'puertas' as const, etiqueta: 'Puertas', icono: markRaw(DoorOpen) },
  { valor: 'muebles' as const, etiqueta: 'Muebles', icono: markRaw(Armchair) },
] as const;

const datosValidos = computed(() =>
  calculadoraPinturaSchema.safeParse({ superficie: superficie.value, ancho: ancho.value, alto: alto.value, cantidad: cantidad.value }).success
);
const area = computed(() => (datosValidos.value ? ancho.value * alto.value * cantidad.value : 0));
const rendimiento = computed(() => {
  const minimo = props.producto?.rendimiento_min;
  const maximo = props.producto?.rendimiento_max;
  return minimo !== null && minimo !== undefined && maximo !== null && maximo !== undefined ? (minimo + maximo) / 2 : 35;
});
const galones = computed(() => Math.max(1, Math.ceil((area.value * manos) / rendimiento.value)));
const nombreProducto = computed(() => props.producto?.nombre ?? 'Pintura recomendada Pintu Clic');
const imagenProducto = computed(() => obtenerImagenPublicaRespaldo(props.producto?.id_producto ?? 1));

function seleccionarSuperficie(valor: CalculadoraPinturaDTO['superficie']): void {
  superficie.value = valor;
  paso.value = 2;
}

function calcular(): void {
  paso.value = 3;
}
</script>
