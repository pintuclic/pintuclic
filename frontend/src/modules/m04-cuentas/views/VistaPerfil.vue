<template>
  <div class="bg-neutral-lightest min-h-screen font-sans pb-12">
    <!-- Header visual de la vista -->
    <div class="relative bg-white h-32 md:h-40 overflow-hidden mx-4 md:mx-8 mt-6 rounded-2xl shadow-sm border border-neutral-light">
      <img src="@/assets/banner_perfil.png" alt="Fondo perfil" class="absolute inset-0 w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-r from-blue-50/90 to-transparent"></div>
      <div class="relative h-full flex flex-col justify-center px-8 md:px-12">
        <h1 class="text-3xl font-black text-corporate mb-2">Mi Perfil</h1>
        <p class="text-neutral-medium text-sm max-w-md">
          Administra tu informaci&oacute;n personal y consulta el estado de tus pedidos.
        </p>
      </div>
    </div>

    <!-- Contenido de 2 columnas -->
    <div class="container mx-auto px-4 md:px-8 mt-6 flex flex-col lg:flex-row gap-6">
      
      <!-- COLUMNA IZQUIERDA (Sidebar) -->
      <div class="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4">
        
        <div class="bg-white rounded-2xl shadow-sm border border-neutral-light p-3">
          <nav class="flex flex-col gap-1">
            <button class="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-action font-semibold text-sm transition-colors text-left w-full">
              <UserIcon class="w-5 h-5 shrink-0" />
              <span>Mi Perfil</span>
            </button>
            <button class="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-medium hover:bg-neutral-lightest transition-colors text-sm font-medium text-left w-full">
              <PackageIcon class="w-5 h-5 shrink-0" />
              <span>Mis Pedidos</span>
            </button>
            
            <button v-if="isEmpresa" class="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-medium hover:bg-neutral-lightest transition-colors text-sm font-medium text-left w-full">
              <PhoneIcon class="w-5 h-5 shrink-0" />
              <span>Comun&iacute;cate con nosotros</span>
            </button>
          </nav>
        </div>

        <div class="bg-neutral-lightest border border-neutral-light rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
          <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-corporate mb-4 shadow-sm">
            <HeadphonesIcon class="w-5 h-5" />
          </div>
          <h3 class="text-corporate font-bold text-sm mb-2">&iquest;Necesitas ayuda?</h3>
          <p class="text-neutral-medium text-xs mb-4">
            Nuestro equipo est&aacute; listo para asesorarte.
          </p>
          <Button variant="corporate" size="sm" class="w-full text-xs">
            Contactar soporte
          </Button>
        </div>
      </div>

      <!-- COLUMNA DERECHA (Información) -->
      <div class="flex-1 flex flex-col gap-6">
        
        <div class="bg-white rounded-2xl shadow-sm border border-neutral-light p-6 md:p-8">
          
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 class="text-xl font-bold text-corporate">Informaci&oacute;n personal</h2>
            
            <div class="flex flex-wrap gap-3">
              <Button v-if="!isEmpresa && !isEditing" variant="corporate" size="sm" class="text-sm shadow-sm" @click="showAscensoModal = true">
                Ascender a empresa
              </Button>
              
              <template v-if="!isEditing">
                <Button variant="outline" size="sm" class="text-sm shadow-sm" @click="iniciarEdicion">
                  <EditIcon class="w-4 h-4 mr-2" />
                  Editar informaci&oacute;n
                </Button>
              </template>
              
              <template v-else>
                <Button variant="outline" size="sm" class="text-sm shadow-sm" @click="cancelarEdicion" :disabled="guardando">
                  Cancelar
                </Button>
                <Button variant="corporate" size="sm" class="text-sm shadow-sm" @click="guardarCambios" :disabled="guardando">
                  <span v-if="guardando">Guardando...</span>
                  <span v-else>Guardar cambios</span>
                </Button>
              </template>
            </div>
          </div>

          <!-- Alertas de estado -->
          <div v-if="errorMensaje" class="mb-6 p-3 bg-danger-subtle border border-danger/30 rounded-xl text-danger text-sm font-medium">
            {{ errorMensaje }}
          </div>
          <div v-if="exitoMensaje" class="mb-6 p-3 bg-conversion/10 border border-conversion/30 rounded-xl text-conversion font-semibold text-sm">
            {{ exitoMensaje }}
          </div>

          <div class="flex flex-col md:flex-row gap-8 items-start">
            
            <!-- Avatar -->
            <div class="flex flex-col items-center gap-3 shrink-0">
              <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-action shadow-inner">
                <UserIcon class="w-10 h-10" />
              </div>
              <Button variant="outline" size="sm" class="text-xs h-8 px-3 rounded-full text-action border-action hover:bg-action hover:text-white">
                <CameraIcon class="w-3 h-3 mr-1" />
                Cambiar foto
              </Button>
            </div>

            <!-- Campos -->
            <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              
              <!-- Componente genérico para campos: renderiza input si edita, span si no -->
              
              <!-- NOMBRE (Común / Representante) -->
              <div class="flex gap-3">
                <UserIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-1" />
                <div class="flex-1">
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

              <!-- DOCUMENTO -->
              <div class="flex gap-3">
                <CreditCardIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-1" />
                <div class="flex-1">
                  <span class="block text-xs text-neutral-medium mb-1">Documento de identidad</span>
                  <input 
                    v-if="isEditing"
                    v-model="editForm.documento_identidad"
                    type="text" 
                    class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-blue-50/30 px-1 py-1 rounded-t-md transition-colors"
                  />
                  <span v-else class="block text-sm font-semibold text-corporate">{{ documentoFallback }}</span>
                </div>
              </div>

              <!-- CORREO (Solo lectura) -->
              <div class="flex gap-3 opacity-70" title="El correo no se puede editar aquí">
                <MailIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-1" />
                <div class="flex-1">
                  <span class="block text-xs text-neutral-medium mb-1">Correo electr&oacute;nico</span>
                  <span class="block text-sm font-semibold text-corporate">{{ userPerfil?.correo || 'No registrado' }}</span>
                </div>
              </div>

              <!-- CIUDAD -->
              <div class="flex gap-3 opacity-70">
                <MapPinIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-1" />
                <div class="flex-1">
                  <span class="block text-xs text-neutral-medium mb-1">Ciudad</span>
                  <span class="block text-sm font-semibold text-corporate">{{ ciudadFallback }}</span>
                </div>
              </div>

              <!-- TELÉFONO -->
              <div class="flex gap-3">
                <PhoneIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-1" />
                <div class="flex-1">
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
              <div class="flex gap-3 opacity-70">
                <HomeIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-1" />
                <div class="flex-1">
                  <span class="block text-xs text-neutral-medium mb-1">Direcci&oacute;n</span>
                  <span class="block text-sm font-semibold text-corporate">{{ direccionFallback }}</span>
                </div>
              </div>

              <!-- CAMPOS EXTRA DE EMPRESA -->
              <template v-if="isEmpresa">
                <!-- NOMBRE EMPRESA -->
                <div class="flex gap-3 opacity-70" title="Para cambiar la razón social comuníquese con soporte">
                  <BuildingIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-1" />
                  <div class="flex-1">
                    <span class="block text-xs text-neutral-medium mb-1">Nombre Empresa</span>
                    <span class="block text-sm font-semibold text-corporate">{{ empresaData.nombre_empresa }}</span>
                  </div>
                </div>

                <!-- NIT -->
                <div class="flex gap-3 opacity-70">
                  <FileTextIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-1" />
                  <div class="flex-1">
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
import { useAuthStore } from '@/modules/m04-cuentas/store/auth.store';
import { CuentasService } from '@/modules/m04-cuentas/services/cuentas.service';
import Button from '@/core/components/buttons/Button.vue';
import ModalAscensoEmpresa from '@/modules/m04-cuentas/components/ModalAscensoEmpresa.vue';
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

const authStore = useAuthStore();
const userPerfil = computed(() => authStore.user);

const isEmpresa = computed(() => userPerfil.value?.tipo?.toLowerCase() === 'empresa');

// Fallbacks de datos faltantes en Payload UsuarioSeguro (temporal)
const documentoFallback = ref('1.234.567.890');
const ciudadFallback = 'Florencia, Caquetá';
const direccionFallback = 'Cra 11 # 12 - 34, Florencia';

const empresaData = computed(() => ({
  nombre_empresa: 'Constructoras S.A.S',
  nit: '900123456-5'
}));

// -- LÓGICA DE EDICIÓN IN-PLACE --
const isEditing = ref(false);
const guardando = ref(false);
const errorMensaje = ref<string | null>(null);
const exitoMensaje = ref<string | null>(null);

const editForm = reactive({
  nombre: '',
  telefono: '',
  documento_identidad: ''
});

const iniciarEdicion = () => {
  errorMensaje.value = null;
  exitoMensaje.value = null;
  editForm.nombre = userPerfil.value?.nombre || '';
  editForm.telefono = userPerfil.value?.telefono || '';
  editForm.documento_identidad = documentoFallback.value;
  isEditing.value = true;
};

const cancelarEdicion = () => {
  errorMensaje.value = null;
  isEditing.value = false;
};

const guardarCambios = async () => {
  guardando.value = true;
  errorMensaje.value = null;
  exitoMensaje.value = null;
  try {
    const payload = {
      nombre: editForm.nombre,
      telefono: editForm.telefono,
      documento_identidad: editForm.documento_identidad
    };
    
    await CuentasService.actualizarPerfil(payload);
    
    // Actualizar la memoria del frontend (Store Pinia) al instante
    authStore.updateUser({
      nombre: editForm.nombre,
      telefono: editForm.telefono
    });
    documentoFallback.value = editForm.documento_identidad; // Reflejar en fallback
    
    isEditing.value = false;
    exitoMensaje.value = 'Información actualizada exitosamente.';
  } catch (error) {
    console.error('Error al actualizar el perfil:', error);
    errorMensaje.value = 'No se pudo guardar la información. Verifique los datos ingresados.';
  } finally {
    guardando.value = false;
  }
};

// -- LÓGICA DE ASCENSO A EMPRESA --
const showAscensoModal = ref(false);

const onAscensoSuccess = () => {
  console.log('Ascenso enviado con éxito, actualizando UI si es necesario');
  // Se podría recargar el perfil si backend cambia el estado de inmediato
};
</script>
