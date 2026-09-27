<template>
  <div class="bg-neutral-lightest min-h-screen font-sans pb-12">
    <!-- Header visual de la vista -->
    <div
      class="relative h-32 md:h-40 overflow-hidden mx-4 md:mx-8 mt-6 rounded-2xl shadow-sm border border-[#D5E6F5] flex justify-between"
      style="background: linear-gradient(135deg, #E6F1FB 0%, #E2EFFA 50%, #DFEEFA 100%);"
    >
      <div class="relative h-full flex flex-col justify-center px-8 md:px-12 z-10 w-full md:w-1/2">
        <h1 class="text-2xl md:text-3xl font-title font-bold text-corporate mb-1.5">Mi Perfil</h1>
        <p class="text-neutral-medium text-sm font-sans font-normal max-w-md">
          Administre su información personal, credenciales de acceso y dirección de despacho.
        </p>
      </div>
      <div class="absolute inset-0 md:relative md:inset-auto md:w-1/2 h-full flex justify-end pointer-events-none">
        <img
          src="@/assets/banner_perfil.png"
          alt="Fondo perfil"
          class="h-full w-auto object-contain object-right [-webkit-mask-image:linear-gradient(to_right,transparent_0%,black_30%)] [mask-image:linear-gradient(to_right,transparent_0%,black_30%)]"
        />
      </div>
    </div>

    <!-- Contenido Principal con CSS Grid Responsivo -->
    <div class="container mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6 items-start">
      <!-- 1. NAVEGACIÓN LATERAL -->
      <aside class="order-1 lg:col-start-1 flex flex-col gap-6">
        <PerfilSidebarNav />
        <!-- En desktop (lg+), la tarjeta de ayuda se muestra en el panel lateral -->
        <div class="hidden lg:block">
          <TarjetaSoporte />
        </div>
      </aside>

      <!-- 2. FORMULARIO DE PERFIL Y DIRECCIÓN -->
      <main class="order-2 lg:col-start-2 min-w-0 flex flex-col gap-6">
        <!-- Alertas globales de estado -->
        <div v-if="errorMensaje" class="p-3 bg-danger-subtle border border-danger/30 rounded-xl text-danger text-sm font-medium">
          {{ errorMensaje }}
        </div>
        <div v-if="exitoMensaje" class="p-3 bg-conversion/10 border border-conversion/30 rounded-xl text-conversion font-semibold text-sm">
          {{ exitoMensaje }}
        </div>

        <PerfilDatosForm
          ref="perfilFormRef"
          :user="userPerfil"
          :perfil-detallado="perfilDetallado"
          :direccion-registrada="direccionRegistrada"
          :solicitud-empresa="solicitudEmpresa"
          :solicitud-nit="solicitudNit"
          :is-empresa="isEmpresa"
          :guardando="guardando"
          @guardar="onGuardarDatos"
          @solicitar-ascenso="showAscensoModal = true"
          @solicitar-renovar-nit="showRenovarNitModal = true"
          @cambiar-password="showCambiarPasswordModal = true"
        />

        <!-- En pantallas móviles y teléfonos (< lg), la sección de ayuda va DEBAJO de Información Personal -->
        <div class="block lg:hidden">
          <TarjetaSoporte />
        </div>
      </main>
    </div>

    <!-- MODAL DE CONFIRMACIÓN DE CONTRASEÑA PARA CAMBIO DE CORREO (HU-SEG-01 / RF-CUE-06-03) -->
    <ModalConfirmarPassword
      v-model="showConfirmPasswordModal"
      :nuevo-correo="correoPendiente"
      :cargando="enviandoSolicitudCorreo"
      :error="errorPasswordModal"
      @confirmar="onConfirmarPasswordCambioCorreo"
      @cancelar="correoPendiente = ''"
    />

    <!-- MODAL DE VERIFICACIÓN OTP PARA CAMBIO DE CORREO (HU-CUE-06) -->
    <Modal v-model="showVerificacionCorreo" maxWidth="md" accent>
      <PasoVerificacion
        :correo="correoPendiente || userPerfil?.correo || ''"
        :is-cambio-correo="true"
        @verificado="onVerificacionCorreoExitosa"
        @volver="showVerificacionCorreo = false"
      />
    </Modal>

    <!-- MODAL DE CAMBIO DE CONTRASEÑA EN PERFIL (HU-CUE-06 / RF-CUE-06-04) -->
    <ModalCambiarPassword
      v-model="showCambiarPasswordModal"
      @success="onPasswordCambiadoExitosamente"
    />

    <!-- MODAL DE ASCENSO A EMPRESA (HU-CUE-06 / RF-CUE-06-07) -->
    <ModalAscensoEmpresa
      v-model="showAscensoModal"
      :initial-name="perfilDetallado?.nombre || userPerfil?.nombre"
      :initial-phone="perfilDetallado?.telefono || userPerfil?.telefono || ''"
      @success="onAscensoSuccess"
    />

    <!-- MODAL DE RENOVACIÓN DE NIT (HU-CUE-10) -->
    <ModalRenovarNit
      v-model="showRenovarNitModal"
      @success="onRenovarNitSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store';
import { usePerfil } from '@/modules/m04-cuentas/composables/usePerfil';
import { Modal } from '@/core/components';
import PerfilSidebarNav from '@/modules/m04-cuentas/components/perfil/PerfilSidebarNav.vue';
import TarjetaSoporte from '@/modules/m04-cuentas/components/perfil/TarjetaSoporte.vue';
import PerfilDatosForm, { type GuardarPerfilPayload } from '@/modules/m04-cuentas/components/perfil/PerfilDatosForm.vue';
import ModalConfirmarPassword from '@/modules/m04-cuentas/components/perfil/ModalConfirmarPassword.vue';
import ModalCambiarPassword from '@/modules/m04-cuentas/components/perfil/ModalCambiarPassword.vue';
import PasoVerificacion from '@/modules/m04-cuentas/components/registro/PasoVerificacion.vue';
import ModalAscensoEmpresa from '@/modules/m04-cuentas/components/empresas/ModalAscensoEmpresa.vue';
import ModalRenovarNit from '@/modules/m04-cuentas/components/empresas/ModalRenovarNit.vue';

const authStore = useAuthStore();
const userPerfil = computed(() => authStore.user);
const isEmpresa = computed(() => {
  const tipo = perfilDetallado.value?.tipo || userPerfil.value?.tipo;
  return tipo?.toLowerCase() === 'empresa';
});

const {
  guardando,
  enviandoSolicitudCorreo,
  errorMensaje,
  exitoMensaje,
  errorPasswordModal,
  perfilDetallado,
  direccionRegistrada,
  solicitudEmpresa,
  solicitudNit,
  limpiarAlertas,
  cargarDatos,
  actualizarPerfilYDireccion,
  solicitarCambioCorreo,
  confirmarCambioCorreo,
} = usePerfil();

onMounted(async () => {
  await cargarDatos();
});
const showConfirmPasswordModal = ref(false);
const showVerificacionCorreo = ref(false);
const showAscensoModal = ref(false);
const showRenovarNitModal = ref(false);
const showCambiarPasswordModal = ref(false);
const perfilFormRef = ref<InstanceType<typeof PerfilDatosForm> | null>(null);
const correoPendiente = ref('');
const datosPendientesGuardado = ref<GuardarPerfilPayload | null>(null);

async function onGuardarDatos(datos: GuardarPerfilPayload): Promise<void> {
  limpiarAlertas();
  datosPendientesGuardado.value = datos;

  // Si el usuario modificó el correo electrónico, exigir contraseña actual por seguridad (RF-CUE-06-03)
  if (datos.correo && datos.correo !== userPerfil.value?.correo) {
    correoPendiente.value = datos.correo;
    showConfirmPasswordModal.value = true;
    return;
  }

  await persistirDatos(datos);
}

async function onConfirmarPasswordCambioCorreo(contrasena: string): Promise<void> {
  const exitoso = await solicitarCambioCorreo(correoPendiente.value, contrasena);
  if (exitoso) {
    showConfirmPasswordModal.value = false;
    showVerificacionCorreo.value = true;
  }
}

async function onVerificacionCorreoExitosa(codigo?: string): Promise<void> {
  if (!codigo) return;
  const confirmado = await confirmarCambioCorreo(correoPendiente.value, codigo);
  if (confirmado) {
    showVerificacionCorreo.value = false;
    if (datosPendientesGuardado.value) {
      await persistirDatos(datosPendientesGuardado.value);
    }
  }
}

async function persistirDatos(datos: GuardarPerfilPayload): Promise<void> {
  const exitoso = await actualizarPerfilYDireccion(
    {
      nombre: datos.nombre,
      telefono: datos.telefono,
      correo: datos.correo,
      documento_identidad: datos.documento_identidad,
    },
    {
      direccion: datos.direccion,
      barrio: datos.barrio,
      nombre_apellido: datos.nombre,
      telefono: datos.telefono,
      latitud: datos.latitud,
      longitud: datos.longitud,
    }
  );
  if (exitoso) {
    perfilFormRef.value?.finalizarEdicion();
  }
}

function onAscensoSuccess(): void {
  limpiarAlertas();
  void cargarDatos();
}

function onRenovarNitSuccess(): void {
  limpiarAlertas();
  void cargarDatos();
}

function onPasswordCambiadoExitosamente(): void {
  limpiarAlertas();
}
</script>
