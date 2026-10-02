<template>
  <!--
    HU-ORD-03 / HU-ORD-04 / HU-ORD-05 · «Detalle de orden (vista administrativa)»

    Muestra lo mismo que ve el cliente MÁS lo que es solo del personal: contacto
    del titular, historial con autor y motivo, notas internas y contactos
    registrados. El botón de cambiar estado abre el modal de HU-ORD-03.
  -->
  <div>
    <div v-if="cargando" class="flex flex-col gap-4" aria-busy="true">
      <div class="h-24 rounded-2xl bg-white border border-neutral-light animate-pulse" />
      <div class="h-64 rounded-2xl bg-white border border-neutral-light animate-pulse" />
    </div>

    <!-- La sesión caducó: es distinto de «no existe» y hay que decirlo. -->
    <div
      v-else-if="sesionExpirada"
      class="rounded-2xl border border-dashed border-neutral-light bg-white px-6 py-14 text-center"
    >
      <PackageIcon class="w-10 h-10 text-neutral-medium mx-auto mb-3" />
      <h2 class="font-semibold text-neutral-black text-lg">Tu sesión expiró</h2>
      <p class="text-neutral-medium text-sm mt-1 mb-5">
        Vuelve a iniciar sesión para seguir consultando las órdenes.
      </p>
    </div>

    <!-- 404 también cuando existe pero no es visible para esta cuenta (CA-SEG-03-06) -->
    <div
      v-else-if="noEncontrado"
      class="rounded-2xl border border-dashed border-neutral-light bg-white px-6 py-14 text-center"
    >
      <PackageIcon class="w-10 h-10 text-neutral-medium mx-auto mb-3" />
      <h2 class="font-semibold text-neutral-black text-lg">Orden no encontrada</h2>
      <p class="text-neutral-medium text-sm mt-1 mb-5">
        No existe ninguna orden con ese código, o tu cuenta no puede consultarla.
      </p>
      <RouterLink
        :to="{ name: 'AdminGestionOrdenes' }"
        class="inline-flex items-center rounded-button bg-action px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-action-hover"
      >
        Volver a la bandeja
      </RouterLink>
    </div>

    <template v-else-if="orden">
      <RouterLink
        :to="{ name: 'AdminGestionOrdenes' }"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-medium hover:text-action transition-colors mb-4"
      >
        <ArrowLeftIcon class="w-4 h-4" />
        Volver a la bandeja
      </RouterLink>

      <PageHeader :title="'Orden ' + orden.codigo" :description="descripcionCabecera">
        <Button
          v-if="orden.transiciones_permitidas.length"
          variant="primary"
          @click="modalAbierto = true"
        >
          Cambiar estado
        </Button>
      </PageHeader>

      <Alert v-if="avisoExito" tone="success" class="mb-5">{{ avisoExito }}</Alert>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem] items-start">
        <!-- ================= Columna principal ================= -->
        <div class="flex flex-col gap-5 min-w-0">
          <!-- Estado y entrega -->
          <section class="bg-white border border-neutral-light rounded-2xl p-5">
            <div class="flex flex-wrap items-center gap-x-8 gap-y-4">
              <div>
                <p class="text-xs text-neutral-medium">Estado actual</p>
                <span
                  class="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold mt-1"
                  :class="ESTADOS[orden.estado].clases"
                >
                  {{ ESTADOS[orden.estado].etiqueta }}
                </span>
              </div>
              <div>
                <p class="text-xs text-neutral-medium">Origen</p>
                <p class="font-semibold text-neutral-black text-sm mt-1">
                  {{ orden.origen === 'carrito' ? 'Carrito de compras' : 'Cotización aprobada' }}
                </p>
              </div>
              <div v-if="orden.modo_entrega">
                <p class="text-xs text-neutral-medium">Entrega</p>
                <p class="font-semibold text-neutral-black text-sm mt-1">
                  {{ MODO_ENTREGA[orden.modo_entrega] }}
                </p>
              </div>
              <div v-if="orden.codigo_solicitud">
                <p class="text-xs text-neutral-medium">Solicitud</p>
                <p class="font-semibold text-neutral-black text-sm mt-1">
                  {{ orden.codigo_solicitud }}
                </p>
              </div>
            </div>

            <div v-if="orden.direccion" class="border-t border-neutral-lightest mt-4 pt-4">
              <p class="text-xs text-neutral-medium">Dirección de entrega</p>
              <p class="text-neutral-black text-sm mt-0.5">{{ orden.direccion }}</p>
            </div>
            <div v-if="orden.observaciones" class="border-t border-neutral-lightest mt-4 pt-4">
              <p class="text-xs text-neutral-medium">Observaciones del cliente</p>
              <p class="text-neutral-dark text-sm mt-0.5">{{ orden.observaciones }}</p>
            </div>
          </section>

          <!-- Productos e importes -->
          <section class="bg-white border border-neutral-light rounded-2xl p-5">
            <h2 class="flex items-center gap-2 font-bold text-corporate mb-4">
              <ShoppingCartIcon class="w-4 h-4 text-action" />
              Productos de la orden
            </h2>

            <ul class="flex flex-col gap-3.5">
              <li v-for="(linea, i) in orden.lineas" :key="i" class="flex items-start gap-3">
                <span
                  class="w-10 h-10 shrink-0 rounded-input bg-neutral-lightest grid place-items-center"
                  aria-hidden="true"
                >
                  <PackageIcon class="w-4 h-4 text-neutral-medium" />
                </span>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-neutral-black text-sm">{{ linea.producto }}</p>
                  <p class="text-neutral-medium text-xs mt-0.5">
                    {{ linea.variante }} · {{ linea.cantidad }} und. ×
                    {{ formatearCOP(linea.precio_aplicado) }}
                  </p>
                </div>
                <span class="shrink-0 font-semibold text-neutral-black text-sm tabular-nums">
                  {{ formatearCOP(Number(linea.precio_aplicado) * linea.cantidad) }}
                </span>
              </li>
            </ul>

            <dl class="border-t border-neutral-light mt-4 pt-4 grid gap-2 text-sm">
              <div class="flex justify-between text-neutral-dark">
                <dt>Subtotal</dt>
                <dd class="tabular-nums">{{ formatearCOP(orden.sub_total) }}</dd>
              </div>
              <div v-if="Number(orden.descuento) > 0" class="flex justify-between text-danger">
                <dt>Descuento</dt>
                <dd class="tabular-nums">− {{ formatearCOP(orden.descuento) }}</dd>
              </div>
              <div
                v-if="Number(orden.costo_entrega) > 0"
                class="flex justify-between text-neutral-dark"
              >
                <dt>Costo de entrega</dt>
                <dd class="tabular-nums">{{ formatearCOP(orden.costo_entrega) }}</dd>
              </div>
              <div
                v-if="orden.importe_iva"
                class="flex justify-between text-neutral-medium text-xs"
              >
                <dt>
                  IVA incluido
                  <span v-if="orden.tasa_iva">({{ Number(orden.tasa_iva) }} %)</span>
                </dt>
                <dd class="tabular-nums">{{ formatearCOP(orden.importe_iva) }}</dd>
              </div>
              <div
                class="flex justify-between items-center rounded-xl bg-conversion/10 px-4 py-3 mt-2"
              >
                <dt class="font-bold text-corporate">Total</dt>
                <dd class="font-bold text-conversion-hover text-lg tabular-nums">
                  {{ formatearCOP(orden.total) }} COP
                </dd>
              </div>
            </dl>
          </section>

          <!-- Historial con autor y motivo: esto el cliente NO lo ve -->
          <section class="bg-white border border-neutral-light rounded-2xl p-5">
            <h2 class="flex items-center gap-2 font-bold text-corporate mb-4">
              <HistoryIcon class="w-4 h-4 text-action" />
              Historial de estados
            </h2>

            <p v-if="!orden.historial.length" class="text-neutral-medium text-sm">
              Esta orden todavía no tiene cambios de estado registrados.
            </p>

            <ol v-else class="flex flex-col">
              <li
                v-for="(cambio, i) in historialReciente"
                :key="i"
                class="flex gap-3.5 pb-4 last:pb-0"
              >
                <div class="flex flex-col items-center shrink-0">
                  <span class="w-2.5 h-2.5 rounded-full bg-action mt-1.5" aria-hidden="true" />
                  <span
                    v-if="i < historialReciente.length - 1"
                    class="w-0.5 flex-1 bg-neutral-light mt-1"
                    aria-hidden="true"
                  />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-sm">
                    <span v-if="cambio.estado_anterior" class="text-neutral-medium">
                      {{ ESTADOS[cambio.estado_anterior].etiqueta }} →
                    </span>
                    <span class="font-semibold text-neutral-black">
                      {{ ESTADOS[cambio.estado_nuevo].etiqueta }}
                    </span>
                  </p>
                  <p class="text-neutral-medium text-xs mt-0.5">
                    {{ formatearFechaHora(cambio.fecha) }} ·
                    <!-- `autor` nulo significa que lo hizo el sistema, no una persona. -->
                    {{ cambio.autor || 'Sistema' }}
                  </p>
                  <p v-if="cambio.motivo" class="text-neutral-dark text-xs mt-1 italic">
                    «{{ cambio.motivo }}»
                  </p>
                </div>
              </li>
            </ol>
          </section>
        </div>

        <!-- ================= Columna lateral ================= -->
        <div class="flex flex-col gap-5 min-w-0">
          <!-- Contacto del titular (CA-ORD-09-01) -->
          <section class="bg-white border border-neutral-light rounded-2xl p-5">
            <h2 class="flex items-center gap-2 font-bold text-corporate mb-4">
              <UserIcon class="w-4 h-4 text-action" />
              Cliente
            </h2>
            <dl v-if="orden.cliente" class="grid gap-3 text-sm">
              <div>
                <dt class="text-neutral-medium text-xs">Nombre</dt>
                <dd class="text-neutral-black mt-0.5">{{ orden.cliente.nombre }}</dd>
              </div>
              <div>
                <dt class="text-neutral-medium text-xs">Correo</dt>
                <dd class="text-neutral-black mt-0.5 break-words">{{ orden.cliente.correo }}</dd>
              </div>
              <div v-if="orden.cliente.telefono">
                <dt class="text-neutral-medium text-xs">Teléfono</dt>
                <dd class="text-neutral-black mt-0.5">{{ orden.cliente.telefono }}</dd>
              </div>
            </dl>
            <p v-else class="text-neutral-medium text-sm">
              La cuenta del titular ya no existe.
            </p>
          </section>

          <!-- Notas internas (HU-ORD-10) -->
          <section class="bg-white border border-neutral-light rounded-2xl p-5">
            <h2 class="flex items-center gap-2 font-bold text-corporate mb-4">
              <StickyNoteIcon class="w-4 h-4 text-action" />
              Notas internas
            </h2>
            <p v-if="!orden.notas.length" class="text-neutral-medium text-sm">
              Sin notas registradas.
            </p>
            <ul v-else class="flex flex-col gap-3">
              <li
                v-for="(nota, i) in orden.notas"
                :key="i"
                class="rounded-xl bg-neutral-lightest px-3.5 py-3"
              >
                <p class="text-neutral-dark text-sm">{{ nota.texto }}</p>
                <p class="text-neutral-medium text-xs mt-1.5">
                  {{ nota.autor }} · {{ formatearFechaHora(nota.fecha) }}
                </p>
              </li>
            </ul>
          </section>

          <!-- Contactos con el cliente (CA-ORD-09-03) -->
          <section class="bg-white border border-neutral-light rounded-2xl p-5">
            <h2 class="flex items-center gap-2 font-bold text-corporate mb-4">
              <PhoneIcon class="w-4 h-4 text-action" />
              Contactos registrados
            </h2>
            <p v-if="!orden.contactos.length" class="text-neutral-medium text-sm">
              Todavía no se ha contactado al cliente desde esta orden.
            </p>
            <ul v-else class="flex flex-col gap-3">
              <li v-for="(contacto, i) in orden.contactos" :key="i" class="text-sm">
                <p class="font-semibold text-neutral-black capitalize">{{ contacto.medio }}</p>
                <p v-if="contacto.detalle" class="text-neutral-dark text-xs mt-0.5">
                  {{ contacto.detalle }}
                </p>
                <p class="text-neutral-medium text-xs mt-0.5">
                  {{ contacto.autor }} · {{ formatearFechaHora(contacto.fecha) }}
                </p>
              </li>
            </ul>
          </section>
        </div>
      </div>

      <ModalCambiarEstado
        v-model="modalAbierto"
        :codigo="orden.codigo"
        :estado-actual="orden.estado"
        :transiciones="orden.transiciones_permitidas"
        @cambiado="onCambiado"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
  ArrowLeft as ArrowLeftIcon,
  History as HistoryIcon,
  Package as PackageIcon,
  Phone as PhoneIcon,
  ShoppingCart as ShoppingCartIcon,
  StickyNote as StickyNoteIcon,
  User as UserIcon,
} from 'lucide-vue-next';
import { Alert, Button, PageHeader } from '@/core/components';
import ModalCambiarEstado from '../../components/admin/ModalCambiarEstado.vue';
import {
  ESTADOS,
  MODO_ENTREGA,
  formatearCOP,
  formatearFecha,
  formatearFechaHora,
} from '../../dtos/estado-pedido.dto';
import { OrdenesService } from '../../services/ordenes.service';
import type {
  DetalleOrdenGestion,
  ResultadoCambioEstado,
} from '../../interfaces/ordenes.interface';

/** El identificador de la URL es el código visible, nunca el id interno (ADR-04). */
const props = defineProps<{ codigo: string }>();

const orden = ref<DetalleOrdenGestion | null>(null);
const cargando = ref(false);
const noEncontrado = ref(false);
const sesionExpirada = ref(false);
const modalAbierto = ref(false);
const avisoExito = ref('');

const descripcionCabecera = computed(() =>
  orden.value ? 'Realizada el ' + formatearFecha(orden.value.fecha) : ''
);

/** El backend devuelve el historial en orden ascendente; aquí interesa lo último primero. */
const historialReciente = computed(() =>
  orden.value ? [...orden.value.historial].reverse() : []
);

async function cargar(): Promise<void> {
  cargando.value = true;
  noEncontrado.value = false;
  sesionExpirada.value = false;
  try {
    orden.value = await OrdenesService.detalleGestion(props.codigo);
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } };
    orden.value = null;
    // 401 es sesión caducada, NO un recurso inexistente: confundirlos haría creer
    // al personal que la orden desapareció. En cambio 403 y 404 sí se muestran
    // igual, para no confirmar la existencia del recurso (CA-SEG-03-06).
    sesionExpirada.value = err.response?.status === 401;
    noEncontrado.value = !sesionExpirada.value;
  } finally {
    cargando.value = false;
  }
}

/**
 * Tras el cambio se recarga el detalle completo en vez de parchear el objeto en
 * memoria: el historial y las transiciones permitidas los decide el servidor.
 */
function onCambiado(resultado: ResultadoCambioEstado): void {
  avisoExito.value =
    'La orden pasó a «' + ESTADOS[resultado.estado].etiqueta + '». El cliente fue notificado.';
  void cargar();
}

watch(() => props.codigo, () => void cargar());
onMounted(() => void cargar());
</script>
