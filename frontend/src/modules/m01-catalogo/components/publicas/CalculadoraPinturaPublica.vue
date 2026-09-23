<template>
  <Modal :model-value="abierta" max-width="2xl" :accent="true" @update:model-value="emit('cerrar')">
    <div class="space-y-5">
      <header class="flex items-center gap-3 border-b border-neutral-light pb-4">
        <span class="grid h-10 w-10 place-items-center rounded-lg bg-subaction text-corporate">
          <Calculator :size="20" />
        </span>
        <div>
          <h2 class="font-title text-lg font-bold text-corporate">Calculadora de pintura</h2>
          <p class="text-xs text-neutral-medium">Calcula la cantidad aproximada para tu proyecto.</p>
        </div>
      </header>

      <div class="grid grid-cols-3 border-b border-neutral-light text-center text-xs font-semibold">
        <div class="border-b-2 pb-2" :class="paso === 1 ? 'border-action text-action' : 'border-transparent text-neutral-medium'">1. Superficie</div>
        <div class="border-b-2 pb-2" :class="paso === 2 ? 'border-action text-action' : 'border-transparent text-neutral-medium'">2. Medidas</div>
        <div class="border-b-2 pb-2" :class="paso === 3 ? 'border-action text-action' : 'border-transparent text-neutral-medium'">3. Resultado</div>
      </div>

      <div class="grid gap-6 md:grid-cols-3">
        <!-- Paso 1 -->
        <div>
          <h3 class="font-title text-sm font-bold text-neutral-black">¿Qué vas a pintar?</h3>
          <div class="mt-3 space-y-2">
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

        <!-- Paso 2 -->
        <div>
          <h3 class="font-title text-sm font-bold text-neutral-black">Ingresa las medidas</h3>
          <div class="mt-3 grid grid-cols-2 gap-3">
            <label class="text-xs font-semibold text-neutral-dark">
              Ancho (m)
              <input
                v-model.number="ancho"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                class="mt-1 h-11 w-full rounded-input border border-neutral-light px-3 text-sm outline-none focus:border-action focus:ring-2 focus:ring-action"
                @focus="paso = 2"
              />
            </label>
            <label class="text-xs font-semibold text-neutral-dark">
              Alto (m)
              <input
                v-model.number="alto"
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                class="mt-1 h-11 w-full rounded-input border border-neutral-light px-3 text-sm outline-none focus:border-action focus:ring-2 focus:ring-action"
                @focus="paso = 2"
              />
            </label>
          </div>
          <div class="mt-4">
            <p class="text-xs font-semibold text-neutral-dark">Cantidad de superficies</p>
            <div class="mt-2 inline-flex min-h-11 items-center rounded-button border border-neutral-light bg-neutral-white">
              <button
                type="button"
                class="grid h-11 w-11 place-items-center hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                aria-label="Reducir cantidad"
                @click="cantidad = Math.max(1, cantidad - 1)"
              >
                −
              </button>
              <span class="min-w-8 text-center text-sm font-semibold">{{ cantidad }}</span>
              <button
                type="button"
                class="grid h-11 w-11 place-items-center hover:bg-neutral-lightest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                aria-label="Aumentar cantidad"
                @click="cantidad = Math.min(50, cantidad + 1)"
              >
                +
              </button>
            </div>
          </div>
          <div class="mt-6 rounded-card bg-subaction p-3 text-center">
            <p class="text-xs font-semibold text-corporate">Área total a pintar</p>
            <p class="font-title mt-1 text-2xl font-extrabold text-action">{{ area.toFixed(1) }} m²</p>
          </div>
        </div>

        <!-- Paso 3 -->
        <div>
          <h3 class="font-title text-sm font-bold text-neutral-black">Resultado</h3>
          <div class="mt-3 rounded-card border border-neutral-light bg-neutral-white p-3 text-center">
            <img :src="imagenProducto" :alt="nombreProducto" class="mx-auto h-20 w-20 object-contain" />
            <p class="font-title mt-2 line-clamp-2 text-xs font-bold text-corporate">{{ nombreProducto }}</p>
            <p class="mt-1 text-[11px] text-neutral-medium">Rendimiento: {{ rendimiento.toFixed(1) }} m²/gal</p>
          </div>
          <div class="mt-3 text-center">
            <p class="text-xs text-neutral-medium">Necesitas aproximadamente</p>
            <p class="font-title mt-1 text-xl font-extrabold text-action">{{ galones }} {{ galones === 1 ? 'GALÓN' : 'GALONES' }}</p>
            <p class="text-[11px] text-neutral-medium">para {{ manos }} manos</p>
          </div>
          <button
            type="button"
            class="mt-3 min-h-10 w-full rounded-button bg-action px-3 text-xs font-medium text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-action-hover active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
            @click="calcular"
          >
            Ver producto recomendado
          </button>
          <button
            type="button"
            class="mt-2 min-h-10 w-full rounded-button bg-conversion px-3 text-xs font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-conversion-hover active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-conversion"
            @click="emit('agregar')"
          >
            Agregar al carrito
          </button>
        </div>
      </div>

      <footer class="flex gap-2 border-t border-neutral-light pt-3 text-[10px] leading-4 text-neutral-medium">
        <Lightbulb :size="16" class="shrink-0 text-highlight" />
        <p><strong class="text-neutral-dark">Nota:</strong> El cálculo es aproximado. El rendimiento puede variar según la textura, porosidad, herramientas y color.</p>
      </footer>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { computed, markRaw, ref } from 'vue';
import { Armchair, Calculator, Check, DoorOpen, Lightbulb, PanelsTopLeft, Square } from 'lucide-vue-next';
import { Modal } from '@/core/components';
import { calculadoraPinturaSchema, type CalculadoraPinturaDTO } from '../../dtos/publicas/calculadora-pintura.dto';
import type { FichaProductoPublico } from '../../interfaces/publicas/catalogo-publico.interface';
import { obtenerImagenPublicaRespaldo } from '../../assets/imagenes-catalogo';

const props = defineProps<{ abierta: boolean; producto?: FichaProductoPublico | null }>();
const emit = defineEmits<{ cerrar: []; agregar: [] }>();
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
  calculadoraPinturaSchema.safeParse({
    superficie: superficie.value,
    ancho: ancho.value,
    alto: alto.value,
    cantidad: cantidad.value,
  }).success
);

const area = computed(() => (datosValidos.value ? ancho.value * alto.value * cantidad.value : 0));
const rendimiento = computed(() => {
  const minimo = props.producto?.rendimiento_min;
  const maximo = props.producto?.rendimiento_max;
  return minimo !== null && minimo !== undefined && maximo !== null && maximo !== undefined
    ? (minimo + maximo) / 2
    : 35;
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
