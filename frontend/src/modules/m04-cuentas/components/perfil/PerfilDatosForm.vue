<template>
  <div class="bg-white rounded-2xl shadow-sm border border-neutral-light p-6 md:p-8">
    <div class="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 mb-8">
      <h2 class="text-xl md:text-2xl font-bold text-corporate text-center md:text-left">
        Información personal
      </h2>

      <div class="flex flex-row justify-center items-center gap-3 w-full md:w-auto">
        <template v-if="!isEmpresa">
          <Button
            v-if="!isEditing"
            variant="corporate"
            class="!rounded-lg text-sm px-4 py-2"
            @click="$emit('solicitarAscenso')"
          >
            Ascender a empresa
          </Button>
        </template>

        <Button
          v-if="!isEditing"
          variant="outline"
          class="!rounded-lg text-sm px-4 py-2"
          @click="iniciarEdicion"
        >
          <EditIcon class="w-4 h-4 mr-2" />
          Editar información
        </Button>

        <div v-else class="flex gap-2">
          <Button
            variant="outline"
            class="!rounded-lg text-sm px-4 py-2"
            :disabled="guardando"
            @click="cancelarEdicion"
          >
            Cancelar
          </Button>
          <Button
            variant="corporate"
            class="!rounded-lg text-sm px-4 py-2"
            :disabled="guardando"
            @click="guardarCambios"
          >
            {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
          </Button>
        </div>
      </div>
    </div>

    <div class="flex flex-col md:flex-row gap-8 items-center md:items-start">
      <!-- Avatar -->
      <div class="flex flex-col items-center gap-3 shrink-0">
        <div class="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-action border-2 border-white shadow-sm ring-4 ring-neutral-lightest overflow-hidden">
          <img v-if="user?.foto_url" :src="user.foto_url" alt="Foto perfil" class="w-full h-full object-cover" />
          <UserIcon v-else class="w-10 h-10" stroke-width="1.5" />
        </div>
        <Button variant="outline" class="!rounded-lg text-xs px-3 py-1.5 opacity-80 hover:opacity-100 transition-opacity">
          <CameraIcon class="w-3.5 h-3.5 mr-1.5" />
          Cambiar foto
        </Button>
      </div>

      <!-- Cuadrícula de Campos -->
      <div class="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
        <!-- NOMBRE -->
        <div class="flex gap-3 items-center md:items-start">
          <UserIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">
              {{ isEmpresa ? 'Nombre representante legal' : 'Nombre completo' }}
            </span>
            <input
              v-if="isEditing"
              v-model="form.nombre"
              type="text"
              placeholder="Nombre completo"
              class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
            />
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ user?.nombre || 'No registrado' }}
            </span>
          </div>
        </div>

        <!-- DOCUMENTO (BLOQUEADO POR POLÍTICA HU-CUE-06) -->
        <div class="flex gap-3 items-center md:items-start">
          <CreditCardIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full opacity-70" title="El documento de identidad no se puede modificar">
            <span class="block text-xs text-neutral-medium mb-1">Documento de identidad</span>
            <span class="block text-sm font-semibold text-corporate">{{ documentoFallback }}</span>
          </div>
        </div>

        <!-- CORREO ELECTRÓNICO -->
        <div class="flex gap-3 items-center md:items-start">
          <MailIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">Correo electrónico</span>
            <input
              v-if="isEditing"
              v-model="form.correo"
              type="email"
              placeholder="correo@ejemplo.com"
              class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
            />
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ user?.correo || 'No registrado' }}
            </span>
          </div>
        </div>

        <!-- CIUDAD -->
        <div class="flex gap-3 items-center md:items-start">
          <MapPinIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">Ciudad</span>
            <input
              v-if="isEditing"
              v-model="form.ciudad"
              type="text"
              placeholder="Ciudad"
              class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
            />
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ ciudadFallback }}
            </span>
          </div>
        </div>

        <!-- TELÉFONO -->
        <div class="flex gap-3 items-center md:items-start">
          <PhoneIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">Teléfono</span>
            <input
              v-if="isEditing"
              v-model="form.telefono"
              type="tel"
              placeholder="Teléfono"
              class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
            />
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ user?.telefono || 'No registrado' }}
            </span>
          </div>
        </div>

        <!-- DIRECCIÓN -->
        <div class="flex gap-3 items-center md:items-start">
          <HomeIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
          <div class="flex-1 w-full">
            <span class="block text-xs text-neutral-medium mb-1">Dirección</span>
            <input
              v-if="isEditing"
              v-model="form.direccion"
              type="text"
              placeholder="Dirección"
              class="w-full text-sm font-semibold text-corporate bg-transparent border-b-2 border-action/30 focus:border-action focus:outline-none focus:bg-subaction/30 px-1 py-1 rounded-t-md transition-colors"
            />
            <span v-else class="block text-sm font-semibold text-corporate">
              {{ direccionFallback }}
            </span>
          </div>
        </div>

        <!-- CAMPOS EXCLUSIVOS DE EMPRESA -->
        <template v-if="isEmpresa">
          <div class="flex gap-3 items-center md:items-start" title="Para cambiar la razón social comuníquese con soporte">
            <BuildingIcon class="w-5 h-5 text-neutral-medium shrink-0 mt-0 md:mt-1" />
            <div class="flex-1 w-full opacity-70">
              <span class="block text-xs text-neutral-medium mb-1">Nombre Empresa</span>
              <span class="block text-sm font-semibold text-corporate">{{ empresaData.nombre_empresa }}</span>
            </div>
          </div>

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
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { Button } from '@/core/components';
import type { UsuarioSeguro } from '@/modules/m04-cuentas/interfaces/registro.interface';
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
  Camera as CameraIcon,
} from 'lucide-vue-next';

interface FormularioPerfil {
  nombre: string;
  telefono: string;
  documento_identidad: string;
  correo: string;
  ciudad: string;
  direccion: string;
}

const props = defineProps<{
  user: UsuarioSeguro | null;
  isEmpresa: boolean;
  guardando: boolean;
}>();

const emit = defineEmits<{
  (e: 'guardar', datos: FormularioPerfil): void;
  (e: 'solicitarAscenso'): void;
}>();

const isEditing = ref(false);

const documentoFallback = ref('1.234.567.890');
const ciudadFallback = ref('Florencia, Caquetá');
const direccionFallback = ref('Cra 11 # 12 - 34, Florencia');

const empresaData = ref({
  nombre_empresa: 'Constructoras S.A.S',
  nit: '900123456-5',
});

const form = reactive<FormularioPerfil>({
  nombre: '',
  telefono: '',
  documento_identidad: '',
  correo: '',
  ciudad: '',
  direccion: '',
});

function sincronizarForm(): void {
  form.nombre = props.user?.nombre || '';
  form.telefono = props.user?.telefono || '';
  form.documento_identidad = documentoFallback.value;
  form.correo = props.user?.correo || '';
  form.ciudad = ciudadFallback.value;
  form.direccion = direccionFallback.value;
}

watch(() => props.user, () => sincronizarForm(), { immediate: true });

function iniciarEdicion(): void {
  sincronizarForm();
  isEditing.value = true;
}

function cancelarEdicion(): void {
  sincronizarForm();
  isEditing.value = false;
}

function guardarCambios(): void {
  emit('guardar', { ...form });
}

defineExpose({
  finalizarEdicion: () => {
    isEditing.value = false;
  },
  sincronizarFallbacks: (ciudad?: string, direccion?: string) => {
    if (ciudad) ciudadFallback.value = ciudad;
    if (direccion) direccionFallback.value = direccion;
  }
});
</script>
