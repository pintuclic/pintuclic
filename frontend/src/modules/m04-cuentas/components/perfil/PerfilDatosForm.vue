<template>
  <div class="bg-white rounded-2xl shadow-sm border border-neutral-light p-6 md:p-8">
    <div class="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-8">
      <div>
        <h2 class="text-xl md:text-2xl font-title font-semibold text-corporate text-center md:text-left">
          Información personal
        </h2>
        <p class="text-xs md:text-sm text-neutral-medium mt-1">
          Consulte y actualice sus datos de contacto y su dirección de despacho.
        </p>
      </div>

      <div class="flex flex-wrap justify-center items-center gap-2.5 w-full md:w-auto">
        <!-- BOTÓN CAMBIAR CONTRASEÑA (HU-CUE-06 / RF-CUE-06-04) -->
        <Button
          v-if="!isEditing"
          variant="outline"
          class="!rounded-lg text-xs md:text-sm px-3 md:px-4 py-2"
          @click="$emit('cambiarPassword')"
        >
          <LockIcon class="w-4 h-4 mr-1.5" />
          Cambiar contraseña
        </Button>

        <!-- BOTÓN ASCENSO (SI ES PARTICULAR) -->
        <template v-if="!isEmpresa">
          <span
            v-if="!isEditing && tieneSolicitudEmpresaPendiente"
            class="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-highlight/20 text-corporate text-xs md:text-sm font-semibold border border-highlight/40 shadow-xs cursor-default"
            title="Ya cuenta con una solicitud de empresa en revisión"
          >
            <ClockIcon class="w-4 h-4 text-corporate" />
            Ascenso en revisión
          </span>
          <Button
            v-else-if="!isEditing"
            variant="corporate"
            class="!rounded-lg text-xs md:text-sm px-3 md:px-4 py-2"
            @click="$emit('solicitarAscenso')"
          >
            Ascender a empresa
          </Button>
        </template>

        <!-- BOTÓN RENOVAR NIT (SI ES EMPRESA) (HU-CUE-10) -->
        <template v-else>
          <span
            v-if="!isEditing && solicitudNit?.estado === 'pendiente'"
            class="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-lg bg-subaction text-corporate text-xs md:text-sm font-semibold border border-action/30 shadow-xs cursor-default"
            title="Su solicitud para renovar el NIT está en validación por el administrador"
          >
            <ClockIcon class="w-4 h-4 text-action" />
            Renovación en trámite
          </span>
          <Button
            v-else-if="!isEditing"
            variant="corporate"
            class="!rounded-lg text-xs md:text-sm px-3 md:px-4 py-2"
            @click="$emit('solicitarRenovarNit')"
          >
            <FileTextIcon class="w-4 h-4 mr-1.5" />
            Actualizar NIT
          </Button>
        </template>

        <!-- MODO EDICIÓN -->
        <Button
          v-if="!isEditing"
          variant="outline"
          class="!rounded-lg text-xs md:text-sm px-3 md:px-4 py-2"
          @click="iniciarEdicion"
        >
          <EditIcon class="w-4 h-4 mr-1.5" />
          Editar información
        </Button>

        <div v-else class="flex gap-2">
          <Button
            variant="neutral"
            class="!rounded-lg text-xs md:text-sm px-3 md:px-4 py-2"
            :disabled="guardando"
            @click="cancelarEdicion"
          >
            Cancelar
          </Button>
          <Button
            variant="corporate"
            class="!rounded-lg text-xs md:text-sm px-3 md:px-4 py-2"
            :disabled="guardando"
            @click="guardarCambios"
          >
            {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </div>
      </div>
    </div>

    <!-- BANNER INFORMATIVO DE TRÁMITE PENDIENTE DE ASCENSO (HU-CUE-06) -->
    <div
      v-if="!isEmpresa && tieneSolicitudEmpresaPendiente"
      class="mb-6 p-4 rounded-xl bg-highlight/15 border border-highlight/30 flex items-start gap-3.5 text-corporate"
    >
      <div class="p-2.5 rounded-xl bg-white/90 shrink-0 text-corporate shadow-xs border border-highlight/20">
        <ClockIcon class="w-5 h-5 text-corporate" />
      </div>
      <div class="flex-1 text-xs">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-bold text-sm text-corporate">Solicitud de Ascenso a Empresa en Revisión</span>
          <span class="px-2 py-0.5 rounded-full bg-white font-semibold text-[11px] text-corporate shadow-xs border border-highlight/20">
            En trámite
          </span>
        </div>
        <p class="text-neutral-dark mb-1.5 leading-relaxed">
          Ha radicado la solicitud para la razón social <strong>{{ infoEmpresaPendiente.nombre_empresa }}</strong> con NIT <strong class="font-mono">{{ infoEmpresaPendiente.nit }}</strong>.
        </p>
        <p class="text-neutral-medium text-[11px]">
          El administrador validará la información y la decisión le será notificada a su correo electrónico.
        </p>
      </div>
    </div>

    <!-- BANNER INFORMATIVO DE ACTUALIZACIÓN DE NIT (HU-CUE-10) -->
    <div
      v-if="isEmpresa && solicitudNit?.estado === 'pendiente'"
      class="mb-6 p-4 rounded-xl bg-subaction/40 border border-action/20 flex items-start gap-3.5 text-corporate"
    >
      <div class="p-2.5 rounded-xl bg-white/90 shrink-0 text-action shadow-xs border border-action/20">
        <ClockIcon class="w-5 h-5 text-action" />
      </div>
      <div class="flex-1 text-xs">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-bold text-sm text-corporate">Actualización de NIT en Trámite</span>
          <span class="px-2 py-0.5 rounded-full bg-white font-semibold text-[11px] text-action shadow-xs border border-action/20">
            En validación
          </span>
        </div>
        <p class="text-neutral-dark mb-1.5 leading-relaxed">
          Se radicó la solicitud para actualizar su NIT al número <strong class="font-mono">{{ solicitudNit.nit_nuevo }}</strong> con soporte del RUT vigente.
        </p>
        <p class="text-neutral-medium text-[11px]">
          Su NIT actual continúa vigente para facturación mientras concluye la auditoría administrativa.
        </p>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-8 items-center md:items-start">
      <!-- Avatar -->
      <div class="flex flex-col items-center gap-3 shrink-0">
        <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-action border-2 border-white shadow-sm ring-4 ring-neutral-lightest overflow-hidden">
          <UserIcon class="w-10 h-10" stroke-width="1.5" />
        </div>
        <span class="text-xs font-semibold uppercase px-2.5 py-0.5 rounded-full bg-subaction text-corporate">
          {{ isEmpresa ? 'Cliente Empresa' : 'Cliente Particular' }}
        </span>
      </div>

      <!-- Cuadrícula de Campos -->
      <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        <!-- NOMBRE -->
        <div class="flex gap-3 items-center md:items-start">
          <UserIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">
              {{ isEmpresa ? 'Representante legal' : 'Nombre completo' }}
            </span>
            <template v-if="isEditing">
              <input
                v-model="form.nombre"
                type="text"
                placeholder="Nombre completo"
                class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
                :class="{ 'border-danger focus:border-danger bg-danger/5': errores.nombre }"
              />
              <span v-if="errores.nombre" class="text-xs text-danger font-medium mt-1 block">
                {{ errores.nombre }}
              </span>
            </template>
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ form.nombre || user?.nombre || 'No registrado' }}
            </span>
          </div>
        </div>

        <!-- DOCUMENTO / IDENTIFICACIÓN (HU-CUE-06) -->
        <div class="flex gap-3 items-center md:items-start">
          <CreditCardIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">
              {{ isEmpresa ? 'NIT Corporativo' : 'Documento de identidad' }}
            </span>
            <!-- Si es empresa, protegido por política (HU-CUE-06 / RF-CUE-06-06) -->
            <template v-if="isEmpresa">
              <span class="block text-sm font-semibold text-corporate opacity-70" title="Para renovar su NIT adjunte RUT con el botón Actualizar NIT">
                {{ perfilDetallado?.nit || 'NIT en trámite' }}
              </span>
            </template>
            <!-- Si es particular con documento YA REGISTRADO: BLOQUEADO PERMANENTEMENTE -->
            <template v-else-if="perfilDetallado?.documento_identidad">
              <div class="flex items-center gap-2">
                <span class="block text-sm font-semibold text-corporate">
                  {{ perfilDetallado.documento_identidad }}
                </span>
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-dark bg-neutral-light/60 px-2 py-0.5 rounded-full border border-neutral-light">
                  <LockIcon class="w-3 h-3 text-neutral-medium" /> Bloqueado
                </span>
              </div>
              <span class="block text-[11px] text-neutral-medium mt-0.5">Dato verificado y protegido contra cambios.</span>
            </template>
            <!-- Si es particular sin documento previo y en modo edición: permitir ingresarlo -->
            <template v-else-if="isEditing">
              <input
                v-model="form.documento_identidad"
                type="text"
                inputmode="numeric"
                maxlength="10"
                placeholder="Entre 6 y 10 dígitos numéricos"
                class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
                :class="{ 'border-danger focus:border-danger bg-danger/5': errores.documento_identidad }"
                @input="onInputDocumento"
              />
              <span v-if="errores.documento_identidad" class="text-xs text-danger font-medium mt-1 block">
                {{ errores.documento_identidad }}
              </span>
            </template>
            <!-- Si es particular sin documento y en modo solo lectura -->
            <template v-else>
              <span class="block text-sm font-semibold text-corporate opacity-70">
                Sin registrar (agregue en Editar)
              </span>
            </template>
          </div>
        </div>

        <!-- CORREO ELECTRÓNICO -->
        <div class="flex gap-3 items-center md:items-start">
          <MailIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">Correo electrónico</span>
            <template v-if="isEditing">
              <input
                v-model="form.correo"
                type="email"
                placeholder="correo@ejemplo.com"
                class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
                :class="{ 'border-danger focus:border-danger bg-danger/5': errores.correo }"
              />
              <span v-if="errores.correo" class="text-xs text-danger font-medium mt-1 block">
                {{ errores.correo }}
              </span>
            </template>
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ user?.correo || 'No registrado' }}
            </span>
          </div>
        </div>

        <!-- TELÉFONO -->
        <div class="flex gap-3 items-center md:items-start">
          <PhoneIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">Teléfono de contacto</span>
            <template v-if="isEditing">
              <input
                v-model="form.telefono"
                type="tel"
                placeholder="Teléfono (mínimo 7 dígitos)"
                class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
                :class="{ 'border-danger focus:border-danger bg-danger/5': errores.telefono }"
              />
              <span v-if="errores.telefono" class="text-xs text-danger font-medium mt-1 block">
                {{ errores.telefono }}
              </span>
            </template>
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ form.telefono || user?.telefono || 'No registrado' }}
            </span>
          </div>
        </div>

        <!-- CIUDAD / BARRIO (HU-CUE-07) -->
        <div class="flex gap-3 items-center md:items-start">
          <MapPinIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">Barrio o sector</span>
            <template v-if="isEditing">
              <input
                v-model="form.barrio"
                type="text"
                placeholder="Barrio o sector de despacho"
                class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
                :class="{ 'border-danger focus:border-danger bg-danger/5': errores.barrio }"
              />
              <span v-if="errores.barrio" class="text-xs text-danger font-medium mt-1 block">
                {{ errores.barrio }}
              </span>
            </template>
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ form.barrio || direccionRegistrada?.barrio || 'No especificado' }}
            </span>
          </div>
        </div>

        <!-- DIRECCIÓN DE ENTREGA ÚNICA (HU-CUE-07) -->
        <div class="flex gap-3 items-center md:items-start">
          <HomeIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <div class="flex items-center justify-between mb-1">
              <span class="block text-xs text-neutral-medium">Dirección de entrega</span>
              <!-- GEOLOCALIZACIÓN (RF-CUE-07-06 / CA-CUE-07-04) -->
              <button
                v-if="isEditing"
                type="button"
                class="text-xs text-action hover:underline font-medium flex items-center gap-1 cursor-pointer"
                :disabled="obteniendoGps"
                @click="obtenerUbicacionActual"
              >
                <CompassIcon class="w-3.5 h-3.5" :class="{ 'animate-spin': obteniendoGps }" />
                {{ obteniendoGps ? 'Localizando...' : 'Usar GPS' }}
              </button>
            </div>

            <template v-if="isEditing">
              <input
                v-model="form.direccion"
                type="text"
                placeholder="Calle, Carrera, Nro, Apto"
                class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
                :class="{ 'border-danger focus:border-danger bg-danger/5': errores.direccion }"
              />
              <span v-if="errores.direccion" class="text-xs text-danger font-medium mt-1 block">
                {{ errores.direccion }}
              </span>
            </template>
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ form.direccion || direccionRegistrada?.direccion || 'Sin dirección registrada' }}
            </span>
          </div>
        </div>

        <!-- CAMPOS EXCLUSIVOS DE EMPRESA -->
        <template v-if="isEmpresa">
          <div class="flex gap-3 items-center md:items-start" title="Razón social registrada">
            <BuildingIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
            <div class="flex-1 w-full opacity-70">
              <span class="block text-xs text-neutral-medium mb-1">Razón Social</span>
              <span class="block text-sm font-semibold text-corporate">
                {{ perfilDetallado?.nombre_empresa || 'Empresa Corporativa' }}
              </span>
            </div>
          </div>

          <div class="flex gap-3 items-center md:items-start">
            <FileTextIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
            <div class="flex-1 w-full opacity-70">
              <span class="block text-xs text-neutral-medium mb-1">NIT</span>
              <div class="flex flex-wrap items-center gap-2">
                <span class="block text-sm font-semibold text-corporate font-mono">
                  {{ perfilDetallado?.nit || 'NIT en trámite' }}
                </span>
                <span
                  v-if="solicitudNit?.estado === 'pendiente'"
                  class="inline-flex items-center gap-1 text-[11px] font-semibold text-action bg-subaction px-2 py-0.5 rounded-full border border-action/20"
                >
                  <ClockIcon class="w-3 h-3 text-action" /> Renovación a {{ solicitudNit.nit_nuevo }} en trámite
                </span>
              </div>
            </div>
          </div>
        </template>

        <!-- CAMPOS DE SOLICITUD PENDIENTE SI ES PARTICULAR EN TRÁMITE DE ASCENSO -->
        <template v-if="!isEmpresa && tieneSolicitudEmpresaPendiente">
          <div class="flex gap-3 items-center md:items-start opacity-90">
            <BuildingIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
            <div class="flex-1 w-full">
              <span class="block text-xs text-neutral-medium mb-1">Empresa solicitada</span>
              <span class="block text-sm font-semibold text-corporate">
                {{ infoEmpresaPendiente.nombre_empresa }}
              </span>
            </div>
          </div>

          <div class="flex gap-3 items-center md:items-start opacity-90">
            <FileTextIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
            <div class="flex-1 w-full">
              <span class="block text-xs text-neutral-medium mb-1">NIT solicitado</span>
              <div class="flex items-center gap-2">
                <span class="block text-sm font-semibold text-corporate font-mono">
                  {{ infoEmpresaPendiente.nit }}
                </span>
                <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-corporate bg-highlight/25 px-2 py-0.5 rounded-full border border-highlight/30">
                  <ClockIcon class="w-3 h-3 text-corporate" /> En revisión
                </span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, watch } from 'vue';
import { Button } from '@/core/components';
import type { UsuarioSeguro, PerfilUsuarioResponse } from '@/modules/m04-cuentas/interfaces/registro.interface';
import type { DireccionCliente } from '@/modules/m04-cuentas/interfaces/direccion.interface';
import type { SolicitudEmpresaLocal, SolicitudNitLocal } from '@/modules/m04-cuentas/composables/usePerfil';
import { actualizarPerfilSchema } from '@/modules/m04-cuentas/dtos/perfil.dto';
import {
  User as UserIcon,
  CreditCard as CreditCardIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Building as BuildingIcon,
  FileText as FileTextIcon,
  Edit2 as EditIcon,
  Lock as LockIcon,
  Compass as CompassIcon,
  Clock as ClockIcon,
} from 'lucide-vue-next';

export interface GuardarPerfilPayload {
  nombre: string;
  telefono: string;
  correo: string;
  documento_identidad?: string;
  direccion: string;
  barrio: string;
  latitud?: number | null;
  longitud?: number | null;
}

const props = defineProps<{
  user: UsuarioSeguro | null;
  perfilDetallado?: PerfilUsuarioResponse | null;
  direccionRegistrada?: DireccionCliente | null;
  solicitudEmpresa?: SolicitudEmpresaLocal | null;
  solicitudNit?: SolicitudNitLocal | null;
  isEmpresa: boolean;
  guardando: boolean;
}>();

const tieneSolicitudEmpresaPendiente = computed(() => {
  if (props.isEmpresa) return false;
  return Boolean(
    props.solicitudEmpresa?.estado === 'pendiente' ||
    props.perfilDetallado?.nit ||
    props.perfilDetallado?.nombre_empresa
  );
});

const infoEmpresaPendiente = computed(() => {
  return {
    nombre_empresa:
      props.solicitudEmpresa?.nombre_empresa ||
      (props.perfilDetallado?.nombre_empresa as string) ||
      'Empresa en trámite',
    nit:
      props.solicitudEmpresa?.nit ||
      (props.perfilDetallado?.nit as string) ||
      'NIT en trámite',
  };
});

const emit = defineEmits<{
  (e: 'guardar', datos: GuardarPerfilPayload): void;
  (e: 'solicitarAscenso'): void;
  (e: 'solicitarRenovarNit'): void;
  (e: 'cambiarPassword'): void;
}>();

const isEditing = ref(false);
const obteniendoGps = ref(false);
const errores = reactive<Record<string, string>>({});

const form = reactive<GuardarPerfilPayload>({
  nombre: '',
  telefono: '',
  correo: '',
  documento_identidad: '',
  direccion: '',
  barrio: '',
  latitud: null,
  longitud: null,
});

function sincronizarForm(): void {
  form.nombre = props.perfilDetallado?.nombre || props.user?.nombre || '';
  form.telefono = props.perfilDetallado?.telefono || props.user?.telefono || '';
  form.correo = props.perfilDetallado?.correo || props.user?.correo || '';
  form.documento_identidad = props.perfilDetallado?.documento_identidad || '';
  form.direccion = props.direccionRegistrada?.direccion || '';
  form.barrio = props.direccionRegistrada?.barrio || '';
  form.latitud = props.direccionRegistrada?.latitud ?? null;
  form.longitud = props.direccionRegistrada?.longitud ?? null;
}

watch(
  [() => props.user, () => props.perfilDetallado, () => props.direccionRegistrada],
  () => {
    if (!isEditing.value) {
      sincronizarForm();
    }
  },
  { immediate: true }
);

function onInputDocumento(e: Event): void {
  const target = e.target as HTMLInputElement;
  form.documento_identidad = target.value.replace(/\D/g, '').slice(0, 10);
  if (errores.documento_identidad) {
    delete errores.documento_identidad;
  }
}

function iniciarEdicion(): void {
  Object.keys(errores).forEach((k) => delete errores[k]);
  sincronizarForm();
  isEditing.value = true;
}

function cancelarEdicion(): void {
  Object.keys(errores).forEach((k) => delete errores[k]);
  sincronizarForm();
  isEditing.value = false;
}

function finalizarEdicion(): void {
  Object.keys(errores).forEach((k) => delete errores[k]);
  isEditing.value = false;
  sincronizarForm();
}

function guardarCambios(): void {
  Object.keys(errores).forEach((k) => delete errores[k]);

  const docTrim = form.documento_identidad ? form.documento_identidad.trim() : '';

  const parseResult = actualizarPerfilSchema.safeParse({
    nombre: form.nombre,
    telefono: form.telefono,
    correo: form.correo,
    documento_identidad: docTrim === '' ? '' : docTrim,
    direccion: form.direccion,
    barrio: form.barrio,
  });

  if (!parseResult.success) {
    parseResult.error.errors.forEach((err) => {
      const campo = err.path[0] as string;
      if (campo) {
        errores[campo] = err.message;
      }
    });
    return;
  }

  emit('guardar', { ...form, documento_identidad: docTrim });
}

/**
 * Autocompletado de coordenadas por geolocalización (RF-CUE-07-06 / CA-CUE-07-04)
 */
function obtenerUbicacionActual(): void {
  if (typeof window === 'undefined' || !window.navigator?.geolocation) {
    return;
  }

  obteniendoGps.value = true;
  window.navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.latitud = Number(pos.coords.latitude.toFixed(6));
      form.longitud = Number(pos.coords.longitude.toFixed(6));
      if (!form.direccion) {
        form.direccion = `Ubicación GPS (${form.latitud}, ${form.longitud})`;
      }
      if (!form.barrio) {
        form.barrio = 'Zona GPS';
      }
      obteniendoGps.value = false;
    },
    (_error) => {
      obteniendoGps.value = false;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

defineExpose({
  form,
  iniciarEdicion,
  cancelarEdicion,
  finalizarEdicion,
});
</script>
