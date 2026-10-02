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
                      {{ linea.variante }}
                      <template v-if="linea.color_solicitado">
                        · Color: {{ linea.color_solicitado }}
                      </template>
                      · {{ linea.cantidad }} und. × {{ formatearCOP(linea.precio_aplicado) }}
                    </p>

                    <!--
                      El entonado y la base consumida son datos de taller: solo el personal
                      los necesita (RF-ORD-09-01).
                    -->
                    <span
                      v-if="linea.es_entonado"
                      class="inline-flex items-center rounded-full bg-highlight/20 px-2 py-0.5 text-[11px] font-semibold text-corporate mt-1"
                    >
                      Entonado<template v-if="linea.base_consumida">
                        · base {{ linea.base_consumida }}</template>
                    </span>

                    <p v-if="linea.retirado" class="text-danger text-xs mt-1">
                      Retirado del catálogo.
                    </p>

                    <!-- Desglose de descuentos de la línea (RF-ORD-02-02). -->
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
                  <span class="shrink-0 text-right">
                    <span
                      v-if="linea.precio_inicial && linea.descuentos.length"
                      class="block text-neutral-medium text-xs line-through tabular-nums"
                    >
                      {{ formatearCOP(Number(linea.precio_inicial) * linea.cantidad) }}
                    </span>
                    <span class="block font-semibold text-neutral-black text-sm tabular-nums">
                      {{ formatearCOP(Number(linea.precio_aplicado) * linea.cantidad) }}
                    </span>
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

          <!--
            Compras anteriores del titular (HU-ORD-11). Se carga bajo demanda: en la
            mayoría de consultas basta con la orden que se está atendiendo, y así no se
            pide al servidor algo que nadie va a mirar.
          -->
          <section class="bg-white border border-neutral-light rounded-2xl p-5">
            <h2 class="flex items-center gap-2 font-bold text-corporate mb-4">
              <HistoryIcon class="w-4 h-4 text-action" />
              Compras anteriores
            </h2>

            <Button
              v-if="historial === null"
              variant="outline"
              :disabled="cargandoHistorial"
              @click="verHistorial(1)"
            >
              {{ cargandoHistorial ? 'Consultando…' : 'Ver compras anteriores' }}
            </Button>

            <p v-else-if="errorHistorial" class="text-neutral-medium text-sm">
              {{ errorHistorial }}
            </p>

            <p v-else-if="!historial.items.length" class="text-neutral-medium text-sm">
              Este cliente no tiene otros pedidos.
            </p>

            <div v-else class="flex flex-col gap-3">
              <p class="text-neutral-medium text-xs">
                {{ historial.total }}
                {{ historial.total === 1 ? 'pedido más' : 'pedidos más' }} de este cliente,
                sin contar el actual.
              </p>
              <ul class="flex flex-col gap-2">
                <li v-for="o in historial.items" :key="o.codigo">
                  <RouterLink
                    :to="{ name: 'AdminDetalleOrden', params: { codigo: o.codigo } }"
                    class="flex items-center justify-between gap-3 rounded-xl border border-neutral-light px-3.5 py-2.5 transition-colors hover:border-action"
                  >
                    <span class="min-w-0">
                      <span class="block font-semibold text-action text-sm truncate">
                        {{ o.codigo }}
                      </span>
                      <span class="block text-neutral-medium text-xs tabular-nums">
                        {{ formatearFechaCorta(o.fecha) }}
                      </span>
                    </span>
                    <span class="shrink-0 text-right">
                      <span class="block font-semibold text-neutral-black text-sm tabular-nums">
                        {{ formatearCOP(o.total) }}
                      </span>
                      <span
                        class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold mt-0.5"
                        :class="ESTADOS[o.estado].clases"
                      >
                        {{ ESTADOS[o.estado].etiqueta }}
                      </span>
                    </span>
                  </RouterLink>
                </li>
              </ul>
              <Button
                v-if="historial.total_paginas > historial.pagina"
                variant="outline"
                :disabled="cargandoHistorial"
                @click="verHistorial(historial.pagina + 1)"
              >
                {{ cargandoHistorial ? 'Consultando…' : 'Ver más' }}
              </Button>
            </div>
          </section>

          <!-- Notas internas (HU-ORD-10) -->
          <section class="bg-white border border-neutral-light rounded-2xl p-5">
            <h2 class="flex items-center gap-2 font-bold text-corporate mb-4">
              <StickyNoteIcon class="w-4 h-4 text-action" />
              Notas internas
            </h2>

            <p v-if="!orden.notas.length" class="text-neutral-medium text-sm mb-4">
              Sin notas registradas.
            </p>
            <ul v-else class="flex flex-col gap-3 mb-4">
              <li
                v-for="(nota, i) in orden.notas"
                :key="i"
                class="rounded-xl bg-neutral-lightest px-3.5 py-3"
              >
                <p class="text-neutral-dark text-sm whitespace-pre-line">{{ nota.texto }}</p>
                <p class="text-neutral-medium text-xs mt-1.5">
                  {{ nota.autor }} · {{ formatearFechaHora(nota.fecha) }}
                </p>
              </li>
            </ul>

            <!--
              Una nota no se puede editar ni borrar después (CA-ORD-10-03), así que el
              texto de ayuda lo advierte antes de guardar.
            -->
            <div class="border-t border-neutral-lightest pt-4 flex flex-col gap-2">
              <Textarea
                v-model="textoNota"
                label="Añadir una nota"
                rows="3"
                :maxlength="LIMITE_NOTA"
                placeholder="Qué pasó con este pedido…"
                :error="errorNota"
              />
              <div class="flex items-center justify-between gap-3 flex-wrap">
                <span class="text-xs text-neutral-medium">
                  Queda registrada con tu nombre y no se puede modificar después.
                </span>
                <Button variant="primary" :disabled="guardandoNota" @click="guardarNota">
                  {{ guardandoNota ? 'Guardando…' : 'Guardar nota' }}
                </Button>
              </div>
            </div>
          </section>

          <!-- Contactos con el cliente (CA-ORD-09-03) -->
          <section class="bg-white border border-neutral-light rounded-2xl p-5">
            <h2 class="flex items-center gap-2 font-bold text-corporate mb-4">
              <PhoneIcon class="w-4 h-4 text-action" />
              Contactos registrados
            </h2>

            <p v-if="!orden.contactos.length" class="text-neutral-medium text-sm mb-4">
              Todavía no se ha contactado al cliente desde esta orden.
            </p>
            <ul v-else class="flex flex-col gap-3 mb-4">
              <li v-for="(contacto, i) in orden.contactos" :key="i" class="text-sm">
                <p class="font-semibold text-neutral-black">
                  {{ ETIQUETA_MEDIO[contacto.medio as MedioContacto] ?? contacto.medio }}
                </p>
                <p v-if="contacto.detalle" class="text-neutral-dark text-xs mt-0.5">
                  {{ contacto.detalle }}
                </p>
                <p class="text-neutral-medium text-xs mt-0.5">
                  {{ contacto.autor }} · {{ formatearFechaHora(contacto.fecha) }}
                </p>
              </li>
            </ul>

            <div class="border-t border-neutral-lightest pt-4 flex flex-col gap-3">
              <Select v-model="medioContacto" label="Registrar un contacto">
                <option v-for="m in MEDIOS_CONTACTO" :key="m" :value="m">
                  {{ ETIQUETA_MEDIO[m] }}
                </option>
              </Select>
              <Input
                v-model="detalleContacto"
                label="Detalle (opcional)"
                :maxlength="LIMITE_DETALLE"
                placeholder="Qué se le dijo al cliente…"
                :error="errorContacto"
              />
              <div class="flex justify-end">
                <Button variant="primary" :disabled="guardandoContacto" @click="guardarContacto">
                  {{ guardandoContacto ? 'Registrando…' : 'Registrar contacto' }}
                </Button>
              </div>
            </div>
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
import { Alert, Button, Input, PageHeader, Select, Textarea } from '@/core/components';
import ModalCambiarEstado from '../../components/admin/ModalCambiarEstado.vue';
import {
  ContactoDto,
  ETIQUETA_MEDIO,
  LIMITE_DETALLE,
  LIMITE_NOTA,
  MEDIOS_CONTACTO,
  NotaInternaDto,
} from '../../dtos/nota-contacto.dto';
import {
  ESTADOS,
  MODO_ENTREGA,
  formatearCOP,
  formatearFecha,
  formatearFechaCorta,
  formatearFechaHora,
} from '../../dtos/estado-pedido.dto';
import { OrdenesService } from '../../services/ordenes.service';
import type {
  DetalleOrdenGestion,
  MedioContacto,
  PaginaOrdenesGestion,
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

// --- Compras anteriores del cliente (HU-ORD-11) ---
const historial = ref<PaginaOrdenesGestion | null>(null);
const cargandoHistorial = ref(false);
const errorHistorial = ref('');

/**
 * Se consulta solo cuando el personal lo pide. El endpoint excluye la orden actual, así
 * que lo que llega son estrictamente los demás pedidos del titular.
 */
async function verHistorial(pagina: number = 1): Promise<void> {
  // Un @click sin argumentos entregaría el evento del ratón; se descarta por si acaso.
  const n = Number.isInteger(pagina) && pagina > 0 ? pagina : 1;
  cargandoHistorial.value = true;
  errorHistorial.value = '';
  try {
    historial.value = await OrdenesService.historialCliente(props.codigo, n);
  } catch (e: unknown) {
    historial.value = { items: [], total: 0, pagina: 1, limite: 5, total_paginas: 0 };
    errorHistorial.value = mensajeDeError(e, 'No se pudieron consultar las compras anteriores.');
  } finally {
    cargandoHistorial.value = false;
  }
}

// --- Nota interna (HU-ORD-10) ---
const textoNota = ref('');
const errorNota = ref('');
const guardandoNota = ref(false);

// --- Contacto con el cliente (CA-ORD-09-03) ---
const medioContacto = ref<MedioContacto>('telefono');
const detalleContacto = ref('');
const errorContacto = ref('');
const guardandoContacto = ref(false);

/** Mensaje del servidor si lo hay; si no, uno genérico con el contexto. */
function mensajeDeError(e: unknown, porDefecto: string): string {
  const err = e as { response?: { status?: number; data?: { error?: { message?: string } } } };
  if (err.response?.status === 403) {
    return 'Tu cuenta no tiene el permiso «ventas.gestionar» para esta acción.';
  }
  return err.response?.data?.error?.message ?? porDefecto;
}

async function guardarNota(): Promise<void> {
  errorNota.value = '';
  const validacion = NotaInternaDto.safeParse({ texto: textoNota.value });
  if (!validacion.success) {
    errorNota.value = validacion.error.issues[0]?.message ?? 'Revisa el texto.';
    return;
  }
  guardandoNota.value = true;
  try {
    await OrdenesService.crearNota(props.codigo, textoNota.value);
    textoNota.value = '';
    avisoExito.value = 'Nota guardada.';
    await cargar();
  } catch (e: unknown) {
    errorNota.value = mensajeDeError(e, 'No se pudo guardar la nota.');
  } finally {
    guardandoNota.value = false;
  }
}

async function guardarContacto(): Promise<void> {
  errorContacto.value = '';
  const validacion = ContactoDto.safeParse({
    medio: medioContacto.value,
    detalle: detalleContacto.value,
  });
  if (!validacion.success) {
    errorContacto.value = validacion.error.issues[0]?.message ?? 'Revisa los datos.';
    return;
  }
  guardandoContacto.value = true;
  try {
    await OrdenesService.registrarContacto(props.codigo, medioContacto.value, detalleContacto.value);
    detalleContacto.value = '';
    avisoExito.value = 'Contacto registrado.';
    await cargar();
  } catch (e: unknown) {
    errorContacto.value = mensajeDeError(e, 'No se pudo registrar el contacto.');
  } finally {
    guardandoContacto.value = false;
  }
}

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

watch(() => props.codigo, () => {
  historial.value = null;
  errorHistorial.value = '';
  void cargar();
});
onMounted(() => void cargar());
</script>
