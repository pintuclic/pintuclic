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
              variant="outline"
              size="sm"
              class="gap-1.5 !text-xs !py-1.5 !px-3 font-medium"
              @click="abrirRevision(sol)"
            >
              <EyeIcon class="w-3.5 h-3.5 shrink-0" />
              <span>Revisar</span>
            </Button>
          </div>
        </template>
      </Table>
    </section>

    <!-- Modal de Revisión -->
    <Modal v-model="modalAbierto" maxWidth="md" accent @close="cerrarModal">
      <div v-if="solSeleccionada" class="flex flex-col h-full">
        <!-- Encabezado del Modal (según Imagen 1) -->
        <div class="mb-5">
          <h2 class="text-2xl font-bold font-title text-corporate">Revisar Solicitud</h2>
          <p class="text-sm text-neutral-medium mt-1">Dictamina la solicitud de cuenta corporativa.</p>
        </div>

        <!-- Tarjetas de Información Verticales (según Imagen 1) -->
        <div class="flex flex-col gap-3 mb-6">
          <!-- 1. Razón Social (Fondo suave destacado) -->
          <div class="bg-[#F0F6FC] rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 transition-colors">
            <div class="w-11 h-11 rounded-xl bg-subaction/70 text-action flex items-center justify-center shrink-0">
              <BuildingIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium font-normal mb-0.5">Razón Social</p>
              <p class="text-sm sm:text-base font-bold text-corporate truncate">{{ solSeleccionada.nombre_empresa }}</p>
            </div>
          </div>

          <!-- 2. NIT -->
          <div class="bg-neutral-white border border-neutral-light/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 transition-colors">
            <div class="w-11 h-11 rounded-xl bg-subaction/40 text-action flex items-center justify-center shrink-0">
              <IdCardIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium font-normal mb-0.5">NIT</p>
              <p class="text-sm sm:text-base font-bold text-corporate font-mono">{{ solSeleccionada.nit }}</p>
            </div>
          </div>

          <!-- 3. Representante Legal -->
          <div class="bg-neutral-white border border-neutral-light/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 transition-colors">
            <div class="w-11 h-11 rounded-xl bg-subaction/40 text-action flex items-center justify-center shrink-0">
              <UserIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium font-normal mb-0.5">Representante Legal</p>
              <p class="text-sm sm:text-base font-bold text-corporate truncate">{{ solSeleccionada.nombre_representante }}</p>
            </div>
          </div>

          <!-- 4. Correo Electrónico -->
          <div class="bg-neutral-white border border-neutral-light/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 transition-colors">
            <div class="w-11 h-11 rounded-xl bg-subaction/40 text-action flex items-center justify-center shrink-0">
              <MailIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium font-normal mb-0.5">Correo Electrónico</p>
              <p class="text-sm sm:text-base font-bold text-corporate break-all">{{ solSeleccionada.correo_empresarial }}</p>
            </div>
          </div>

          <!-- 5. Teléfono -->
          <div class="bg-neutral-white border border-neutral-light/80 rounded-2xl p-3.5 sm:p-4 flex items-center gap-3.5 transition-colors">
            <div class="w-11 h-11 rounded-xl bg-subaction/40 text-action flex items-center justify-center shrink-0">
              <PhoneIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium font-normal mb-0.5">Teléfono</p>
              <p class="text-sm sm:text-base font-bold text-corporate">{{ solSeleccionada.telefono }}</p>
            </div>
          </div>
        </div>

        <!-- Flujo de Rechazo -->
        <div v-if="mostrandoMotivoRechazo" class="mb-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <label class="block text-sm font-semibold text-corporate mb-2">Motivo del rechazo <span class="text-danger">*</span></label>
          <p class="text-xs text-neutral-medium mb-3">Este motivo será enviado a la empresa por correo electrónico.</p>
          <textarea 
            v-model="motivoRechazo" 
            class="w-full rounded-xl border-2 border-neutral-light focus:border-action focus:ring-0 resize-none p-3 text-sm text-corporate placeholder:text-neutral-medium/50 bg-neutral-white"
            rows="3" 
            placeholder="Ej: El NIT proporcionado no es válido o no corresponde a la razón social."
          ></textarea>
        </div>

        <div v-if="errorMensaje" class="mb-4 p-3 bg-danger-subtle text-danger rounded-xl text-sm flex items-start gap-2">
          <AlertCircleIcon class="w-4 h-4 mt-0.5 shrink-0" />
          <span>{{ errorMensaje }}</span>
        </div>

        <!-- Botones de Acción simétricos en 2 columnas (según Imagen 1) -->
        <div class="mt-auto pt-4 border-t border-neutral-light">
          <template v-if="mostrandoMotivoRechazo">
            <div class="grid grid-cols-2 gap-3">
              <Button
                variant="neutral"
                size="md"
                class="w-full !rounded-xl justify-center font-semibold"
                :disabled="procesando"
                @click="cancelarRechazo"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="md"
                class="w-full !rounded-xl justify-center font-semibold"
                :disabled="procesando || !motivoRechazo.trim()"
                @click="confirmarRechazo"
              >
                <RefreshCwIcon v-if="procesando" class="w-4 h-4 mr-1.5 animate-spin" />
                Confirmar Rechazo
              </Button>
            </div>
          </template>
          <template v-else>
            <div class="grid grid-cols-2 gap-3">
              <Button
                variant="danger-outline"
                size="md"
                class="w-full !rounded-xl justify-center font-semibold"
                :disabled="procesando"
                @click="iniciarRechazo"
              >
                <XIcon class="w-4 h-4 mr-1.5 shrink-0" />
                <span>Rechazar Solicitud</span>
              </Button>
              <Button
                variant="corporate"
                size="md"
                class="w-full !rounded-xl justify-center font-semibold"
                :disabled="procesando"
                @click="aprobarSolicitud"
              >
                <RefreshCwIcon v-if="procesando" class="w-4 h-4 mr-1.5 animate-spin" />
                <CheckIcon v-else class="w-4 h-4 mr-1.5 shrink-0" />
                <span>Aprobar Empresa</span>
              </Button>
            </div>
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
  AlertCircle as AlertCircleIcon,
  Eye as EyeIcon,
  Building2 as BuildingIcon,
  IdCard as IdCardIcon,
  User as UserIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Check as CheckIcon,
  X as XIcon,
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

const cerrarModal = () => {
  modalAbierto.value = false;
  solSeleccionada.value = null;
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
