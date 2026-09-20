<template>
  <div class="bg-neutral-lightest min-h-screen font-sans pb-12">
    <!-- Header visual de la vista -->
    <div class="relative bg-white h-32 md:h-40 overflow-hidden mx-4 md:mx-8 mt-6 rounded-2xl shadow-sm border border-neutral-light flex justify-between">
      <div class="relative h-full flex flex-col justify-center px-8 md:px-12 z-10 w-full md:w-1/2 bg-gradient-to-r from-blue-50/90 via-blue-50/90 to-transparent">
        <h1 class="text-3xl font-black text-corporate mb-2">Mi Perfil</h1>
        <p class="text-neutral-medium text-sm max-w-md">
          Administra tu información personal y consulta el estado de tus pedidos.
        </p>
      </div>
      <div class="absolute inset-0 md:relative md:inset-auto md:w-1/2 h-full">
        <img src="@/assets/banner_perfil.png" alt="Fondo perfil" class="absolute inset-0 w-full h-full object-cover md:object-contain md:object-right" />
        <div class="absolute inset-0 bg-gradient-to-r from-blue-50/90 md:from-transparent to-transparent md:bg-none"></div>
      </div>
    </div>

    <!-- Contenido Principal con CSS Grid Responsivo -->
    <div class="container mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6 items-start">
      <!-- 1 y 2. NAVEGACIÓN Y SOPORTE LATERAL (SRP) -->
      <aside class="order-1 lg:col-start-1">
        <PerfilSidebarNav />
      </aside>

      <!-- 3. CONTENIDO Y FORMULARIO DE PERFIL (SRP + DIP) -->
      <main class="order-2 lg:col-start-2 min-w-0">
        <!-- Alertas globales de estado -->
        <div v-if="errorMensaje" class="mb-6 p-3 bg-danger-subtle border border-danger/30 rounded-xl text-danger text-sm font-medium">
          {{ errorMensaje }}
        </div>
        <div v-if="exitoMensaje" class="mb-6 p-3 bg-conversion/10 border border-conversion/30 rounded-xl text-conversion font-semibold text-sm">
          {{ exitoMensaje }}
        </div>

        <PerfilDatosForm
          ref="datosFormRef"
          :user="userPerfil"
          :is-empresa="isEmpresa"
          :guardando="guardando"
          @guardar="onGuardarDatos"
          @solicitar-ascenso="showAscensoModal = true"
        />
      </main>
    </div>

    <!-- MODAL DE CONFIRMACIÓN DE CONTRASEÑA (HU-SEG-01 / RF-CUE-06-03) -->
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

    <!-- MODAL DE ASCENSO A EMPRESA (HU-CUE-07) -->
    <ModalAscensoEmpresa
      v-model="showAscensoModal"
      :initial-name="userPerfil?.nombre"
      :initial-phone="userPerfil?.telefono || ''"
      @success="onAscensoSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store';
import { usePerfil } from '@/modules/m04-cuentas/composables/usePerfil';
import { Modal } from '@/core/components';
import PerfilSidebarNav from '@/modules/m04-cuentas/components/perfil/PerfilSidebarNav.vue';
import PerfilDatosForm from '@/modules/m04-cuentas/components/perfil/PerfilDatosForm.vue';
import ModalConfirmarPassword from '@/modules/m04-cuentas/components/perfil/ModalConfirmarPassword.vue';
import PasoVerificacion from '@/modules/m04-cuentas/components/registro/PasoVerificacion.vue';
import ModalAscensoEmpresa from '@/modules/m04-cuentas/components/empresas/ModalAscensoEmpresa.vue';

interface DatosFormulario {
  nombre: string;
  telefono: string;
  documento_identidad: string;
  correo: string;
  ciudad: string;
  direccion: string;
}

const authStore = useAuthStore();
const userPerfil = computed(() => authStore.user);
const isEmpresa = computed(() => userPerfil.value?.tipo?.toLowerCase() === 'empresa');

const {
  guardando,
  enviandoSolicitudCorreo,
  errorMensaje,
  exitoMensaje,
  errorPasswordModal,
  limpiarAlertas,
  actualizarPerfil,
  solicitarCambioCorreo,
  confirmarCambioCorreo,
} = usePerfil();

const datosFormRef = ref<InstanceType<typeof PerfilDatosForm> | null>(null);
const showConfirmPasswordModal = ref(false);
const showVerificacionCorreo = ref(false);
const showAscensoModal = ref(false);
const correoPendiente = ref('');
const datosPendientesGuardado = ref<DatosFormulario | null>(null);

async function onGuardarDatos(datos: DatosFormulario): Promise<void> {
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

async function persistirDatos(datos: DatosFormulario): Promise<void> {
  const ok = await actualizarPerfil({
    nombre: datos.nombre,
    telefono: datos.telefono,
    documento_identidad: datos.documento_identidad,
    correo: datos.correo,
    ciudad: datos.ciudad,
    direccion: datos.direccion,
  });

  if (ok && datosFormRef.value) {
    datosFormRef.value.finalizarEdicion();
    datosFormRef.value.sincronizarFallbacks(datos.ciudad, datos.direccion);
  }
}

function onAscensoSuccess(): void {
  limpiarAlertas();
  exitoMensaje.value = 'Solicitud de ascenso a cuenta empresa enviada con éxito.';
}
</script>
