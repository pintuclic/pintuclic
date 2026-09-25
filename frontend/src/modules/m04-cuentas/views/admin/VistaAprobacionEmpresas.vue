<template>
  <div class="flex flex-col gap-6">
    <!-- Header estandarizado con PageHeader -->
    <PageHeader
      title="Aprobación y Gestión de Empresas"
      description="Revisa y dictamina las solicitudes de cuentas corporativas, ascensos y actualizaciones fiscales de NIT."
    >
      <Button
        variant="outline"
        size="sm"
        :disabled="loading"
        @click="refrescarDatos"
      >
        <RefreshCwIcon class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" />
        Refrescar
      </Button>
    </PageHeader>

    <!-- Pestañas de Navegación del Panel (HU-CUE-09 / RF-CUE-09-07) -->
    <div class="flex border-b border-neutral-light gap-2">
      <button
        type="button"
        class="pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer"
        :class="tabActiva === 'empresas' ? 'border-action text-corporate' : 'border-transparent text-neutral-medium hover:text-corporate'"
        @click="tabActiva = 'empresas'"
      >
        Cuentas y Ascensos ({{ solicitudes.length }})
      </button>
      <button
        type="button"
        class="pb-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer"
        :class="tabActiva === 'nit' ? 'border-action text-corporate' : 'border-transparent text-neutral-medium hover:text-corporate'"
        @click="tabActiva = 'nit'"
      >
        Actualizaciones de NIT ({{ solicitudesNit.length }})
      </button>
    </div>

    <!-- 1. TABLA: SOLICITUDES DE EMPRESA Y ASCENSOS (Altura dinámica adaptada a filas) -->
    <section v-if="tabActiva === 'empresas'" class="bg-neutral-white rounded-xl shadow-sm border border-neutral-light overflow-hidden">
      <Table
        mobile-cards
        :rows="solicitudes"
        :columns="columnsEmpresas"
        row-key="id_solicitud"
        caption="Solicitudes de Empresa"
        :loading="loading"
      >
        <template #empty>
          <div class="p-12 text-center flex flex-col items-center">
            <div class="w-16 h-16 bg-neutral-lightest rounded-full flex items-center justify-center mb-4 text-neutral-medium">
              <CheckCircleIcon class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-bold text-corporate">Todo al día</h3>
            <p class="text-neutral-medium mt-1">No hay solicitudes de empresa pendientes de aprobación.</p>
          </div>
        </template>

        <template #cell-empresa="{ row: sol }">
          <div>
            <div class="font-bold text-corporate">{{ sol.nombre_empresa }}</div>
            <div class="text-xs text-neutral-medium mt-0.5 font-mono">{{ sol.nit }}</div>
          </div>
        </template>

        <template #cell-representante="{ row: sol }">
          <span class="text-corporate font-medium">{{ sol.nombre_representante }}</span>
        </template>

        <template #cell-contacto="{ row: sol }">
          <div>
            <div class="text-corporate text-xs font-medium">{{ sol.correo_empresarial }}</div>
            <div class="text-xs text-neutral-medium mt-0.5 font-mono">{{ sol.telefono }}</div>
          </div>
        </template>

        <template #cell-tipo="{ row: sol }">
          <Badge
            :tone="sol.tipo_solicitud === 'registro' ? 'info' : 'warning'"
            :label="sol.tipo_solicitud === 'registro' ? 'Registro Nuevo' : 'Ascenso'"
            table
          />
        </template>

        <template #cell-fecha="{ row: sol }">
          <span class="text-neutral-medium text-xs">{{ formatearFecha(sol.fecha_solicitud) }}</span>
        </template>

        <template #cell-acciones="{ row: sol }">
          <div class="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              class="gap-1.5 !text-xs !py-1.5 !px-3 font-medium"
              @click="abrirRevisionEmpresa(sol)"
            >
              <EyeIcon class="w-3.5 h-3.5 shrink-0" />
              <span>Revisar</span>
            </Button>
          </div>
        </template>
      </Table>
    </section>

    <!-- 2. TABLA: SOLICITUDES DE ACTUALIZACIÓN DE NIT (RF-CUE-09-07) -->
    <section v-else class="bg-neutral-white rounded-xl shadow-sm border border-neutral-light overflow-hidden">
      <Table
        mobile-cards
        :rows="solicitudesNit"
        :columns="columnsNit"
        row-key="id_solicitud"
        caption="Solicitudes de Actualización de NIT"
        :loading="loading"
      >
        <template #empty>
          <div class="p-12 text-center flex flex-col items-center">
            <div class="w-16 h-16 bg-neutral-lightest rounded-full flex items-center justify-center mb-4 text-neutral-medium">
              <CheckCircleIcon class="w-8 h-8" />
            </div>
            <h3 class="text-lg font-bold text-corporate">Sin solicitudes pendientes</h3>
            <p class="text-neutral-medium mt-1">No hay renovaciones de NIT pendientes de dictamen fiscal.</p>
          </div>
        </template>

        <template #cell-empresa="{ row: sol }">
          <div>
            <div class="font-bold text-corporate">
              {{ sol.nombre_empresa || ('Cuenta Empresa #' + sol.id_usuario) }}
            </div>
            <div class="text-[11px] text-neutral-medium font-mono">
              Solicitud: {{ sol.id_solicitud.slice(0, 8) }}...
            </div>
          </div>
        </template>

        <template #cell-nit_anterior="{ row: sol }">
          <span class="font-mono text-xs text-neutral-dark bg-neutral-lightest px-2 py-0.5 rounded border border-neutral-light">
            {{ sol.nit_anterior }}
          </span>
        </template>

        <template #cell-nit_nuevo="{ row: sol }">
          <span class="font-mono font-bold text-xs text-corporate bg-subaction/40 px-2 py-0.5 rounded border border-subaction text-action">
            {{ sol.nit_nuevo }}
          </span>
        </template>

        <template #cell-documento="{ row: sol }">
          <a
            :href="sol.documento_adjunto_url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-xs text-action hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <FileTextIcon class="w-3.5 h-3.5" />
            Ver RUT Adjunto
          </a>
        </template>

        <template #cell-fecha="{ row: sol }">
          <span class="text-neutral-medium text-xs">{{ formatearFecha(sol.fecha_solicitud) }}</span>
        </template>

        <template #cell-acciones="{ row: sol }">
          <div class="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              class="gap-1.5 !text-xs !py-1.5 !px-3 font-medium"
              @click="abrirRevisionNit(sol)"
            >
              <EyeIcon class="w-3.5 h-3.5 shrink-0" />
              <span>Dictaminar</span>
            </Button>
          </div>
        </template>
      </Table>
    </section>

    <!-- MODAL DE REVISIÓN: EMPRESA -->
    <Modal v-model="modalEmpresaAbierto" maxWidth="md" accent @close="cerrarModalEmpresa">
      <div v-if="solEmpresaSeleccionada" class="flex flex-col">
        <div class="mb-4">
          <h2 class="text-2xl font-bold font-title text-corporate">Revisar Solicitud</h2>
          <p class="text-sm text-neutral-medium mt-1">Dictamina la solicitud de cuenta corporativa o ascenso.</p>
        </div>

        <div class="flex flex-col gap-2.5 mb-5">
          <div class="bg-[#F0F6FC] rounded-2xl p-3 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-subaction/70 text-action flex items-center justify-center shrink-0">
              <BuildingIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium mb-0.5">Razón Social</p>
              <p class="text-sm font-bold text-corporate truncate">{{ solEmpresaSeleccionada.nombre_empresa }}</p>
            </div>
          </div>

          <div class="bg-neutral-white border border-neutral-light rounded-2xl p-3 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-subaction/40 text-action flex items-center justify-center shrink-0">
              <IdCardIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium mb-0.5">NIT</p>
              <p class="text-sm font-bold text-corporate font-mono">{{ solEmpresaSeleccionada.nit }}</p>
            </div>
          </div>

          <div class="bg-neutral-white border border-neutral-light rounded-2xl p-3 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-subaction/40 text-action flex items-center justify-center shrink-0">
              <UserIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium mb-0.5">Representante Legal</p>
              <p class="text-sm font-bold text-corporate truncate">{{ solEmpresaSeleccionada.nombre_representante }}</p>
            </div>
          </div>

          <div class="bg-neutral-white border border-neutral-light rounded-2xl p-3 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-subaction/40 text-action flex items-center justify-center shrink-0">
              <MailIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium mb-0.5">Correo Corporativo</p>
              <p class="text-sm font-bold text-corporate truncate">{{ solEmpresaSeleccionada.correo_empresarial }}</p>
            </div>
          </div>

          <div class="bg-neutral-white border border-neutral-light rounded-2xl p-3 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-subaction/40 text-action flex items-center justify-center shrink-0">
              <PhoneIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium mb-0.5">Teléfono de Contacto</p>
              <p class="text-sm font-bold text-corporate font-mono">{{ solEmpresaSeleccionada.telefono }}</p>
            </div>
          </div>
        </div>

        <div v-if="errorMensaje" class="mb-4 p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger text-center">
          {{ errorMensaje }}
        </div>

        <div v-if="mostrandoMotivoRechazo" class="mb-4 space-y-3">
          <label class="block text-xs font-semibold text-corporate">Motivo del rechazo (obligatorio)</label>
          <textarea
            v-model="motivoRechazo"
            rows="3"
            class="w-full text-sm rounded-xl border border-neutral-light p-3 focus:outline-none focus:border-action"
            placeholder="Indique la razón por la cual no se aprueba la cuenta..."
          ></textarea>
          <div class="flex gap-2 justify-end">
            <Button variant="neutral" size="sm" @click="mostrandoMotivoRechazo = false">Volver</Button>
            <Button variant="danger" size="sm" :disabled="procesando" @click="confirmarRechazoEmpresa">
              <RefreshCwIcon v-if="procesando" class="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Confirmar Rechazo
            </Button>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <Button
            variant="danger-outline"
            size="md"
            class="!text-sm whitespace-nowrap !py-2.5 font-semibold justify-center flex items-center"
            :disabled="procesando"
            @click="mostrandoMotivoRechazo = true"
          >
            <XIcon class="w-4 h-4 mr-1.5 shrink-0" />
            <span>Rechazar</span>
          </Button>
          <Button
            variant="corporate"
            size="md"
            class="!text-sm whitespace-nowrap !py-2.5 font-semibold justify-center flex items-center"
            :disabled="procesando"
            @click="aprobarSolicitudEmpresa"
          >
            <RefreshCwIcon v-if="procesando" class="w-4 h-4 mr-1.5 animate-spin" />
            <CheckIcon v-else class="w-4 h-4 mr-1.5 shrink-0" />
            <span>Aprobar Empresa</span>
          </Button>
        </div>
      </div>
    </Modal>

    <!-- MODAL DE REVISIÓN: ACTUALIZACIÓN DE NIT (RF-CUE-09-07) -->
    <Modal v-model="modalNitAbierto" maxWidth="md" accent @close="cerrarModalNit">
      <div v-if="solNitSeleccionada" class="flex flex-col">
        <div class="mb-4">
          <h2 class="text-2xl font-bold font-title text-corporate">Dictaminar Actualización de NIT</h2>
          <p class="text-sm text-neutral-medium mt-1">Revise el documento soporte de RUT y dictamine el nuevo NIT fiscal.</p>
        </div>

        <div class="flex flex-col gap-2.5 mb-5">
          <div class="bg-[#F0F6FC] rounded-2xl p-3 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-subaction text-action flex items-center justify-center shrink-0">
              <BuildingIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium mb-0.5">Empresa Solicitante</p>
              <p class="text-sm font-bold text-corporate truncate">
                {{ solNitSeleccionada.nombre_empresa || ('Cuenta Empresa #' + solNitSeleccionada.id_usuario) }}
              </p>
            </div>
          </div>

          <div class="bg-neutral-white border border-neutral-light rounded-2xl p-3 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-neutral-lightest text-neutral-dark flex items-center justify-center shrink-0">
              <IdCardIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium mb-0.5">NIT Anterior Vigente</p>
              <p class="text-sm font-bold text-neutral-dark font-mono">{{ solNitSeleccionada.nit_anterior }}</p>
            </div>
          </div>

          <div class="bg-[#F0F6FC] rounded-2xl p-3 flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-subaction/70 text-action flex items-center justify-center shrink-0">
              <CheckCircleIcon class="w-5 h-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-neutral-medium mb-0.5">Nuevo NIT Solicitado</p>
              <p class="text-base font-bold text-corporate font-mono">{{ solNitSeleccionada.nit_nuevo }}</p>
            </div>
          </div>

          <div class="bg-neutral-white border border-neutral-light rounded-2xl p-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-subaction/40 text-action flex items-center justify-center shrink-0">
                <FileTextIcon class="w-5 h-5" />
              </div>
              <div>
                <p class="text-xs text-neutral-medium mb-0.5">Soporte Tributario</p>
                <p class="text-xs font-semibold text-corporate">RUT Adjunto</p>
              </div>
            </div>
            <a
              :href="solNitSeleccionada.documento_adjunto_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs text-action font-semibold hover:underline inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-subaction/30 hover:bg-subaction/50 transition-colors"
            >
              Abrir RUT
            </a>
          </div>
        </div>

        <div v-if="errorMensaje" class="mb-4 p-3 rounded-xl bg-danger-subtle border border-danger/30 text-xs text-danger text-center">
          {{ errorMensaje }}
        </div>

        <div v-if="mostrandoMotivoRechazoNit" class="mb-4 space-y-3">
          <label class="block text-xs font-semibold text-corporate">Motivo del rechazo (opcional)</label>
          <textarea
            v-model="motivoRechazoNit"
            rows="3"
            class="w-full text-sm rounded-xl border border-neutral-light p-3 focus:outline-none focus:border-action resize-none"
            placeholder="Indique el motivo por el cual no coincide el RUT..."
          ></textarea>
          <div class="flex gap-2 justify-end">
            <Button variant="neutral" size="sm" @click="mostrandoMotivoRechazoNit = false">Volver</Button>
            <Button variant="danger" size="sm" :disabled="procesando" @click="confirmarRechazoNit">
              <RefreshCwIcon v-if="procesando" class="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Rechazar Renovación
            </Button>
          </div>
        </div>

        <div v-else class="grid grid-cols-2 gap-3">
          <Button
            variant="danger-outline"
            size="md"
            class="!text-sm whitespace-nowrap !py-2.5 font-semibold justify-center flex items-center"
            :disabled="procesando"
            @click="mostrandoMotivoRechazoNit = true"
          >
            <XIcon class="w-4 h-4 mr-1.5 shrink-0" />
            <span>Rechazar</span>
          </Button>
          <Button
            variant="corporate"
            size="md"
            class="!text-sm whitespace-nowrap !py-2.5 font-semibold justify-center flex items-center"
            :disabled="procesando"
            @click="aprobarSolicitudNit"
          >
            <RefreshCwIcon v-if="procesando" class="w-4 h-4 mr-1.5 animate-spin" />
            <CheckIcon v-else class="w-4 h-4 mr-1.5 shrink-0" />
            <span>Aprobar Nuevo NIT</span>
          </Button>
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
  Eye as EyeIcon,
  Building2 as BuildingIcon,
  IdCard as IdCardIcon,
  User as UserIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  Check as CheckIcon,
  X as XIcon,
  FileText as FileTextIcon,
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
import type {
  SolicitudEmpresa,
  SolicitudActualizacionNit,
} from '@/modules/m04-cuentas/interfaces/admin.interface';

const tabActiva = ref<'empresas' | 'nit'>('empresas');
const loading = ref(false);
const solicitudes = ref<SolicitudEmpresa[]>([]);
const solicitudesNit = ref<SolicitudActualizacionNit[]>([]);

const columnsEmpresas = computed<TableColumn[]>(() => [
  { key: 'empresa', label: 'Empresa / NIT' },
  { key: 'representante', label: 'Representante' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
]);

const columnsNit = computed<TableColumn[]>(() => [
  { key: 'empresa', label: 'Empresa / Solicitante' },
  { key: 'nit_anterior', label: 'NIT Anterior' },
  { key: 'nit_nuevo', label: 'NIT Nuevo' },
  { key: 'documento', label: 'Documento RUT' },
  { key: 'fecha', label: 'Fecha Solicitud' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
]);

const modalEmpresaAbierto = ref(false);
const solEmpresaSeleccionada = ref<SolicitudEmpresa | null>(null);
const mostrandoMotivoRechazo = ref(false);
const motivoRechazo = ref('');

const modalNitAbierto = ref(false);
const solNitSeleccionada = ref<SolicitudActualizacionNit | null>(null);
const mostrandoMotivoRechazoNit = ref(false);
const motivoRechazoNit = ref('');

const procesando = ref(false);
const errorMensaje = ref('');

const refrescarDatos = async () => {
  try {
    loading.value = true;
    errorMensaje.value = '';
    const [resEmp, resNit] = await Promise.allSettled([
      CuentasService.listarSolicitudesEmpresa(),
      CuentasService.listarSolicitudesNit(),
    ]);

    if (resEmp.status === 'fulfilled' && resEmp.value.success) {
      solicitudes.value = resEmp.value.data;
    }
    if (resNit.status === 'fulfilled' && resNit.value.success) {
      const listaNit = resNit.value.data;
      solicitudesNit.value = listaNit.map((item) => {
        if (item.nombre_empresa) return item;
        const encontrada = solicitudes.value.find(
          (emp) => emp.id_usuario === item.id_usuario || emp.nit === item.nit_anterior
        );
        return {
          ...item,
          nombre_empresa: encontrada?.nombre_empresa,
        };
      });
    }
  } catch (error: unknown) {
    console.error('Error cargando solicitudes:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  refrescarDatos();
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

// Acciones para Empresa
const abrirRevisionEmpresa = (sol: SolicitudEmpresa) => {
  solEmpresaSeleccionada.value = sol;
  mostrandoMotivoRechazo.value = false;
  motivoRechazo.value = '';
  errorMensaje.value = '';
  modalEmpresaAbierto.value = true;
};

const cerrarModalEmpresa = () => {
  modalEmpresaAbierto.value = false;
  solEmpresaSeleccionada.value = null;
  mostrandoMotivoRechazo.value = false;
  motivoRechazo.value = '';
  errorMensaje.value = '';
};

const dictaminarEmpresa = async (decision: 'aprobar' | 'rechazar') => {
  if (!solEmpresaSeleccionada.value) return;
  if (decision === 'rechazar' && !motivoRechazo.value.trim()) {
    errorMensaje.value = 'Debes ingresar un motivo de rechazo.';
    return;
  }

  try {
    procesando.value = true;
    errorMensaje.value = '';
    const res = await CuentasService.dictaminarSolicitudEmpresa(
      solEmpresaSeleccionada.value.id_solicitud,
      {
        decision,
        motivoRechazo: decision === 'rechazar' ? motivoRechazo.value.trim() : null,
      }
    );
    if (res.success) {
      modalEmpresaAbierto.value = false;
      await refrescarDatos();
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message?: string } } } };
    errorMensaje.value = err.response?.data?.error?.message || 'Error al dictaminar la solicitud.';
  } finally {
    procesando.value = false;
  }
};

const aprobarSolicitudEmpresa = () => dictaminarEmpresa('aprobar');
const confirmarRechazoEmpresa = () => dictaminarEmpresa('rechazar');

// Acciones para NIT
const abrirRevisionNit = async (sol: SolicitudActualizacionNit) => {
  solNitSeleccionada.value = { ...sol };
  mostrandoMotivoRechazoNit.value = false;
  motivoRechazoNit.value = '';
  errorMensaje.value = '';
  modalNitAbierto.value = true;

  if (!solNitSeleccionada.value.nombre_empresa) {
    const empLocal = solicitudes.value.find(
      (e) => e.id_usuario === sol.id_usuario || e.nit === sol.nit_anterior
    );
    if (empLocal?.nombre_empresa) {
      solNitSeleccionada.value.nombre_empresa = empLocal.nombre_empresa;
      return;
    }

    try {
      const res = await CuentasService.consultarEstadoSolicitudEmpresa(sol.nit_anterior);
      if (res.success && res.data?.nombre_empresa) {
        solNitSeleccionada.value.nombre_empresa = res.data.nombre_empresa;
        const idx = solicitudesNit.value.findIndex((s) => s.id_solicitud === sol.id_solicitud);
        if (idx !== -1) {
          solicitudesNit.value[idx].nombre_empresa = res.data.nombre_empresa;
        }
      }
    } catch {
      // Mantiene el fallback de ID
    }
  }
};

const cerrarModalNit = () => {
  modalNitAbierto.value = false;
  solNitSeleccionada.value = null;
  mostrandoMotivoRechazoNit.value = false;
  motivoRechazoNit.value = '';
  errorMensaje.value = '';
};

const dictaminarNit = async (decision: 'aprobar' | 'rechazar') => {
  if (!solNitSeleccionada.value) return;
  try {
    procesando.value = true;
    errorMensaje.value = '';
    const res = await CuentasService.dictaminarSolicitudNit(
      solNitSeleccionada.value.id_solicitud,
      {
        decision,
        motivoRechazo: decision === 'rechazar' ? motivoRechazoNit.value.trim() : null,
      }
    );
    if (res.success) {
      modalNitAbierto.value = false;
      await refrescarDatos();
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: { message?: string } } } };
    errorMensaje.value = err.response?.data?.error?.message || 'Error al dictaminar la solicitud de NIT.';
  } finally {
    procesando.value = false;
  }
};

const aprobarSolicitudNit = () => dictaminarNit('aprobar');
const confirmarRechazoNit = () => dictaminarNit('rechazar');
</script>

<style scoped>
:deep(.overflow-x-auto) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
:deep(.overflow-x-auto::-webkit-scrollbar) {
  display: none;
}
</style>

