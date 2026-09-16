<template>
  <div class="bg-neutral-lightest min-h-screen font-sans pb-12">
    <!-- Header visual de la vista -->
    <div class="relative bg-white h-32 md:h-40 overflow-hidden mx-4 md:mx-8 mt-6 rounded-2xl shadow-sm border border-neutral-light flex justify-between">
      <div class="relative h-full flex flex-col justify-center px-8 md:px-12 z-10 w-full md:w-1/2 bg-gradient-to-r from-blue-50/90 via-blue-50/90 to-transparent">
        <h1 class="text-3xl font-black text-corporate mb-2">Mi Perfil</h1>
        <p class="text-neutral-medium text-sm max-w-md">
          Administra tu informaci&oacute;n personal y consulta el estado de tus pedidos.
        </p>
      </div>
      <div class="absolute inset-0 md:relative md:inset-auto md:w-1/2 h-full">
        <img src="@/assets/banner_perfil.png" alt="Fondo perfil" class="absolute inset-0 w-full h-full object-cover md:object-contain md:object-right" />
        <div class="absolute inset-0 bg-gradient-to-r from-blue-50/90 md:from-transparent to-transparent md:bg-none"></div>
      </div>
    </div>

    <!-- Contenido Principal con CSS Grid -->
    <div class="container mx-auto px-4 md:px-8 mt-6 grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6 items-start">
      
      <!-- 1. NAVEGACIÓN (Primero en móvil, Izquierda Arriba en PC) -->
      <div class="order-1 lg:col-start-1 lg:row-start-1 bg-white rounded-2xl shadow-sm border border-neutral-light p-2">
        <nav class="flex flex-row lg:flex-col gap-2">
          <Button variant="subaction" class="flex-1 lg:w-full !rounded-xl !justify-center lg:!justify-start !px-2 lg:!px-4 !py-3 font-semibold transition-all" @click="handleNavegacion('/perfil')">
            <UserIcon class="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 lg:mr-3" />
            <span class="text-xs lg:text-sm whitespace-nowrap">Mi Perfil</span>
          </Button>
          <Button variant="outline" class="flex-1 lg:w-full !rounded-xl !justify-center lg:!justify-start !px-2 lg:!px-4 !py-3 !text-neutral-medium hover:!text-corporate hover:!bg-neutral-lightest !no-underline font-medium transition-all" @click="handleNavegacion('/pedidos')">
            <PackageIcon class="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 lg:mr-3" />
            <span class="text-xs lg:text-sm whitespace-nowrap">Mis Pedidos</span>
          </Button>
        </nav>
      </div>

      <!-- 2. SOPORTE (Tercero en móvil, Izquierda Abajo en PC) -->
      <div class="order-3 lg:col-start-1 lg:row-start-2 bg-white rounded-2xl p-6 shadow-sm border border-neutral-light text-center mt-0 lg:mt-[-1rem]">
        <div class="w-10 h-10 bg-neutral-lightest rounded-full flex items-center justify-center mx-auto mb-3">
          <HeadphonesIcon class="w-5 h-5 text-neutral-dark" />
        </div>
        <h3 class="text-corporate font-bold text-base mb-1">&iquest;Necesitas ayuda?</h3>
        <p class="text-neutral-medium text-xs mb-4">Nuestro equipo est&aacute; listo para asesorarte.</p>
        <Button variant="corporate" class="w-full text-xs shadow-sm">
          Contactar soporte
        </Button>
      </div>

      <!-- 3. CONTENIDO DEL PERFIL (Segundo en móvil, Derecha en PC ocupando 2 filas) -->
      <div class="order-2 lg:col-start-2 lg:row-span-2 min-w-0">
        <div class="bg-white rounded-2xl shadow-sm border border-neutral-light p-6 md:p-8">
          
          <div class="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-8">
            <h2 class="text-xl md:text-2xl font-bold text-corporate text-center md:text-left">Informaci&oacute;n personal</h2>
            
            <div class="flex flex-row justify-center items-center gap-3 w-full md:w-auto">
              <template v-if="!isEmpresa">
                <Button v-if="!isEditing" variant="corporate" class="!rounded-lg text-sm px-4 py-2" @click="showAscensoModal = true">
                  Ascender a empresa
                </Button>
              </template>
              
              <Button v-if="!isEditing" variant="outline" class="!rounded-lg text-sm px-4 py-2" @click="iniciarEdicion">
                <EditIcon class="w-4 h-4 mr-2" />
                Editar informaci&oacute;n
              </Button>
              <div v-else class="flex gap-2">
                <Button variant="outline" class="!rounded-lg text-sm px-4 py-2" @click="cancelarEdicion" :disabled="guardando">
                  Cancelar
                </Button>
                <Button variant="corporate" class="!rounded-lg text-sm px-4 py-2" @click="guardarCambios" :disabled="guardando">
                  {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
                </Button>
              </div>
            </div>
          </div>

          <!-- Alertas de estado -->
          <div v-if="errorMensaje" class="mb-6 p-3 bg-danger-subtle border border-danger/30 rounded-xl text-danger text-sm font-medium">
            {{ errorMensaje }}
          </div>
          <div v-if="exitoMensaje" class="mb-6 p-3 bg-conversion/10 border border-conversion/30 rounded-xl text-conversion font-semibold text-sm">
            {{ exitoMensaje }}
          </div>

          <div class="flex flex-col md:flex-row gap-8 items-center md:items-start">
            
            <!-- Avatar -->
            <div class="flex flex-col items-center gap-3 shrink-0">
              <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-action border-2 border-white shadow-sm ring-4 ring-neutral-lightest overflow-hidden">
                <img v-if="userPerfil?.foto_url" :src="userPerfil.foto_url" class="w-full h-full object-cover" />
                <UserIcon v-else class="w-10 h-10" stroke-width="1.5" />
              </div>
              <Button variant="outline" class="!rounded-lg text-xs px-3 py-1.5 opacity-80 hover:opacity-100 transition-opacity">
                <CameraIcon class="w-3.5 h-3.5 mr-1.5" />
                Cambiar foto
              </Button>
            </div>

            <!-- Campos -->
            <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              
              <!-- NOMBRE (Común / Representante) -->
              <div class="flex gap-3 items-center md:items-start">
                <UserIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
                <div class="flex-1 w-full">
                  <span class="block text-xs text-neutral-medium mb-1">{{ isEmpresa ? 'Nombre representante legal' : 'Nombre completo' }}</span>
                  <input 
                    v-if="isEditing"
                    v-model="editForm.nombre"
                    type="text" 
                    class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-blue-50/30 px-1 py-1 rounded-t-md transition-colors"
                  />
                  <span v-else class="block text-sm font-semibold text-corporate">{{ userPerfil?.nombre || 'No registrado' }}</span>
                </div>
              </div>

              <!-- DOCUMENTO (NO EDITABLE SEGÚN POLÍTICA) -->
              <div class="flex gap-3 items-center md:items-start">
                <CreditCardIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
                <div class="flex-1 w-full opacity-70" title="El documento de identidad no se puede modificar">
                  <span class="block text-xs text-neutral-medium mb-1">Documento de identidad</span>
                  <span class="block text-sm font-semibold text-corporate">{{ documentoFallback }}</span>
                </div>
              </div>

              <!-- CORREO -->
              <div class="flex gap-3 items-center md:items-start">
                <MailIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
                <div class="flex-1 w-full">
                  <span class="block text-xs text-neutral-medium mb-1">Correo electr&oacute;nico</span>
                  <input 
                    v-if="isEditing"
                    v-model="editForm.correo"
                    type="email" 
                    class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-blue-50/30 px-1 py-1 rounded-t-md transition-colors"
                  />
                  <span v-else class="block text-sm font-semibold text-corporate">{{ userPerfil?.correo || 'No registrado' }}</span>
                </div>
              </div>

              <!-- CIUDAD -->
              <div class="flex gap-3 items-center md:items-start">
                <MapPinIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
                <div class="flex-1 w-full">
                  <span class="block text-xs text-neutral-medium mb-1">Ciudad</span>
                  <input 
                    v-if="isEditing"
                    v-model="editForm.ciudad"
                    type="text" 
                    class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-blue-50/30 px-1 py-1 rounded-t-md transition-colors"
                  />
                  <span v-else class="block text-sm font-semibold text-corporate">{{ ciudadFallback }}</span>
                </div>
              </div>

              <!-- TELÉFONO -->
              <div class="flex gap-3 items-center md:items-start">
                <PhoneIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
                <div class="flex-1 w-full">
                  <span class="block text-xs text-neutral-medium mb-1">Tel&eacute;fono</span>
                  <input 
                    v-if="isEditing"
                    v-model="editForm.telefono"
                    type="tel" 
                    class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-blue-50/30 px-1 py-1 rounded-t-md transition-colors"
                  />
                  <span v-else class="block text-sm font-semibold text-corporate">{{ userPerfil?.telefono || 'No registrado' }}</span>
                </div>
              </div>

              <!-- DIRECCIÓN -->
              <div class="flex gap-3 items-center md:items-start">
                <HomeIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
                <div class="flex-1 w-full">
                  <span class="block text-xs text-neutral-medium mb-1">Direcci&oacute;n</span>
                  <input 
                    v-if="isEditing"
                    v-model="editForm.direccion"
                    type="text" 
                    class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-blue-50/30 px-1 py-1 rounded-t-md transition-colors"
                  />
                  <span v-else class="block text-sm font-semibold text-corporate">{{ direccionFallback }}</span>
                </div>
              </div>

              <!-- CAMPOS EXTRA DE EMPRESA -->
              <template v-if="isEmpresa">
                <!-- NOMBRE EMPRESA -->
                <div class="flex gap-3 items-center md:items-start" title="Para cambiar la razón social comuníquese con soporte">
                  <BuildingIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
                  <div class="flex-1 w-full opacity-70">
                    <span class="block text-xs text-neutral-medium mb-1">Nombre Empresa</span>
                    <span class="block text-sm font-semibold text-corporate">{{ empresaData.nombre_empresa }}</span>
                  </div>
                </div>

                <!-- NIT -->
                <div class="flex gap-3 items-center md:items-start">
                  <FileTextIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
                  <div class="flex-1 w-full opacity-70">
                    <span class="block text-xs text-neutral-medium mb-1">NIT</span>
                    <span class="block text-sm font-semibold text-corporate">{{ empresaData.nit }}</span>
                  </div>
                </div>
              </template>
              
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- MODAL CONFIRMAR CONTRASEÑA PARA CAMBIO DE CORREO -->
    <Modal v-model="showConfirmPasswordModal" maxWidth="md" title="Confirmar Identidad" accent>
      <div class="p-6">
        <div class="mb-4">
          <h3 class="text-lg font-bold text-corporate mb-2">Autorización de Seguridad</h3>
          <p class="text-sm text-neutral-medium">
            Por seguridad de su cuenta, ingrese su contraseña actual para autorizar el cambio de correo electrónico a <strong>{{ editForm.correo }}</strong>. Enviaremos un código de confirmación a su correo actual vigente.
          </p>
        </div>

        <div v-if="errorPasswordModal" class="mb-4 p-3 rounded-md bg-subaction border border-action/30 text-sm font-medium text-corporate text-center">
          {{ errorPasswordModal }}
        </div>

        <form @submit.prevent="solicitarCodigoCambioCorreo" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-neutral-dark mb-1">Contraseña Actual</label>
            <input
              v-model="contrasenaActual"
              type="password"
              placeholder="••••••••"
              class="w-full px-3 py-2 text-sm rounded-input border border-neutral-light focus:border-corporate focus:ring-1 focus:ring-corporate outline-none transition-colors"
              required
            />
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <Button
              type="button"
              variant="subaction"
              size="md"
              @click="cancelarCambioCorreo"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="corporate"
              size="md"
              :disabled="enviandoSolicitudCorreo || !contrasenaActual"
            >
              {{ enviandoSolicitudCorreo ? 'Verificando...' : 'Continuar' }}
            </Button>
          </div>
        </form>
      </div>
    </Modal>

    <!-- MODAL VERIFICAR CAMBIO DE CORREO -->
    <Modal v-model="showVerificacionCorreo" maxWidth="md" accent>
      <PasoVerificacion 
        :correo="userPerfil?.correo || editForm.correo" 
        :isCambioCorreo="true"
        @verificado="onVerificacionCorreoExitosa"
        @volver="showVerificacionCorreo = false"
      />
    </Modal>

    <!-- MODAL ASCENSO A EMPRESA -->
    <ModalAscensoEmpresa 
      v-model="showAscensoModal" 
      :initialName="userPerfil?.nombre"
      :initialPhone="userPerfil?.telefono || ''"
      @success="onAscensoSuccess"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store';
import { CuentasService } from '@/modules/m04-cuentas/services/cuentas.service';
import { Button, Modal } from '@/core/components';
import ModalAscensoEmpresa from '@/modules/m04-cuentas/components/ModalAscensoEmpresa.vue';
import PasoVerificacion from '@/modules/m04-cuentas/components/PasoVerificacion.vue';
import {
  User as UserIcon,
  Package as PackageIcon,
  Phone as PhoneIcon,
  Headphones as HeadphonesIcon,
  Edit2 as EditIcon,
  Camera as CameraIcon,
  CreditCard as CreditCardIcon,
  Mail as MailIcon,
  MapPin as MapPinIcon,
  Home as HomeIcon,
  Building as BuildingIcon,
  FileText as FileTextIcon
} from 'lucide-vue-next';

const router = useRouter();
const handleNavegacion = (path: string) => {
  router.push(path);
};

const authStore = useAuthStore();
const userPerfil = computed(() => authStore.user);

const isEmpresa = computed(() => userPerfil.value?.tipo?.toLowerCase() === 'empresa');

// Fallbacks de datos reactivos
const documentoFallback = ref('1.234.567.890');
const ciudadFallback = ref('Florencia, Caquetá');
const direccionFallback = ref('Cra 11 # 12 - 34, Florencia');

const empresaData = computed(() => ({
  nombre_empresa: 'Constructoras S.A.S',
  nit: '900123456-5'
}));

// -- LÓGICA DE EDICIÓN IN-PLACE --
const isEditing = ref(false);
const guardando = ref(false);
const showConfirmPasswordModal = ref(false);
const showVerificacionCorreo = ref(false);
const contrasenaActual = ref('');
const errorPasswordModal = ref<string | null>(null);
const enviandoSolicitudCorreo = ref(false);
const errorMensaje = ref<string | null>(null);
const exitoMensaje = ref<string | null>(null);

interface ApiErrorLike {
  response?: {
    data?: {
      mensaje?: string;
    };
  };
}

const editForm = reactive({
  nombre: '',
  telefono: '',
  documento_identidad: '',
  correo: '',
  ciudad: '',
  direccion: '',
});

const iniciarEdicion = () => {
  errorMensaje.value = null;
  exitoMensaje.value = null;
  editForm.nombre = userPerfil.value?.nombre || '';
  editForm.telefono = userPerfil.value?.telefono || '';
  editForm.documento_identidad = documentoFallback.value;
  editForm.correo = userPerfil.value?.correo || '';
  editForm.ciudad = ciudadFallback.value;
  editForm.direccion = direccionFallback.value;
  isEditing.value = true;
};

const cancelarEdicion = () => {
  errorMensaje.value = null;
  isEditing.value = false;
};

const cancelarCambioCorreo = () => {
  showConfirmPasswordModal.value = false;
  contrasenaActual.value = '';
  errorPasswordModal.value = null;
};

const guardarCambios = async () => {
  errorMensaje.value = null;
  exitoMensaje.value = null;

  if (editForm.correo && editForm.correo !== userPerfil.value?.correo) {
    // Si cambió el correo, solicitamos primero la contraseña actual (RF-CUE-06-03)
    contrasenaActual.value = '';
    errorPasswordModal.value = null;
    showConfirmPasswordModal.value = true;
    return;
  }
  await ejecutarGuardado();
};

const solicitarCodigoCambioCorreo = async () => {
  if (!contrasenaActual.value) return;
  errorPasswordModal.value = null;
  enviandoSolicitudCorreo.value = true;
  try {
    await CuentasService.solicitarCambioCorreo(editForm.correo, contrasenaActual.value);
    showConfirmPasswordModal.value = false;
    contrasenaActual.value = '';
    showVerificacionCorreo.value = true;
  } catch (error: unknown) {
    console.error('Error al solicitar cambio de correo:', error);
    const err = error as ApiErrorLike;
    errorPasswordModal.value =
      err.response?.data?.mensaje ||
      'No se pudo autorizar la solicitud. Verifique su contraseña actual.';
  } finally {
    enviandoSolicitudCorreo.value = false;
  }
};

const onVerificacionCorreoExitosa = async (codigo?: string) => {
  if (!codigo) return;
  guardando.value = true;
  errorMensaje.value = null;
  try {
    const res = await CuentasService.confirmarCambioCorreo(editForm.correo, codigo);
    showVerificacionCorreo.value = false;

    const nuevoCorreoConfirmado = res.data?.nuevoCorreo || editForm.correo;
    authStore.updateUser({
      correo: nuevoCorreoConfirmado,
    });

    await ejecutarGuardado(true);
    exitoMensaje.value =
      'Correo electrónico y datos de perfil actualizados exitosamente. Se ha enviado una notificación a ambas direcciones.';
  } catch (error: unknown) {
    console.error('Error al confirmar cambio de correo:', error);
    const err = error as ApiErrorLike;
    errorMensaje.value =
      err.response?.data?.mensaje || 'Código de verificación incorrecto o expirado.';
  } finally {
    guardando.value = false;
  }
};

const ejecutarGuardado = async (omitirMensajeExito = false) => {
  guardando.value = true;
  errorMensaje.value = null;
  if (!omitirMensajeExito) {
    exitoMensaje.value = null;
  }
  try {
    const payload = {
      nombre: editForm.nombre,
      telefono: editForm.telefono,
      documento_identidad: editForm.documento_identidad,
      correo: editForm.correo,
      ciudad: editForm.ciudad,
      direccion: editForm.direccion,
    };

    await CuentasService.actualizarPerfil(payload);

    // Actualizar la memoria del frontend (Store Pinia)
    authStore.updateUser({
      nombre: editForm.nombre,
      telefono: editForm.telefono,
      correo: editForm.correo,
    });
    documentoFallback.value = editForm.documento_identidad;
    ciudadFallback.value = editForm.ciudad;
    direccionFallback.value = editForm.direccion;

    isEditing.value = false;
    if (!omitirMensajeExito) {
      exitoMensaje.value = 'Información actualizada exitosamente.';
    }
  } catch (error: unknown) {
    console.error('Error al actualizar el perfil:', error);
    const err = error as ApiErrorLike;
    errorMensaje.value =
      err.response?.data?.mensaje ||
      'No se pudo guardar la información. Verifique los datos ingresados.';
  } finally {
    guardando.value = false;
  }
};

// -- LÓGICA DE ASCENSO A EMPRESA --
const showAscensoModal = ref(false);

const onAscensoSuccess = () => {
  exitoMensaje.value = 'Solicitud de ascenso enviada con éxito.';
};
</script>
