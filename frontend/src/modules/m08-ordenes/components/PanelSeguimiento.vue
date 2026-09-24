<template>
  <div>
    <!-- Cargando -->
    <div v-if="cargando" class="flex flex-col gap-4" aria-busy="true">
      <div class="h-20 rounded-card bg-white border border-neutral-light animate-pulse" />
      <div class="h-64 rounded-card bg-white border border-neutral-light animate-pulse" />
      <div class="h-48 rounded-card bg-white border border-neutral-light animate-pulse" />
    </div>

    <!-- No encontrado, o de otro titular: el backend responde igual (CA-SEG-03-06) -->
    <div
      v-else-if="noEncontrado"
      class="rounded-card border border-dashed border-neutral-light bg-white px-6 py-14 text-center"
    >
      <PackageIcon class="w-10 h-10 text-neutral-medium mx-auto mb-3" />
      <h3 class="font-semibold text-neutral-black text-lg">Pedido no encontrado</h3>
      <p class="text-neutral-medium text-sm mt-1">
        No encontramos ningún pedido con ese número en tu cuenta.
      </p>
    </div>

    <div v-else-if="pedido" class="flex flex-col gap-4">
      <!-- 1. Cabecera: identifica el pedido y responde «¿en qué va?» de un vistazo -->
      <div
        class="bg-white border border-neutral-light rounded-card p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span class="w-10 h-10 rounded-input bg-subaction grid place-items-center shrink-0">
            <FileTextIcon class="w-5 h-5 text-corporate" />
          </span>
          <div class="min-w-0">
            <h2 class="font-semibold text-neutral-black truncate">
              Pedido {{ pedido.codigo }}
            </h2>
            <p class="text-neutral-medium text-xs mt-0.5">
              Realizado el {{ formatearFecha(pedido.fecha) }} · Origen:
              {{ pedido.origen === 'carrito' ? 'carrito' : 'cotización' }}
            </p>
          </div>
        </div>
        <span
          class="inline-flex items-center rounded-full px-3.5 py-1.5 text-sm font-semibold"
          :class="presentacion.clases"
          role="status"
        >
          {{ presentacion.etiqueta }}
        </span>
      </div>

      <!-- 2. Seguimiento -->
      <div class="bg-white border border-neutral-light rounded-card p-5">
        <h3 class="flex items-center gap-2 font-semibold text-neutral-black mb-4">
          <TruckIcon class="w-4 h-4 text-action" />
          Seguimiento
        </h3>

        <!-- Un pedido cancelado no encaja en la secuencia -->
        <div
          v-if="pedido.estado === 'cancelado'"
          class="flex items-start gap-3 rounded-card bg-neutral-lightest px-4 py-3"
          role="status"
        >
          <AlertIcon class="w-5 h-5 text-neutral-dark shrink-0 mt-0.5" />
          <div>
            <p class="font-semibold text-neutral-dark text-sm">Este pedido fue cancelado</p>
            <p class="text-neutral-dark text-xs mt-1">
              Si tienes dudas sobre la cancelación, contáctanos con el número del pedido.
            </p>
          </div>
        </div>

        <ol v-else>
          <li v-for="(paso, i) in pasos" :key="paso.estado" class="flex gap-4">
            <div class="flex flex-col items-center">
              <span
                class="w-3.5 h-3.5 rounded-full shrink-0 mt-1"
                :class="[
                  paso.recorrido ? 'bg-conversion' : 'bg-neutral-light',
                  paso.actual ? '!bg-action ring-4 ring-subaction' : '',
                ]"
              />
              <span
                v-if="i < pasos.length - 1"
                class="w-0.5 flex-1 min-h-[34px]"
                :class="paso.recorrido ? 'bg-conversion' : 'bg-neutral-light'"
              />
            </div>
            <div class="pb-5">
              <p
                class="text-sm"
                :class="
                  paso.recorrido || paso.actual
                    ? 'font-semibold text-neutral-black'
                    : 'font-medium text-neutral-medium'
                "
              >
                {{ paso.etiqueta }}
                <!-- El color no basta: se nombra el avance para lectores de pantalla. -->
                <span class="sr-only">
                  {{
                    paso.actual ? '— estado actual' : paso.recorrido ? '— completado' : '— pendiente'
                  }}
                </span>
              </p>
              <p v-if="paso.actual" class="text-action text-xs mt-0.5" aria-hidden="true">
                Estado actual
              </p>
            </div>
          </li>
        </ol>

        <!--
          ⚠️ FALTA EN EL BACKEND: no hay historial de estados. La API solo devuelve el
          estado actual, sin fecha ni autor de cada paso (bloqueo nº 2 del walkthrough).
        -->
        <p
          v-if="pedido.estado !== 'cancelado'"
          class="text-neutral-medium text-xs mt-2 border-t border-neutral-light pt-3"
        >
          Las fechas de cada etapa estarán disponibles próximamente.
        </p>
      </div>

      <!-- 3. Datos de despacho -->
      <div class="bg-white border border-neutral-light rounded-card p-5">
        <h3 class="flex items-center gap-2 font-semibold text-neutral-black mb-4">
          <MapPinIcon class="w-4 h-4 text-action" />
          Datos de despacho
        </h3>
        <dl class="grid gap-3 text-sm">
          <div>
            <dt class="text-neutral-medium text-xs">Dirección de entrega</dt>
            <dd class="text-neutral-black mt-0.5">{{ pedido.direccion }}</dd>
          </div>
          <div v-if="pedido.observaciones">
            <dt class="text-neutral-medium text-xs">Observaciones</dt>
            <dd class="text-neutral-dark mt-0.5">{{ pedido.observaciones }}</dd>
          </div>
        </dl>
        <!-- ⚠️ FALTA EN EL BACKEND: transportadora y número de guía (dependen de M10). -->
      </div>

      <!--
        4. Detalle de la compra, al final.
        El importe total es información de cierre: en un recibo o un checkout el
        total siempre remata la lectura, así que este bloque va el último.
      -->
      <div class="bg-white border border-neutral-light rounded-card p-5">
        <h3 class="flex items-center gap-2 font-semibold text-neutral-black mb-4">
          <ShoppingCartIcon class="w-4 h-4 text-action" />
          Detalle de la compra
        </h3>

        <ul class="flex flex-col divide-y divide-neutral-lightest">
          <li
            v-for="(linea, i) in pedido.lineas"
            :key="i"
            class="flex items-start gap-3 py-3 first:pt-0"
          >
            <!-- ⚠️ FALTA EN EL BACKEND: linea_orden no guarda imagen del producto. -->
            <span
              class="w-11 h-11 shrink-0 rounded-input bg-neutral-lightest border border-neutral-light grid place-items-center"
              aria-hidden="true"
            >
              <PackageIcon class="w-5 h-5 text-neutral-medium" />
            </span>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-neutral-black text-sm">
                {{ linea.producto }}
              </p>
              <p class="text-neutral-medium text-xs mt-0.5">
                {{ linea.variante }} · {{ linea.cantidad }} und.
              </p>
            </div>
            <span class="text-neutral-black text-sm font-semibold tabular-nums shrink-0">
              {{ formatearCOP(Number(linea.precio_aplicado) * linea.cantidad) }}
            </span>
          </li>
        </ul>

        <dl class="border-t border-neutral-light mt-4 pt-4 grid gap-2 text-sm">
          <div class="flex justify-between text-neutral-medium">
            <dt>Subtotal</dt>
            <dd class="tabular-nums">{{ formatearCOP(pedido.sub_total) }}</dd>
          </div>
          <div v-if="Number(pedido.descuento) > 0" class="flex justify-between text-neutral-dark">
            <dt>Descuento</dt>
            <dd class="tabular-nums">− {{ formatearCOP(pedido.descuento) }}</dd>
          </div>
          <!-- ⚠️ FALTA EN EL BACKEND: no hay columna de costo de envío. -->
          <div
            class="flex justify-between items-center border-t border-neutral-light pt-3 mt-1 rounded-input bg-conversion/10 px-3 py-2.5"
          >
            <dt class="font-bold text-corporate">Total</dt>
            <dd class="font-bold text-conversion-hover text-lg tabular-nums">
              {{ formatearCOP(pedido.total) }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- 5. Ayuda, como en el mockup -->
      <div
        class="rounded-card bg-conversion/10 border border-conversion/20 p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p class="font-semibold text-neutral-black text-sm">
            ¿Necesitas ayuda con tu pedido?
          </p>
          <p class="text-neutral-medium text-xs mt-0.5">Nuestro equipo está listo para ayudarte.</p>
        </div>
        <span
          class="inline-flex items-center gap-2 rounded-button bg-corporate px-4 py-2.5 text-sm font-medium text-white"
        >
          <MessageCircleIcon class="w-4 h-4" />
          Contáctanos por WhatsApp
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  FileText as FileTextIcon,
  MapPin as MapPinIcon,
  Package as PackageIcon,
  ShoppingCart as ShoppingCartIcon,
  Truck as TruckIcon,
  AlertCircle as AlertIcon,
  MessageCircle as MessageCircleIcon,
} from 'lucide-vue-next';
import { OrdenesService } from '../services/ordenes.service';
import { DETALLE_MOCK } from '../services/ordenes.mock';
import {
  ESTADOS,
  SECUENCIA_ESTADOS,
  formatearCOP,
  formatearFecha,
} from '../dtos/estado-pedido.dto';
import type { DetallePedido } from '../interfaces/ordenes.interface';

/**
 * Panel de seguimiento de un pedido (mockup «Seguimiento de Pedido»).
 *
 * Orden de lectura: cabecera con el estado → en qué va → a dónde va → qué costó.
 * El detalle de la compra cierra la lectura porque contiene el total, y el total
 * es información de cierre en cualquier recibo o resumen de compra.
 *
 * Se muestra SIEMPRE dentro de la sección de pedidos, a la derecha de la lista:
 * nunca reemplaza la pantalla.
 */
const props = defineProps<{ codigo: string }>();

const pedido = ref<DetallePedido | null>(null);
const cargando = ref(false);
const noEncontrado = ref(false);

const presentacion = computed(() =>
  pedido.value ? ESTADOS[pedido.value.estado] : ESTADOS.pendiente
);

/** Pasos deducidos del enum: el backend no expone historial. */
const pasos = computed(() => {
  if (!pedido.value) return [];
  const actual = SECUENCIA_ESTADOS.indexOf(pedido.value.estado);
  return SECUENCIA_ESTADOS.map((estado, i) => ({
    estado,
    etiqueta: ESTADOS[estado].etiqueta,
    recorrido: actual >= 0 && i < actual,
    actual: i === actual,
  }));
});

async function cargar(): Promise<void> {
  cargando.value = true;
  noEncontrado.value = false;
  try {
    pedido.value = await OrdenesService.detalle(props.codigo);
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } };
    if (err.response?.status === 404) {
      noEncontrado.value = true;
      pedido.value = null;
    } else {
      pedido.value = DETALLE_MOCK;
    }
  } finally {
    cargando.value = false;
  }
}

watch(() => props.codigo, () => void cargar());
onMounted(() => void cargar());
</script>
