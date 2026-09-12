<template>
  <Teleport to="body">
    <div v-if="abierta" class="fixed inset-0 z-50 grid place-items-center bg-corporate/60 p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-calculadora" @click.self="emit('cerrar')">
      <section class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-card bg-neutral-white shadow-xl">
        <header class="flex items-start justify-between border-b border-neutral-light px-5 py-4">
          <div class="flex items-center gap-3"><span class="grid h-9 w-9 place-items-center rounded-button bg-subaction text-corporate"><Calculator :size="19" /></span><div><h2 id="titulo-calculadora" class="font-bold text-corporate">Calculadora de pintura</h2><p class="text-xs text-neutral-medium">Calcula la cantidad aproximada para tu proyecto.</p></div></div>
          <button type="button" class="rounded p-1 text-neutral-medium hover:bg-neutral-lightest" aria-label="Cerrar calculadora" @click="emit('cerrar')"><X :size="19" /></button>
        </header>

        <div class="grid grid-cols-3 border-b border-neutral-light text-center text-xs font-semibold">
          <div class="border-b-2 px-3 py-3" :class="paso === 1 ? 'border-action text-action' : 'border-transparent text-neutral-medium'">1. Superficie</div>
          <div class="border-b-2 px-3 py-3" :class="paso === 2 ? 'border-action text-action' : 'border-transparent text-neutral-medium'">2. Medidas</div>
          <div class="border-b-2 px-3 py-3" :class="paso === 3 ? 'border-action text-action' : 'border-transparent text-neutral-medium'">3. Resultado</div>
        </div>

        <div class="grid gap-6 p-5 md:grid-cols-3">
          <div>
            <h3 class="text-sm font-bold text-neutral-black">¿Qué vas a pintar?</h3>
            <div class="mt-3 space-y-2">
              <button v-for="opcion in superficies" :key="opcion.valor" type="button" class="flex w-full items-center gap-2 rounded-button border px-3 py-2.5 text-left text-sm" :class="superficie === opcion.valor ? 'border-action bg-subaction text-corporate' : 'border-neutral-light'" @click="seleccionarSuperficie(opcion.valor)"><component :is="opcion.icono" :size="17" />{{ opcion.etiqueta }}<Check v-if="superficie === opcion.valor" :size="15" class="ml-auto" /></button>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-bold text-neutral-black">Ingresa las medidas</h3>
            <div class="mt-3 grid grid-cols-2 gap-3"><label class="text-xs font-semibold">Ancho (m)<input v-model.number="ancho" type="number" min="0.1" max="100" step="0.1" class="mt-1 h-10 w-full rounded-button border border-neutral-light px-3 outline-none focus:border-action" @focus="paso = 2" /></label><label class="text-xs font-semibold">Alto (m)<input v-model.number="alto" type="number" min="0.1" max="100" step="0.1" class="mt-1 h-10 w-full rounded-button border border-neutral-light px-3 outline-none focus:border-action" @focus="paso = 2" /></label></div>
            <div class="mt-4"><p class="text-xs font-semibold">Cantidad de superficies iguales</p><div class="mt-2 inline-flex items-center rounded-button border border-neutral-light"><button type="button" class="px-3 py-2" @click="cantidad = Math.max(1, cantidad - 1)">−</button><span class="min-w-8 text-center text-sm">{{ cantidad }}</span><button type="button" class="px-3 py-2" @click="cantidad = Math.min(50, cantidad + 1)">+</button></div></div>
            <div class="mt-7 rounded-card bg-subaction p-4 text-center"><p class="text-xs font-semibold text-corporate">Área total a pintar</p><p class="mt-1 text-2xl font-extrabold text-action">{{ area.toFixed(1) }} m²</p></div>
          </div>

          <div>
            <h3 class="text-sm font-bold text-neutral-black">Resultado</h3>
            <div class="mt-3 rounded-card border border-neutral-light p-4 text-center">
              <img :src="imagenProducto" :alt="nombreProducto" class="mx-auto h-24 w-24 object-contain" />
              <p class="mt-2 line-clamp-2 text-xs font-bold text-corporate">{{ nombreProducto }}</p>
              <p class="mt-1 text-[11px] text-neutral-medium">Rendimiento estimado: {{ rendimiento.toFixed(1) }} m²/gal</p>
            </div>
            <div class="mt-4 text-center"><p class="text-xs text-neutral-medium">Necesitas aproximadamente</p><p class="mt-1 text-xl font-extrabold text-action">{{ galones }} {{ galones === 1 ? 'GALÓN' : 'GALONES' }}</p><p class="text-xs text-neutral-medium">para {{ manos }} manos</p></div>
            <button type="button" class="mt-4 w-full rounded-button bg-action px-4 py-2.5 text-xs font-bold text-white hover:bg-action-hover" @click="calcular">Ver producto recomendado</button>
            <button type="button" class="mt-2 w-full rounded-button bg-conversion px-4 py-2.5 text-xs font-bold text-white hover:bg-conversion-hover" @click="emit('agregar')">Agregar al carrito</button>
          </div>
        </div>

        <footer class="flex gap-2 border-t border-neutral-light bg-neutral-lightest px-5 py-3 text-[10px] leading-4 text-neutral-medium"><Lightbulb :size="16" class="shrink-0 text-highlight" /><p><strong class="text-neutral-dark">Nota:</strong> El cálculo es aproximado. El rendimiento puede variar según la textura, porosidad, herramientas de aplicación y color.</p></footer>
      </section>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, ref, watch } from 'vue';
import { Armchair, Calculator, Check, DoorOpen, Lightbulb, PanelsTopLeft, Square, X } from 'lucide-vue-next';
import { calculadoraPinturaSchema, type CalculadoraPinturaDTO } from '../../dtos/calculadora-pintura.dto';
import type { FichaProductoPublico } from '../../interfaces/catalogo-publico.interface';
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
const datosValidos = computed(() => calculadoraPinturaSchema.safeParse({ superficie: superficie.value, ancho: ancho.value, alto: alto.value, cantidad: cantidad.value }).success);
const area = computed(() => datosValidos.value ? ancho.value * alto.value * cantidad.value : 0);
const rendimiento = computed(() => {
  const minimo = props.producto?.rendimiento_min;
  const maximo = props.producto?.rendimiento_max;
  return minimo !== null && minimo !== undefined && maximo !== null && maximo !== undefined ? (minimo + maximo) / 2 : 35;
});
const galones = computed(() => Math.max(1, Math.ceil((area.value * manos) / rendimiento.value)));
const nombreProducto = computed(() => props.producto?.nombre ?? 'Pintura recomendada Pintu Clic');
const imagenProducto = computed(() => obtenerImagenPublicaRespaldo(props.producto?.id_producto ?? 1));

watch(() => props.abierta, (abierta) => { document.body.style.overflow = abierta ? 'hidden' : ''; if (abierta) paso.value = 1; });
onBeforeUnmount(() => { document.body.style.overflow = ''; });
function seleccionarSuperficie(valor: CalculadoraPinturaDTO['superficie']): void { superficie.value = valor; paso.value = 2; }
function calcular(): void { paso.value = 3; }
</script>
