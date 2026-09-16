<template>
  <div class="flex flex-col h-full gap-6">
    <!-- Header estandarizado con PageHeader -->
    <PageHeader
      title="Aprobación de Empresas"
      description="Revisa y dictamina las solicitudes de cuentas corporativas o ascensos."
    >
      <Button
        variant="outline"
        size="sm"
        :disabled="loading"
        @click="fetchSolicitudes"
      >
        <RefreshCwIcon class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
        Refrescar
      </Button>
    </PageHeader>

    <!-- Contenedor y Tabla estandarizada con Table.vue -->
    <section class="bg-neutral-white rounded-xl shadow-sm border border-neutral-light overflow-hidden flex-1">
      <Table
        mobile-cards
        :rows="solicitudes"
        :columns="columns"
        row-key="id_solicitud"
        caption="Solicitudes de Empresa"
        :loading="loading"
      >
        <!-- Estado vacío -->
        <template #empty>
          <div class="p-12 text-center flex flex-col items-center">
            <div class="w-16 h-16 bg-neutral-lightest rounded-full flex items-center justify-center mb-4 text-neutral-medium">
              <CheckCircleIcon class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-bold text-corporate">Todo al día</h3>
            <p class="text-neutral-medium mt-1">No hay solicitudes de empresa pendientes de aprobación.</p>
          </div>
        </template>

        <!-- Celda: Empresa / NIT -->
        <template #cell-empresa="{ row: sol }">
          <div>
            <div class="font-bold text-corporate">{{ sol.nombre_empresa }}</div>
            <div class="text-xs text-neutral-medium mt-0.5 font-mono">{{ sol.nit }}</div>
          </div>
        </template>

        <!-- Celda: Representante -->
        <template #cell-representante="{ row: sol }">
          <span class="text-corporate">{{ sol.nombre_representante }}</span>
        </template>

        <!-- Celda: Contacto -->
        <template #cell-contacto="{ row: sol }">
          <div>
            <div class="text-corporate">{{ sol.correo_empresarial }}</div>
            <div class="text-xs text-neutral-medium mt-0.5">{{ sol.telefono }}</div>
          </div>
        </template>

        <!-- Celda: Tipo (Badge oficial del Design System) -->
        <template #cell-tipo="{ row: sol }">
          <Badge
            :tone="sol.tipo_solicitud === 'registro' ? 'info' : 'warning'"
            :label="sol.tipo_solicitud === 'registro' ? 'Registro Nuevo' : 'Ascenso'"
            table
          />
        </template>

        <!-- Celda: Fecha -->
        <template #cell-fecha="{ row: sol }">
          <span class="text-neutral-medium">{{ formatearFecha(sol.fecha_solicitud) }}</span>
        </template>

        <!-- Celda: Acciones -->
        <template #cell-acciones="{ row: sol }">
          <div class="flex justify-end">
            <Button
              variant="subaction"
              size="sm"
              class="!text-action !font-semibold !text-xs !py-1.5 !px-3"
              @click="abrirRevision(sol)"
            >
              Revisar
            </Button>
          </div>
        </template>
      </Table>
    </section>

    <!-- Modal de Revisión -->
    <Modal v-model="modalAbierto" maxWidth="md" accent>
      <div v-if="solSeleccionada" class="flex flex-col h-full">
        <div class="flex items-start justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-corporate">Revisar Solicitud</h2>
            <p class="text-sm text-neutral-medium mt-1">Dictamina la solicitud de cuenta corporativa.</p>
          </div>
          <Badge
            :tone="solSeleccionada.tipo_solicitud === 'registro' ? 'info' : 'warning'"
            :label="solSeleccionada.tipo_solicitud === 'registro' ? 'Registro Nuevo' : 'Ascenso Particular'"
          />
        </div>

        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="col-span-2 bg-neutral-lightest p-4 rounded-lg">
            <p class="text-xs text-neutral-medium mb-1">Razón Social</p>
            <p class="font-bold text-corporate">{{ solSeleccionada.nombre_empresa }}</p>
          </div>
          <div class="bg-neutral-lightest p-4 rounded-lg">
            <p class="text-xs text-neutral-medium mb-1">NIT</p>
            <p class="font-bold text-corporate font-mono">{{ solSeleccionada.nit }}</p>
          </div>
          <div class="bg-neutral-lightest p-4 rounded-lg">
            <p class="text-xs text-neutral-medium mb-1">Representante Legal</p>
            <p class="font-bold text-corporate">{{ solSeleccionada.nombre_representante }}</p>
          </div>
          <div class="bg-neutral-lightest p-4 rounded-lg">
            <p class="text-xs text-neutral-medium mb-1">Correo Electrónico</p>
            <p class="font-bold text-corporate break-all">{{ solSeleccionada.correo_empresarial }}</p>
          </div>
          <div class="bg-neutral-lightest p-4 rounded-lg">
            <p class="text-xs text-neutral-medium mb-1">Teléfono</p>
            <p class="font-bold text-corporate">{{ solSeleccionada.telefono }}</p>
          </div>
        </div>

        <!-- Flujo de Rechazo -->
        <div v-if="mostrandoMotivoRechazo" class="mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <label class="block text-sm font-semibold text-corporate mb-2">Motivo del rechazo <span class="text-danger">*</span></label>
          <p class="text-xs text-neutral-medium mb-3">Este motivo será enviado a la empresa por correo electrónico.</p>
          <textarea 
            v-model="motivoRechazo" 
            class="w-full rounded-lg border-2 border-neutral-light focus:border-action focus:ring-0 resize-none p-3 text-sm text-corporate placeholder:text-neutral-medium/50 bg-neutral-white"
            rows="3" 
            placeholder="Ej: El NIT proporcionado no es válido o no corresponde a la razón social."
          ></textarea>
        </div>

        <div v-if="errorMensaje" class="mb-4 p-3 bg-danger-subtle text-danger rounded-lg text-sm flex items-start gap-2">
          <AlertCircleIcon class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ errorMensaje }}</span>
        </div>

        <!-- Botones de Acción estandarizados con Button.vue -->
        <div class="mt-auto pt-4 border-t border-neutral-light flex gap-3 justify-end">
          <template v-if="mostrandoMotivoRechazo">
            <Button
              variant="outline"
              size="sm"
              :disabled="procesando"
              @click="cancelarRechazo"
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              size="sm"
              :disabled="procesando || !motivoRechazo.trim()"
              @click="confirmarRechazo"
            >
              <RefreshCwIcon v-if="procesando" class="w-4 h-4 mr-1.5 animate-spin" />
              Confirmar Rechazo
            </Button>
          </template>
          <template v-else>
            <Button
              variant="outline"
              size="sm"
              class="!text-danger !border-danger/30 hover:!bg-danger-subtle hover:!border-danger"
              :disabled="procesando"
              @click="iniciarRechazo"
            >
              Rechazar Solicitud
            </Button>
            <Button
              variant="corporate"
              size="sm"
              :disabled="procesando"
              @click="aprobarSolicitud"
            >
              <RefreshCwIcon v-if="procesando" class="w-4 h-4 mr-1.5 animate-spin" />
              Aprobar Empresa
            </Button>
          </template>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  RefreshCw as RefreshCwIcon,
  CheckCircle as CheckCircleIcon,
  AlertCircle as AlertCircleIcon
} from 'lucide-vue-next';
import {
  PageHeader,
  Table,
  Badge,
  Button,
  Modal,
  type TableColumn,
} from '@/core/components';
import { CuentasService } from '@/modules/m04-cuentas/services/cuentas.service';
import type { SolicitudEmpresa } from '@/modules/m04-cuentas/interfaces/admin.interface';

const loading = ref(false);
const solicitudes = ref<SolicitudEmpresa[]>([]);

const columns = computed<TableColumn[]>(() => [
  { key: 'empresa', label: 'Empresa / NIT' },
  { key: 'representante', label: 'Representante' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
]);

const modalAbierto = ref(false);
const solSeleccionada = ref<SolicitudEmpresa | null>(null);

const mostrandoMotivoRechazo = ref(false);
const motivoRechazo = ref('');
const procesando = ref(false);
const errorMensaje = ref('');

const fetchSolicitudes = async () => {
  try {
    loading.value = true;
    errorMensaje.value = '';
    const res = await CuentasService.listarSolicitudesEmpresa();
    if (res.success) {
      solicitudes.value = res.data;
    }
  } catch (error: unknown) {
    console.error('Error fetching solicitudes:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSolicitudes();
});

const formatearFecha = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const abrirRevision = (sol: SolicitudEmpresa) => {
  solSeleccionada.value = sol;
  mostrandoMotivoRechazo.value = false;
  motivoRechazo.value = '';
  errorMensaje.value = '';
  modalAbierto.value = true;
};

const iniciarRechazo = () => {
  mostrandoMotivoRechazo.value = true;
  errorMensaje.value = '';
};

const cancelarRechazo = () => {
  mostrandoMotivoRechazo.value = false;
  motivoRechazo.value = '';
  errorMensaje.value = '';
};

const dictaminar = async (decision: 'aprobar' | 'rechazar') => {
  if (!solSeleccionada.value) return;

  if (decision === 'rechazar' && !motivoRechazo.value.trim()) {
    errorMensaje.value = 'Debes ingresar un motivo de rechazo.';
    return;
  }

  try {
    procesando.value = true;
    errorMensaje.value = '';
    const res = await CuentasService.dictaminarSolicitudEmpresa(
      solSeleccionada.value.id_solicitud,
      {
        decision,
        motivoRechazo: decision === 'rechazar' ? motivoRechazo.value.trim() : null,
      },
    );

    if (res.success) {
      modalAbierto.value = false;
      await fetchSolicitudes();
    }
  } catch (error: unknown) {
    const err = error as {
      response?: { data?: { error?: { message?: string } } };
    };
    errorMensaje.value =
      err.response?.data?.error?.message ||
      'Ocurrió un error al procesar la solicitud.';
  } finally {
    procesando.value = false;
  }
};

const aprobarSolicitud = () => dictaminar('aprobar');
const confirmarRechazo = () => dictaminar('rechazar');
</script>
