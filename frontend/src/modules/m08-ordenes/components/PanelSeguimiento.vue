<template>
  <div>
    <!-- Cargando -->
    <div v-if="cargando" class="flex flex-col gap-4" aria-busy="true">
      <div class="h-20 rounded-card bg-white border border-neutral-light animate-pulse" />
      <div class="h-72 rounded-card bg-white border border-neutral-light animate-pulse" />
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

    <!-- Falló el servidor o la red: nunca un pedido de ejemplo, siempre reintentar -->
    <EstadoErrorCarga
      v-else-if="errorCarga"
      titulo="No pudimos cargar tu pedido"
      @reintentar="cargar"
    />

    <div v-else-if="pedido" class="flex flex-col gap-4">
      <!--
        Dos columnas, como en el diseño «Seguimiento de Pedido»:
          · izquierda — cabecera, línea de tiempo y aviso del estado en curso
          · derecha   — datos de despacho y detalle de la compra
        Por debajo de lg se apilan en una sola columna.
      -->
      <div class="grid gap-4 items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
        <div class="flex flex-col gap-4 min-w-0">

      <!-- ===== 1. Cabecera del pedido ===== -->
      <div class="bg-white border border-neutral-light rounded-card p-4 sm:p-5">
        <div class="flex flex-wrap items-center gap-4">
          <span class="w-11 h-11 rounded-card bg-subaction grid place-items-center shrink-0">
            <FileTextIcon class="w-5 h-5 text-action" />
          </span>

          <div class="min-w-0 flex-1">
            <h2 class="font-bold text-neutral-black text-lg truncate">
              Pedido {{ pedido.codigo }}
            </h2>
            <p class="text-neutral-medium text-xs mt-0.5">
              Realizado el {{ formatearFecha(pedido.fecha) }}
            </p>
          </div>

          <!--
            El diseño muestra aquí «Fecha estimada de entrega».
            ⚠️ FALTA EN EL BACKEND: no existe ese campo, así que se muestra el
            origen del pedido, que sí llega.
          -->
          <div class="hidden sm:block">
            <span class="block text-xs text-neutral-medium leading-tight">Origen del pedido</span>
            <span class="block text-action font-semibold text-sm leading-tight">
              {{ pedido.origen === 'carrito' ? 'Carrito de compras' : 'Cotización aprobada' }}
            </span>
          </div>

          <span
            class="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold shrink-0"
            :class="presentacion.clases"
            role="status"
          >
            <TruckIcon class="w-4 h-4" />
            {{ presentacion.etiqueta }}
          </span>
        </div>
      </div>

      <!-- ===== 2. Línea de tiempo ===== -->
      <div class="bg-white border border-neutral-light rounded-card overflow-hidden">
        <!-- Pedido cancelado: no encaja en la secuencia -->
        <div v-if="esFinalSinSecuencia" class="p-5">
          <div class="flex items-start gap-3 rounded-card bg-danger-subtle px-4 py-3" role="status">
            <AlertIcon class="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold text-danger text-sm">Este pedido fue cancelado</p>
              <p class="text-neutral-dark text-xs mt-1">
                {{ DESCRIPCION_ETAPA.cancelado }} Si tienes dudas, contáctanos con el número del
                pedido.
              </p>
            </div>
          </div>
        </div>

        <ol v-else>
          <li
            v-for="(paso, i) in pasos"
            :key="paso.estado"
            class="flex gap-4 px-4 sm:px-5 py-4"
            :class="[
              i > 0 ? 'border-t border-neutral-lightest' : '',
              paso.actual ? 'bg-subaction/40 border-l-4 border-l-action' : '',
            ]"
          >
            <!-- Marcador y línea de progreso -->
            <div class="flex flex-col items-center shrink-0">
              <span
                class="w-7 h-7 rounded-full grid place-items-center shrink-0"
                :class="
                  paso.recorrido
                    ? 'bg-conversion text-white'
                    : paso.actual
                      ? 'bg-action text-white'
                      : 'bg-neutral-light text-neutral-medium'
                "
              >
                <TruckIcon v-if="paso.actual" class="w-4 h-4" />
                <CheckIcon v-else class="w-4 h-4" />
              </span>
              <span
                v-if="i < pasos.length - 1"
                class="w-0.5 flex-1 mt-1 min-h-[18px]"
                :class="paso.recorrido ? 'bg-conversion' : 'bg-neutral-light'"
              />
            </div>

            <!-- Texto del paso -->
            <div class="flex-1 min-w-0">
              <p
                class="text-sm font-semibold"
                :class="
                  paso.actual
                    ? 'text-action'
                    : paso.recorrido
                      ? 'text-neutral-black'
                      : 'text-neutral-medium'
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
              <p class="text-xs mt-0.5" :class="paso.actual ? 'text-action' : 'text-neutral-medium'">
                {{ paso.descripcion }}
              </p>
            </div>

            <!-- Fecha y hora reales de la etapa, tomadas del historial del pedido. -->
            <div class="shrink-0 text-right">
              <span
                v-if="paso.fecha"
                class="text-xs tabular-nums"
                :class="paso.actual ? 'text-action font-medium' : 'text-neutral-medium'"
              >
                {{ formatearFechaHora(paso.fecha) }}
              </span>
              <span v-else class="text-xs text-neutral-medium">Pendiente</span>
            </div>
          </li>
        </ol>
      </div>

      <!-- ===== 3. Aviso del estado en curso ===== -->
      <div
        v-if="!esFinalSinSecuencia"
        class="flex items-start gap-3 rounded-card bg-subaction/50 border border-subaction px-4 py-3.5"
      >
        <span class="w-8 h-8 rounded-full bg-action grid place-items-center shrink-0">
          <InfoIcon class="w-4 h-4 text-white" />
        </span>
        <div>
          <p class="font-semibold text-corporate text-sm">{{ avisoEstado.titulo }}</p>
          <p class="text-action text-xs mt-0.5">{{ avisoEstado.detalle }}</p>
        </div>
      </div>

        </div>

        <div class="flex flex-col gap-4 min-w-0">

      <!-- ===== 4. Datos de despacho ===== -->
      <div class="bg-white border border-neutral-light rounded-card p-4 sm:p-5">
        <h3 class="flex items-center gap-2 font-bold text-corporate mb-4">
          <MapPinIcon class="w-4 h-4 text-action" />
          Datos de despacho
        </h3>
        <dl class="grid gap-3.5 text-sm">
          <div v-if="pedido.modo_entrega" class="flex gap-2.5">
            <TruckIcon class="w-4 h-4 text-neutral-medium shrink-0 mt-0.5" />
            <div>
              <dt class="text-neutral-medium text-xs">Forma de entrega</dt>
              <dd class="text-neutral-black mt-0.5">{{ MODO_ENTREGA[pedido.modo_entrega] }}</dd>
            </div>
          </div>
          <div v-if="pedido.direccion" class="flex gap-2.5">
            <MapPinIcon class="w-4 h-4 text-neutral-medium shrink-0 mt-0.5" />
            <div>
              <dt class="text-neutral-medium text-xs">Dirección de entrega</dt>
              <dd class="text-neutral-black mt-0.5">{{ pedido.direccion }}</dd>
            </div>
          </div>
          <div v-if="pedido.observaciones" class="flex gap-2.5">
            <FileTextIcon class="w-4 h-4 text-neutral-medium shrink-0 mt-0.5" />
            <div>
              <dt class="text-neutral-medium text-xs">Observaciones</dt>
              <dd class="text-neutral-dark mt-0.5">{{ pedido.observaciones }}</dd>
            </div>
          </div>
        </dl>
        <!--
          ⚠️ FALTA EN EL BACKEND: transportadora, número de guía y mapa de entrega.
          Dependen del módulo M10.
        -->
      </div>

      <!-- ===== 5. Detalle de la compra ===== -->
      <div class="bg-white border border-neutral-light rounded-card p-4 sm:p-5">
        <h3 class="flex items-center gap-2 font-bold text-corporate mb-4">
          <ShoppingCartIcon class="w-4 h-4 text-action" />
          Detalle de la compra
        </h3>

        <ul class="flex flex-col gap-3.5">
          <li v-for="(linea, i) in pedido.lineas" :key="i" class="flex items-start gap-3">
            <!-- ⚠️ FALTA EN EL BACKEND: linea_orden no guarda imagen del producto. -->
            <span
              class="w-11 h-11 shrink-0 rounded-input bg-neutral-lightest grid place-items-center"
              aria-hidden="true"
            >
              <PackageIcon class="w-5 h-5 text-neutral-medium" />
            </span>
            <div class="flex-1 min-w-0">
              <!--
                El nombre enlaza a la ficha solo si el producto sigue en el catálogo:
                cuando está retirado, `id_producto` llega nulo (RF-ORD-04-03).
              -->
              <RouterLink
                v-if="linea.id_producto"
                :to="{ name: 'DetalleProductoPublico', params: { productoId: linea.id_producto } }"
                class="font-semibold text-action text-sm hover:underline"
              >
                {{ linea.producto }}
              </RouterLink>
              <p v-else class="font-semibold text-neutral-black text-sm">{{ linea.producto }}</p>

              <p class="text-neutral-medium text-xs mt-0.5">
                {{ linea.variante }}
                <template v-if="linea.color_solicitado">
                  · Color: {{ linea.color_solicitado }}
                </template>
                · {{ linea.cantidad }} und.
              </p>

              <span
                v-if="linea.es_entonado"
                class="inline-flex items-center rounded-full bg-highlight/20 px-2 py-0.5 text-[11px] font-semibold text-corporate mt-1"
              >
                Entonado
              </span>

              <!-- Producto fuera del catálogo: se avisa sin ocultar lo comprado. -->
              <p v-if="linea.retirado" class="text-danger text-xs mt-1">
                Este producto ya no está disponible en el catálogo.
              </p>

              <!--
                Desglose de descuentos de la línea (CA-ORD-02-02): cuáles fueron, en qué
                orden se aplicaron y cuánto descontó cada uno.
              -->
              <ul
                v-if="linea.descuentos.length"
                class="mt-1.5 flex flex-col gap-0.5 border-l-2 border-conversion pl-2.5"
              >
                <li
                  v-for="d in linea.descuentos"
                  :key="d.orden"
                  class="flex justify-between gap-3 text-[11px]"
                >
                  <span class="text-neutral-medium">
                    {{ d.origen }}
                    <template v-if="d.porcentaje"> · {{ Number(d.porcentaje) }} %</template>
                  </span>
                  <span class="text-conversion-hover tabular-nums shrink-0">
                    − {{ formatearCOP(d.importe) }}
                  </span>
                </li>
              </ul>
            </div>
            <div class="shrink-0 text-right">
              <!-- Precio antes de los descuentos, cuando hubo alguno (RF-ORD-02-02). -->
              <span
                v-if="linea.precio_inicial && linea.descuentos.length"
                class="block text-neutral-medium text-xs line-through tabular-nums"
              >
                {{ formatearCOP(Number(linea.precio_inicial) * linea.cantidad) }}
              </span>
              <span class="block text-neutral-black text-sm font-semibold tabular-nums">
                {{ formatearCOP(Number(linea.precio_aplicado) * linea.cantidad) }}
              </span>
              <span class="block text-neutral-medium text-[11px] leading-tight">COP</span>
            </div>
          </li>
        </ul>

        <dl class="border-t border-neutral-light mt-4 pt-4 grid gap-2 text-sm">
          <div class="flex justify-between text-neutral-dark">
            <dt>Subtotal</dt>
            <dd class="tabular-nums">{{ formatearCOP(pedido.sub_total) }}</dd>
          </div>
          <div v-if="Number(pedido.descuento) > 0" class="flex justify-between text-danger">
            <dt>Descuento</dt>
            <dd class="tabular-nums">− {{ formatearCOP(pedido.descuento) }}</dd>
          </div>
          <div
            v-if="Number(pedido.costo_entrega) > 0"
            class="flex justify-between text-neutral-dark"
          >
            <dt>Costo de entrega</dt>
            <dd class="tabular-nums">{{ formatearCOP(pedido.costo_entrega) }}</dd>
          </div>
          <!--
            El IVA ya va dentro del total (el catálogo publica precios con impuesto
            incluido): se muestra discriminado, nunca sumado aparte.
          -->
          <div v-if="pedido.importe_iva" class="flex justify-between text-neutral-medium text-xs">
            <dt>
              IVA incluido
              <span v-if="pedido.tasa_iva">({{ Number(pedido.tasa_iva) }} %)</span>
            </dt>
            <dd class="tabular-nums">{{ formatearCOP(pedido.importe_iva) }}</dd>
          </div>
          <div
            class="flex justify-between items-center rounded-card bg-conversion/10 px-4 py-3 mt-2"
          >
            <dt class="font-bold text-corporate">Total</dt>
            <dd class="font-bold text-conversion-hover text-lg tabular-nums">
              {{ formatearCOP(pedido.total) }} COP
            </dd>
          </div>
        </dl>
      </div>

        </div>
      </div>

      <!--
        ===== 5.b Cancelación =====
        HU-POS-01 y HU-POS-02 están bloqueadas a la espera de la política de M11, y el
        backend rechaza esas transiciones con 409 OPERACION_NO_HABILITADA. El informe
        final del backend deja este aviso como pendiente del frontend: el cliente que
        quiere cancelar debe saber qué hacer en lugar de buscar un botón que no existe.
      -->
      <div
        v-if="puedeIntentarCancelar"
        class="flex items-start gap-3 rounded-card border border-neutral-light bg-white px-4 py-3.5"
      >
        <AlertIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-neutral-black text-sm">
            ¿Necesitas cancelar este pedido?
          </p>
          <p class="text-neutral-medium text-xs mt-1">
            La cancelación en línea todavía no está disponible. Escríbenos por WhatsApp
            con el número <span class="font-semibold text-neutral-dark">{{ pedido.codigo }}</span>
            y lo gestionamos contigo.
          </p>
        </div>
      </div>

      <!-- ===== 6. Ayuda ===== -->
      <div
        class="rounded-card bg-conversion/10 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
      >
        <div class="flex items-start gap-3">
          <BookIcon class="w-5 h-5 text-conversion-hover shrink-0 mt-0.5" />
          <div>
            <p class="font-bold text-neutral-black text-sm">¿Necesitas ayuda con tu pedido?</p>
            <p class="text-conversion-hover text-xs mt-0.5">
              Nuestro equipo está listo para ayudarte.
            </p>
          </div>
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
import { RouterLink } from 'vue-router';
import {
  FileText as FileTextIcon,
  MapPin as MapPinIcon,
  Package as PackageIcon,
  ShoppingCart as ShoppingCartIcon,
  Truck as TruckIcon,
  Check as CheckIcon,
  Info as InfoIcon,
  BookOpen as BookIcon,
  AlertCircle as AlertIcon,
  MessageCircle as MessageCircleIcon,
} from 'lucide-vue-next';
import { OrdenesService } from '../services/ordenes.service';
import EstadoErrorCarga from './EstadoErrorCarga.vue';
import { clasificarErrorCarga } from '../composables/clasificarErrorCarga';
import {
  ESTADOS,
  secuenciaSegunEntrega,
  DESCRIPCION_ETAPA,
  descripcionEtapa,
  formatearCOP,
  formatearFecha,
  formatearFechaHora,
  MODO_ENTREGA,
} from '../dtos/estado-pedido.dto';
import type { DetallePedido, EstadoOrden } from '../interfaces/ordenes.interface';

/**
 * Panel de seguimiento de un pedido, maquetado según «Seguimiento de Pedido» del
 * Figma: cabecera, línea de tiempo con etapas descritas, aviso de estado, datos de
 * despacho, detalle de la compra y bloque de ayuda.
 *
 * Se muestra dentro de la sección de pedidos, a la derecha de la lista: nunca
 * reemplaza la pantalla.
 */
const props = defineProps<{ codigo: string }>();

const pedido = ref<DetallePedido | null>(null);
const cargando = ref(false);
const noEncontrado = ref(false);
/** La consulta falló por el servidor o la red: se ofrece reintentar. */
const errorCarga = ref(false);

const presentacion = computed(() =>
  pedido.value ? ESTADOS[pedido.value.estado] : ESTADOS.orden_confirmada
);

/** Cancelado y devuelto no encajan en la secuencia lineal de etapas. */
const esFinalSinSecuencia = computed(
  () => pedido.value?.estado === 'cancelado' || pedido.value?.estado === 'devuelto'
);

const pasos = computed(() => {
  if (!pedido.value) return [];
  // La secuencia depende del modo de entrega: la recogida en tienda no pasa por
  // «Despachado» (diagrama oficial de la máquina de estados).
  const secuencia = secuenciaSegunEntrega(pedido.value.modo_entrega);
  const actual = secuencia.indexOf(pedido.value.estado);
  const historial = pedido.value.historial ?? [];
  return secuencia.map((estado, i) => ({
    estado,
    etiqueta: ESTADOS[estado].etiqueta,
    descripcion: descripcionEtapa(estado, pedido.value!.modo_entrega),
    recorrido: actual >= 0 && i < actual,
    actual: i === actual,
    /** Momento real en que el pedido entró en la etapa; vacío si todavía no ocurrió. */
    fecha: historial.find((h) => h.estado === estado)?.fecha ?? '',
  }));
});

/** Aviso destacado bajo la línea de tiempo, según la etapa en curso. */
const AVISOS: Record<EstadoOrden, { titulo: string; detalle: string }> = {
  orden_confirmada: {
    titulo: '¡Tu pedido fue confirmado!',
    detalle: 'Ya estamos gestionando tu compra.',
  },
  revision_disponibilidad: {
    titulo: 'Estamos revisando la disponibilidad',
    detalle: 'Te avisaremos en cuanto verifiquemos tus productos.',
  },
  en_preparacion: {
    titulo: 'Tu pedido se está preparando',
    detalle: 'Te avisaremos cuando salga de bodega.',
  },
  preparada: {
    titulo: 'Tu pedido está listo',
    detalle: 'Muy pronto saldrá hacia tu destino.',
  },
  despachado: {
    titulo: '¡Tu pedido está en camino!',
    detalle: 'Te notificaremos cuando llegue a tu destino.',
  },
  entregado: {
    titulo: '¡Tu pedido fue entregado!',
    detalle: 'Gracias por comprar en Pintu Clic.',
  },
  cancelado: { titulo: '', detalle: '' },
  devuelto: { titulo: '', detalle: '' },
};

/**
 * Un pedido ya entregado, cancelado o devuelto no admite cancelación: el aviso solo
 * tiene sentido mientras sigue su curso.
 */
const puedeIntentarCancelar = computed(() => {
  const estado = pedido.value?.estado;
  if (!estado) return false;
  return estado !== 'entregado' && estado !== 'cancelado' && estado !== 'devuelto';
});

const avisoEstado = computed(() => (pedido.value ? AVISOS[pedido.value.estado] : AVISOS.orden_confirmada));

async function cargar(): Promise<void> {
  cargando.value = true;
  noEncontrado.value = false;
  errorCarga.value = false;
  try {
    pedido.value = await OrdenesService.detalle(props.codigo);
  } catch (e: unknown) {
    // Nunca se muestra un pedido de ejemplo: el cliente lo tomaría por suyo.
    // 401/403/404 → «no encontrado», como hasta ahora (CA-SEG-03-06); servidor o red →
    // error con opción de reintentar.
    pedido.value = null;
    if (clasificarErrorCarga(e) === 'servidor') {
      errorCarga.value = true;
    } else {
      noEncontrado.value = true;
    }
  } finally {
    cargando.value = false;
  }
}

watch(() => props.codigo, () => void cargar());
onMounted(() => void cargar());
</script>
