<template>
  <!--
    HU-ORD-01 / HU-ORD-03 / HU-ORD-05 · «Gestión de órdenes»
    Bandeja del personal.

    Sigue el lenguaje de los paneles ya aprobados: tarjetas de resumen con su icono
    en caja de color, y un único panel que agrupa filtros y listado, igual que
    «Gestión de empleados» (M17) y «Productos» (M01). El backend filtra, ordena y
    pagina: aquí no se recorta nada en cliente.
  -->
  <div>
    <PageHeader
      title="Gestión de órdenes"
      description="Consulte y haga avanzar las órdenes de venta por su ciclo de estados."
    >
      <Button variant="outline" :disabled="cargando" @click="refrescar">
        <RefreshIcon class="w-4 h-4 mr-2" />
        Refrescar
      </Button>
    </PageHeader>

    <!--
      Resumen por estado. Informa y filtra a la vez: pulsar una tarjeta aplica ese
      estado al listado. Los contadores llegan de GET /gestion/resumen, que incluye
      también los estados en cero (CA-ORD-05-05).
    -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <button
        v-for="t in TARJETAS"
        :key="t.estado || 'todas'"
        type="button"
        class="flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-left transition-all"
        :class="
          filtros.estado === t.estado
            ? 'border-action shadow-sm'
            : 'border-neutral-light hover:border-action'
        "
        :aria-pressed="filtros.estado === t.estado"
        @click="filtrarPorEstado(t.estado)"
      >
        <span class="w-11 h-11 shrink-0 rounded-xl grid place-items-center" :class="t.fondo">
          <component :is="t.icono" class="w-5 h-5" :class="t.tinte" />
        </span>
        <span class="min-w-0">
          <span class="block text-sm text-neutral-medium truncate">{{ t.etiqueta }}</span>
          <span
            class="block font-title font-bold text-2xl text-corporate tabular-nums leading-tight"
          >
            {{ contador(t.estado) }}
          </span>
        </span>
      </button>
    </div>

    <Alert v-if="error" variant="danger" class="mb-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span>{{ error }}</span>
        <!-- 401 y 403 no se arreglan reintentando; un fallo del servidor o de red, sí. -->
        <Button v-if="errorReintentable" variant="outline" size="sm" :disabled="cargando" @click="refrescar">
          Reintentar
        </Button>
      </div>
    </Alert>

    <!-- Un solo panel: filtros arriba, listado debajo, separados por una línea. -->
    <div class="bg-white border border-neutral-light rounded-2xl overflow-hidden">
      <div class="p-5">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Input
            v-model="filtros.codigo"
            label="Código de la orden"
            placeholder="PC-2026-00101"
            @keyup.enter="buscar"
          />
          <Input
            v-model="contacto"
            label="Correo o teléfono del cliente"
            placeholder="cliente@correo.com · 3001234567"
            @keyup.enter="buscar"
          />
          <Input v-model="filtros.desde" type="date" label="Desde" />
          <Input v-model="filtros.hasta" type="date" label="Hasta" />
        </div>

        <div class="flex flex-wrap items-end justify-between gap-4 mt-4">
          <div class="grid gap-4 sm:grid-cols-2 flex-1 min-w-0 max-w-xl">
            <Select v-model="filtros.estado" label="Estado">
              <option value="">Todos los estados</option>
              <option v-for="estado in TODOS_LOS_ESTADOS" :key="estado" :value="estado">
                {{ ESTADOS[estado].etiqueta }}
              </option>
            </Select>
            <Select v-model="filtros.orden" label="Ordenar por">
              <option value="recientes">Más recientes primero</option>
              <option value="antiguedad">Más antiguas primero</option>
            </Select>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <span v-if="total > 0" class="text-sm text-neutral-medium tabular-nums">
              {{ total }} {{ total === 1 ? 'registro' : 'registros' }}
            </span>
            <Button variant="outline" @click="limpiar">Limpiar</Button>
            <Button variant="primary" @click="buscar">Aplicar filtros</Button>
          </div>
        </div>
      </div>

      <div class="border-t border-neutral-light">
        <Table
          :columns="COLUMNAS"
          :rows="ordenes"
          row-key="codigo"
          :loading="cargando"
          mobile-cards
          caption="Órdenes de venta"
        >
          <template #empty>
            <div class="px-6 py-16 text-center">
              <ClipboardIcon class="w-10 h-10 text-neutral-medium mx-auto mb-3" />
              <p class="font-title font-bold text-neutral-black">Ninguna orden coincide</p>
              <p class="text-neutral-medium text-sm mt-1">
                Prueba con otros filtros o límpialos para ver todas.
              </p>
            </div>
          </template>

          <template #cell-codigo="{ row }">
            <RouterLink
              :to="{ name: 'AdminDetalleOrden', params: { codigo: row.codigo } }"
              class="block font-semibold text-action hover:underline whitespace-nowrap"
            >
              {{ row.codigo }}
            </RouterLink>
            <span class="block text-xs text-neutral-medium tabular-nums whitespace-nowrap mt-0.5">
              {{ formatearFechaCorta(row.fecha) }}
            </span>
          </template>

          <template #cell-cliente="{ row }">
            <span class="block text-neutral-dark">{{ row.cliente || 'Cuenta eliminada' }}</span>
            <span class="block text-xs text-neutral-medium mt-0.5">
              {{ row.modo_entrega ? MODO_ENTREGA[row.modo_entrega] : '—' }}
            </span>
          </template>

          <template #cell-estado="{ row }">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="ESTADOS[row.estado].clases"
            >
              {{ ESTADOS[row.estado].etiqueta }}
            </span>
          </template>

          <!--
            Días parados (CA-ORD-05-07): deja ver de un vistazo qué órdenes llevan
            demasiado tiempo sin moverse. El umbral de color es decisión de la vista.
          -->
          <template #cell-dias_esperando="{ row }">
            <span
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums"
              :class="
                row.dias_esperando >= 5
                  ? 'bg-danger-subtle text-danger'
                  : row.dias_esperando >= 3
                    ? 'bg-highlight/20 text-corporate'
                    : 'bg-neutral-lightest text-neutral-medium'
              "
            >
              {{ row.dias_esperando }} {{ row.dias_esperando === 1 ? 'día' : 'días' }}
            </span>
          </template>

          <template #cell-total="{ row }">
            <span class="font-semibold tabular-nums whitespace-nowrap">
              {{ formatearCOP(row.total) }}
            </span>
          </template>

          <template #cell-acciones="{ row }">
            <RouterLink
              :to="{ name: 'AdminDetalleOrden', params: { codigo: row.codigo } }"
              class="inline-flex items-center gap-1.5 rounded-button border border-action px-3 py-1.5 text-xs font-medium text-action transition-colors hover:bg-subaction whitespace-nowrap"
            >
              <EyeIcon class="w-3.5 h-3.5" />
              Revisar
            </RouterLink>
          </template>
        </Table>
      </div>

      <div
        v-if="total > limite"
        class="border-t border-neutral-light px-5 py-4 flex justify-center"
      >
        <Paginacion v-model="pagina" :total="total" :page-size="limite" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import {
  ClipboardList as ClipboardIcon,
  Eye as EyeIcon,
  RefreshCw as RefreshIcon,
  Hourglass as RevisionIcon,
  PackageCheck as PreparacionIcon,
  Truck as DespachoIcon,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import { Alert, Button, Input, Paginacion, PageHeader, Select, Table } from '@/core/components';
import type { TableColumn } from '@/core/components';
import { ESTADOS, MODO_ENTREGA, formatearCOP, formatearFechaCorta } from '../../dtos/estado-pedido.dto';
import { OrdenesService } from '../../services/ordenes.service';
import { clasificarErrorCarga } from '../../composables/clasificarErrorCarga';
import type {
  EstadoOrden,
  FiltrosGestion,
  ResumenEstadosOrdenes,
  ResumenOrdenGestion,
} from '../../interfaces/ordenes.interface';

/**
 * Tarjetas de resumen. Se eligen los estados que normalmente esperan una acción del
 * personal; el resto siguen disponibles en el desplegable de filtro.
 */
interface Tarjeta {
  readonly estado: EstadoOrden | '';
  readonly etiqueta: string;
  readonly icono: Component;
  readonly fondo: string;
  readonly tinte: string;
}

const TARJETAS: readonly Tarjeta[] = [
  { estado: '', etiqueta: 'Todas las órdenes', icono: ClipboardIcon, fondo: 'bg-subaction', tinte: 'text-action' },
  { estado: 'orden_confirmada', etiqueta: 'Por revisar', icono: RevisionIcon, fondo: 'bg-highlight/20', tinte: 'text-corporate' },
  { estado: 'en_preparacion', etiqueta: 'En preparación', icono: PreparacionIcon, fondo: 'bg-subaction', tinte: 'text-action' },
  { estado: 'despachado', etiqueta: 'Despachadas', icono: DespachoIcon, fondo: 'bg-conversion/15', tinte: 'text-conversion-hover' },
];

/** Los ocho estados del enum, para el desplegable de filtro. */
const TODOS_LOS_ESTADOS = Object.keys(ESTADOS) as EstadoOrden[];

/**
 * Seis columnas, no ocho. Con la barra lateral del panel, ocho columnas obligaban a
 * desplazar la tabla en horizontal para ver el total y las acciones. La fecha se
 * apila bajo el código y la forma de entrega bajo el cliente: misma información,
 * sin scroll.
 */
const COLUMNAS: TableColumn[] = [
  { key: 'codigo', label: 'Orden' },
  { key: 'cliente', label: 'Cliente' },
  { key: 'estado', label: 'Estado' },
  { key: 'dias_esperando', label: 'Parada', align: 'center' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'acciones', label: '', align: 'right' },
];

const LIMITE = 10;

const ordenes = ref<ResumenOrdenGestion[]>([]);
const resumen = ref<ResumenEstadosOrdenes | null>(null);
const total = ref(0);
const pagina = ref(1);
const limite = ref(LIMITE);
const cargando = ref(false);
const error = ref('');
/** Solo un fallo del servidor o de red se resuelve reintentando (no un 401/403). */
const errorReintentable = ref(false);

/**
 * Campo único para el contacto del cliente. Si contiene «@» se envía como correo;
 * en caso contrario, como teléfono. El backend valida cada uno por separado.
 */
const contacto = ref('');

const filtros = reactive<FiltrosGestion>({
  codigo: '',
  estado: '',
  desde: '',
  hasta: '',
  orden: 'recientes',
});

async function cargar(): Promise<void> {
  cargando.value = true;
  error.value = '';
  errorReintentable.value = false;
  try {
    const texto = contacto.value.trim();
    const resultado = await OrdenesService.listarGestion({
      ...filtros,
      correo: texto.includes('@') ? texto : undefined,
      telefono: texto !== '' && !texto.includes('@') ? texto : undefined,
      pagina: pagina.value,
      limite: LIMITE,
    });
    ordenes.value = [...resultado.items];
    total.value = resultado.total;
    limite.value = resultado.limite;
  } catch (e: unknown) {
    const err = e as { response?: { status?: number; data?: { error?: { message?: string } } } };
    errorReintentable.value = clasificarErrorCarga(e) === 'servidor';
    error.value =
      err.response?.status === 401
        ? 'Tu sesión expiró. Vuelve a iniciar sesión para consultar las órdenes.'
        : err.response?.status === 403
          ? 'Tu cuenta no tiene el permiso «ventas.ver» para consultar las órdenes.'
          : (err.response?.data?.error?.message ?? 'No se pudieron cargar las órdenes.');
    ordenes.value = [];
    total.value = 0;
  } finally {
    cargando.value = false;
  }
}

/** Valor de una tarjeta; «—» mientras el resumen no haya llegado. */
function contador(estado: EstadoOrden | ''): string {
  if (!resumen.value) return '—';
  return String(estado === '' ? resumen.value.total : resumen.value.por_estado[estado]);
}

function refrescar(): void {
  void cargar();
  void cargarResumen();
}

async function cargarResumen(): Promise<void> {
  try {
    resumen.value = await OrdenesService.resumenEstados();
  } catch {
    // Los contadores son un apoyo: si fallan, el listado sigue siendo utilizable.
    resumen.value = null;
  }
}

/** Todo filtro nuevo vuelve a la primera página; si no, se pediría una página vacía. */
function buscar(): void {
  pagina.value = 1;
  void cargar();
}

function filtrarPorEstado(estado: EstadoOrden | ''): void {
  filtros.estado = estado;
  buscar();
}

function limpiar(): void {
  contacto.value = '';
  filtros.codigo = '';
  filtros.estado = '';
  filtros.desde = '';
  filtros.hasta = '';
  filtros.orden = 'recientes';
  buscar();
}

watch(pagina, () => void cargar());

onMounted(() => {
  void cargar();
  void cargarResumen();
});
</script>
